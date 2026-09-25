"""
Model trainer — builds and saves the TruncatedSVD recommendation model.

Run manually or via a scheduled job:
    python -m app.ml.model_trainer

Requires at least 20 completed sessions across the user base to produce
a meaningful model. No-ops gracefully if data is insufficient.
"""

from __future__ import annotations

import logging
import os
import pickle
from collections import defaultdict
from pathlib import Path

import numpy as np

logger = logging.getLogger("fitgenius.trainer")

_MODEL_PATH = Path(os.getenv("ML_MODEL_PATH", "models/recommendation_model.pkl"))
_MIN_INTERACTIONS = 20


def train_and_save(db_session) -> bool:
    """
    Build user × exercise interaction matrix from session history and train
    a TruncatedSVD model. Returns True if model was saved successfully.
    """
    from app.models.workout import WorkoutSession, WorkoutSessionExercise, SessionStatus

    sessions = (
        db_session.query(WorkoutSession)
        .filter(WorkoutSession.status == SessionStatus.completed)
        .all()
    )

    # Build interaction counts: {user_id: {exercise_id: count}}
    interactions: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for session in sessions:
        for se in session.exercises:
            interactions[session.user_id][se.exercise_id] += 1

    n_interactions = sum(
        count
        for user_counts in interactions.values()
        for count in user_counts.values()
    )

    if n_interactions < _MIN_INTERACTIONS:
        logger.info(
            "Insufficient data for ML training (%d interactions, need %d)",
            n_interactions,
            _MIN_INTERACTIONS,
        )
        return False

    # Build ordered indices
    user_ids = sorted(interactions.keys())
    exercise_ids = sorted({
        ex_id
        for user_counts in interactions.values()
        for ex_id in user_counts.keys()
    })
    user_index = {uid: i for i, uid in enumerate(user_ids)}
    exercise_index = {eid: i for i, eid in enumerate(exercise_ids)}

    n_users = len(user_ids)
    n_items = len(exercise_ids)
    n_components = min(50, n_users - 1, n_items - 1)

    if n_components < 2:
        logger.info("Too few unique users/exercises for SVD training")
        return False

    # Build sparse interaction matrix (dense for simplicity at this scale)
    matrix = np.zeros((n_users, n_items), dtype=np.float32)
    for uid, exercise_counts in interactions.items():
        u = user_index[uid]
        for eid, count in exercise_counts.items():
            matrix[u, exercise_index[eid]] = float(count)

    # Binarise + log-scale implicit feedback
    matrix = np.log1p(matrix)

    try:
        from sklearn.decomposition import TruncatedSVD

        svd = TruncatedSVD(n_components=n_components, random_state=42)
        user_factors = svd.fit_transform(matrix)   # (n_users, k)
        item_factors = svd.components_.T            # (n_items, k)

        model_data = {
            "user_index": user_index,
            "exercise_index": exercise_index,
            "user_factors": user_factors,
            "item_factors": item_factors,
            "n_components": n_components,
        }

        _MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(_MODEL_PATH, "wb") as f:
            pickle.dump(model_data, f, protocol=pickle.HIGHEST_PROTOCOL)

        logger.info(
            "ML model saved to %s (users=%d, exercises=%d, k=%d)",
            _MODEL_PATH, n_users, n_items, n_components,
        )

        # Invalidate singleton so next prediction uses new model
        from app.ml.ml_recommender import MLRecommender
        MLRecommender.reload()
        return True

    except Exception as exc:
        logger.exception("Model training failed: %s", exc)
        return False


if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO)

    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        success = train_and_save(db)
        sys.exit(0 if success else 1)
    finally:
        db.close()
