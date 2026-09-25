"""
Profile endpoint tests.
"""
import uuid
import pytest


def _make_user(client):
    """Create a unique user and return auth headers."""
    email = f"profile-{uuid.uuid4().hex[:8]}@fitgenius.com"
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "TestPass1", "display_name": "Profile Tester"
    })
    assert resp.status_code == 201, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestProfile:
    def test_get_profile_requires_auth(self, client):
        resp = client.get("/api/profile/me")
        assert resp.status_code == 401

    def test_get_profile_authenticated(self, client):
        auth_headers = _make_user(client)
        resp = client.get("/api/profile/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "fitness_level" in data
        assert "primary_goal" in data
        assert "onboarding_completed" in data

    def test_update_basic_profile(self, client):
        auth_headers = _make_user(client)
        resp = client.put("/api/profile/basic",
                          json={"age": 28, "height_cm": 175.0, "weight_kg": 72.0},
                          headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["age"] == 28
        assert data["height_cm"] == 175.0

    def test_update_fitness_profile(self, client):
        auth_headers = _make_user(client)
        resp = client.put("/api/profile/fitness",
                          json={"fitness_level": "intermediate", "primary_goal": "muscle_gain",
                                "workout_frequency_per_week": 4, "preferred_duration_minutes": 45},
                          headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["fitness_level"] == "intermediate"
        assert data["primary_goal"] == "muscle_gain"

    def test_get_accessibility_profile(self, client):
        auth_headers = _make_user(client)
        resp = client.get("/api/profile/accessibility", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "has_visual_impairment" in data
        assert "reduced_motion" in data

    def test_update_accessibility_profile(self, client):
        auth_headers = _make_user(client)
        resp = client.put("/api/profile/accessibility",
                          json={"high_contrast_mode": True, "reduced_motion": True,
                                "font_size_preference": "lg"},
                          headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["high_contrast_mode"] is True
        assert data["reduced_motion"] is True
        assert data["font_size_preference"] == "lg"

    def test_onboarding_step_validation(self, client):
        auth_headers = _make_user(client)
        resp = client.put("/api/profile/onboarding/step?step=10", headers=auth_headers)
        assert resp.status_code == 400

    def test_complete_onboarding(self, client):
        auth_headers = _make_user(client)
        resp = client.post("/api/profile/onboarding/complete",
                           json={
                               "basic": {"age": 25},
                               "fitness": {
                                   "fitness_level": "beginner",
                                   "primary_goal": "general",
                                   "workout_frequency_per_week": 3,
                                   "preferred_duration_minutes": 30,
                               },
                               "accessibility": {},
                           },
                           headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["onboarding_completed"] is True
        assert data["onboarding_last_step"] == 5
