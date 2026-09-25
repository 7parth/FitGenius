"""
ML Recommendation Engine tests — Task 14.

Tests cover:
- Stage selection logic (cold-start / content-based / ml-hybrid thresholds)
- MLRecommender singleton (is_trained when no model on disk)
- model_trainer.train_and_save — no-op when data < 20 interactions
- model_trainer.train_and_save — succeeds with synthetic data + scikit-learn
- Recommendation API endpoints (generate, feedback, history)
"""
import os
import pytest
import uuid as _uuid


def _register(client):
    email = f"ml-test-{_uuid.uuid4().hex[:6]}@fitgenius.com"
    resp = client.post("/api/auth/register", json={
        "email": email,
        "password": "TestPass1",
        "display_name": "ML Tester",
    })
    assert resp.status_code == 201
    return resp.json()["access_token"]


# ── Stage selection ────────────────────────────────────────────────────────────

def _seed_exercises(db, count: int = 6):
    """Insert minimal exercises so the rule-based engine has something to pick."""
    from app.models.exercise import Exercise
    exercises = []
    for i in range(count):
        e = Exercise(
            name=f"Seed Exercise {i}",
            slug=f"seed-ex-{i}",
            category="strength",
            difficulty="beginner",
            default_sets=3,
            is_active=True,
        )
        db.add(e)
        db.flush()
        exercises.append(e)
    db.commit()
    return exercises


