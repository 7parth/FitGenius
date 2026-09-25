"""
Stage 3 ML Recommender — TruncatedSVD collaborative filtering.

Trained on a user × exercise interaction matrix (implicit feedback:
number of times a user has completed each exercise across all sessions).

This module is used by Task 14 for full training; the recommendation_engine
falls back to content-based if the model is not yet trained.
"""

from __future__ import annotations

import os
import pickle
import logging
from pathlib import Path

import numpy as np

logger = logging.getLogger("fitgenius.ml")

_MODEL_PATH = Path(os.getenv("ML_MODEL_PATH", "models/recommendation_model.pkl"))


class MLRecommender:
    """
    Thin wrapper around a trained TruncatedSVD model.
    Loaded once and cached as a module-level singleton.
    """

    _instance: "MLRecommender | None" = None
    _model_data: dict | None = None

    def __new__(cls) -> "MLRecommender":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load()
        return cls._instance

    def _load(self) -> None:
        if _MODEL_PATH.exists():
            try:
                with open(_MODEL_PATH, "rb") as f:
                    self._model_data = pickle.load(f)
                logger.info("ML recommendation model loaded from %s", _MODEL_PATH)
            except Exception as exc:
                logger.warning("Failed to load ML model: %s", exc)
                self._model_data = None
        else:
            self._model_data = None

    def is_trained(self) -> bool:
        return self._model_data is not None

    def predict(self, user_id: str, candidate_exercise_ids: list[str], top_n: int = 6) -> list[str]:
        """
        Return up to top_n exercise IDs predicted to be most relevant for user_id.
        Falls back to shuffled candidates if user is unknown.
        """
        if not self.is_trained() or not self._model_data:
            return candidate_exercise_ids[:top_n]

        user_index: dict[str, int] = self._model_data.get("user_index", {})
        exercise_index: dict[str, int] = self._model_data.get("exercise_index", {})
        user_factors: np.ndarray = self._model_data.get("user_factors")   # shape (n_users, k)
        item_factors: np.ndarray = self._model_data.get("item_factors")   # shape (n_items, k)

        if user_id not in user_index:
            # Cold-start within ML stage: return in original order
            return candidate_exercise_ids[:top_n]

        u_vec = user_factors[user_index[user_id]]  # (k,)

        # Score candidates
        scored: list[tuple[float, str]] = []
        for ex_id in candidate_exercise_ids:
            if ex_id in exercise_index:
                i_vec = item_factors[exercise_index[ex_id]]
                score = float(np.dot(u_vec, i_vec))
                scored.append((score, ex_id))
            else:
                # Unseen exercise — give neutral score
                scored.append((0.0, ex_id))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [ex_id for _, ex_id in scored[:top_n]]

    @classmethod
    def reload(cls) -> None:
        """Force reload from disk (called after model_trainer saves a new model)."""
        cls._instance = None