class TestRecommendationStageSelection:
    """
    Verify that generate returns a valid Recommendation object for cold-start users.
    Stage is rule_based (< 3 sessions).
    """

    def test_generate_returns_recommendation_cold_start(self, client, db):
        """Fresh user (0 sessions) → rule_based stage."""
        _seed_exercises(db)
        token = _register(client)
        resp = client.post(
            "/api/recommendations/generate",
            headers={"Authorization": f"Bearer {token}"},
            json={},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert "payload" in data
        assert "stage" in data
        assert data["stage"] == "rule_based"
        assert "exercises" in data["payload"]
        assert len(data["payload"]["exercises"]) > 0

    def test_generate_recommendation_has_rationale(self, client, db):
        """Rationale field must always be present and non-empty."""
        _seed_exercises(db)
        token = _register(client)
        resp = client.post(
            "/api/recommendations/generate",
            headers={"Authorization": f"Bearer {token}"},
            json={},
        )
        assert resp.status_code == 201
        payload = resp.json()["payload"]
        assert "rationale" in payload
        assert isinstance(payload["rationale"], str)
        assert len(payload["rationale"]) > 0

    def test_generate_respects_context_override(self, client, db):
        """Context override dict is accepted without error."""
        _seed_exercises(db)
        token = _register(client)
        resp = client.post(
            "/api/recommendations/generate",
            headers={"Authorization": f"Bearer {token}"},
            json={"context_override": {"target_muscle": "quadriceps"}},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert "payload" in data

    def test_get_latest_recommendation(self, client, db):
        """Latest recommendation returns the most recent generated one."""
        _seed_exercises(db)
        token = _register(client)
        headers = {"Authorization": f"Bearer {token}"}

        gen_resp = client.post("/api/recommendations/generate", headers=headers, json={})
        assert gen_resp.status_code == 201
        gen_id = gen_resp.json()["id"]

        resp = client.get("/api/recommendations/latest", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == gen_id

    def test_get_latest_recommendation_404_if_none(self, client):
        """Brand-new user with no recommendations → 404."""
        token = _register(client)
        resp = client.get(
            "/api/recommendations/latest",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 404

    def test_recommendation_feedback_accepted(self, client, db):
        """Submitting feedback updates the recommendation record."""
        _seed_exercises(db)
        token = _register(client)
        headers = {"Authorization": f"Bearer {token}"}

        gen_resp = client.post("/api/recommendations/generate", headers=headers, json={})
        rec_id = gen_resp.json()["id"]

        resp = client.post(
            "/api/recommendations/feedback",
            headers=headers,
            json={
                "recommendation_id": rec_id,
                "rating": "just_right",
                "notes": "Perfect workout!",
                "is_accepted": True,
            },
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == rec_id

    def test_recommendation_history_returns_paginated_object(self, client, db):
        """History endpoint returns paginated object with items array."""
        _seed_exercises(db)
        token = _register(client)
        headers = {"Authorization": f"Bearer {token}"}
        # Generate one recommendation so history is non-empty
        client.post("/api/recommendations/generate", headers=headers, json={})
        resp = client.get("/api/recommendations/history", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "total" in data
        assert isinstance(data["items"], list)
        assert data["total"] >= 1


# ── MLRecommender unit tests ───────────────────────────────────────────────────

class TestMLRecommenderUnit:
    """Unit-test the MLRecommender class in isolation (no DB)."""

    def test_is_trained_false_when_no_model_on_disk(self, tmp_path, monkeypatch):
        """is_trained() returns False when the model file does not exist."""
        from app.ml import ml_recommender
        ml_recommender.MLRecommender._instance = None

        # Patch the module-level _MODEL_PATH directly
        monkeypatch.setattr(ml_recommender, "_MODEL_PATH", tmp_path / "no_model.pkl")

        rec = ml_recommender.MLRecommender()
        assert rec.is_trained() is False
        ml_recommender.MLRecommender._instance = None

    def test_predict_returns_candidates_when_not_trained(self, tmp_path, monkeypatch):
        """predict() falls back to returning the candidate list if not trained."""
        from app.ml import ml_recommender
        ml_recommender.MLRecommender._instance = None
        monkeypatch.setattr(ml_recommender, "_MODEL_PATH", tmp_path / "no_model.pkl")

        rec = ml_recommender.MLRecommender()
        candidates = ["ex-1", "ex-2", "ex-3"]
        result = rec.predict("user-xyz", candidates, top_n=3)
        assert result == candidates
        ml_recommender.MLRecommender._instance = None

    def test_reload_clears_singleton(self, tmp_path, monkeypatch):
        """reload() sets _instance to None so next call creates a fresh instance."""
        from app.ml import ml_recommender
        ml_recommender.MLRecommender._instance = None
        monkeypatch.setattr(ml_recommender, "_MODEL_PATH", tmp_path / "no_model.pkl")

        _first = ml_recommender.MLRecommender()
        ml_recommender.MLRecommender.reload()
        assert ml_recommender.MLRecommender._instance is None
        ml_recommender.MLRecommender._instance = None


# ── model_trainer unit tests ───────────────────────────────────────────────────

class TestModelTrainer:
    """Tests for app.ml.model_trainer.train_and_save."""

    def test_train_returns_false_when_insufficient_data(self, db):
        """train_and_save returns False when < 20 interactions exist."""
        from app.ml import model_trainer, ml_recommender
        ml_recommender.MLRecommender._instance = None

        result = model_trainer.train_and_save(db)
        # Fresh test DB has 0 sessions
        assert result is False

    def test_train_and_save_with_synthetic_data(self, db, tmp_path, monkeypatch):
        """
        Inject synthetic workout sessions into the DB and verify
        that train_and_save succeeds and saves a pickle to disk.

        Validates the full scikit-learn TruncatedSVD path (Task 14 Stage 3).
        """
        from app.ml import model_trainer, ml_recommender

        # Patch both modules' _MODEL_PATH to use tmp_path
        model_path = tmp_path / "model.pkl"
        monkeypatch.setattr(model_trainer, "_MODEL_PATH", model_path)
        monkeypatch.setattr(ml_recommender, "_MODEL_PATH", model_path)
        ml_recommender.MLRecommender._instance = None

        from app.models.user import User, UserRole
        from app.models.exercise import Exercise
        from app.models.workout import WorkoutSession, WorkoutSessionExercise, SessionStatus
        from app.models.profile import UserProfile
        from app.models.gamification import UserGamification

        # Create synthetic users + exercises + completed sessions
        users = []
        for i in range(5):
            u = User(
                email=f"mluser{i}@test.com",
                hashed_password="hashed",
                display_name=f"ML User {i}",
                role=UserRole.user,
            )
            db.add(u)
            db.flush()
            db.add(UserProfile(user_id=u.id))
            db.add(UserGamification(user_id=u.id))
            users.append(u)

        exercises = []
        for i in range(10):
            e = Exercise(
                name=f"Test Exercise {i}",
                slug=f"test-exercise-{i}",
                category="strength",
                difficulty="beginner",
                default_sets=3,
            )
            db.add(e)
            db.flush()
            exercises.append(e)

        # Create enough completed sessions (need 20+ interactions total)
        for user in users:
            for batch in range(5):
                sess = WorkoutSession(
                    user_id=user.id,
                    name=f"Session {batch}",
                    status=SessionStatus.completed,
                    duration_seconds=1800,
                    points_earned=100,
                )
                db.add(sess)
                db.flush()

                # 3 exercises per session → 5 users × 5 sessions × 3 = 75 interactions
                for j, ex in enumerate(exercises[:3]):
                    se = WorkoutSessionExercise(
                        session_id=sess.id,
                        exercise_id=ex.id,
                        order_index=j,
                        planned_sets=3,
                    )
                    db.add(se)

        db.commit()

        result = model_trainer.train_and_save(db)
        assert result is True
        assert model_path.exists()

        import pickle
        with open(model_path, "rb") as f:
            model_data = pickle.load(f)

        assert "user_index" in model_data
        assert "exercise_index" in model_data
        assert "user_factors" in model_data
        assert "item_factors" in model_data
        assert len(model_data["user_index"]) == 5
        assert len(model_data["exercise_index"]) == 3

        ml_recommender.MLRecommender._instance = None

    def test_trained_recommender_predict_returns_ranked_list(self, db, tmp_path, monkeypatch):
        """After training, predict() returns a ranked subset of candidates."""
        from app.ml import model_trainer, ml_recommender

        model_path = tmp_path / "model2.pkl"
        monkeypatch.setattr(model_trainer, "_MODEL_PATH", model_path)
        monkeypatch.setattr(ml_recommender, "_MODEL_PATH", model_path)
        ml_recommender.MLRecommender._instance = None

        from app.models.user import User, UserRole
        from app.models.exercise import Exercise
        from app.models.workout import WorkoutSession, WorkoutSessionExercise, SessionStatus
        from app.models.profile import UserProfile
        from app.models.gamification import UserGamification

        users = []
        for i in range(3):
            u = User(
                email=f"rankuser{i}@test.com",
                hashed_password="h",
                display_name=f"Rank {i}",
                role=UserRole.user,
            )
            db.add(u)
            db.flush()
            db.add(UserProfile(user_id=u.id))
            db.add(UserGamification(user_id=u.id))
            users.append(u)

        exercises = []
        for i in range(6):
            e = Exercise(
                name=f"Rank Exercise {i}",
                slug=f"rank-ex-{i}",
                category="cardio",
                difficulty="beginner",
                default_sets=3,
            )
            db.add(e)
            db.flush()
            exercises.append(e)

        for user in users:
            for k in range(8):
                sess = WorkoutSession(
                    user_id=user.id,
                    name=f"Sess {k}",
                    status=SessionStatus.completed,
                    duration_seconds=900,
                    points_earned=50,
                )
                db.add(sess)
                db.flush()
                for j, ex in enumerate(exercises[:4]):
                    db.add(WorkoutSessionExercise(
                        session_id=sess.id,
                        exercise_id=ex.id,
                        order_index=j,
                        planned_sets=2,
                    ))

        db.commit()

        result = model_trainer.train_and_save(db)
        assert result is True

        ml_recommender.MLRecommender._instance = None
        rec = ml_recommender.MLRecommender()
        assert rec.is_trained() is True

        candidate_ids = [e.id for e in exercises]
        ranked = rec.predict(users[0].id, candidate_ids, top_n=3)
        assert isinstance(ranked, list)
        assert len(ranked) <= 3
        assert all(rid in candidate_ids for rid in ranked)

        ml_recommender.MLRecommender._instance = None
