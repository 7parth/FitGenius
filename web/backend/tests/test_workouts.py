"""
Workout session endpoint tests.
"""
import uuid
import pytest


def _make_user(client):
    email = f"workout-{uuid.uuid4().hex[:8]}@fitgenius.com"
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "TestPass1", "display_name": "Workout Tester"
    })
    assert resp.status_code == 201, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


class TestWorkoutTemplates:
    def test_list_templates_requires_auth(self, client):
        resp = client.get("/api/workouts/templates")
        assert resp.status_code == 401

    def test_list_templates_authenticated(self, client):
        auth_headers = _make_user(client)
        resp = client.get("/api/workouts/templates", headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_get_nonexistent_template(self, client):
        auth_headers = _make_user(client)
        resp = client.get("/api/workouts/templates/nonexistent-id", headers=auth_headers)
        assert resp.status_code == 404


class TestWorkoutSessions:
    def test_start_session(self, client):
        auth_headers = _make_user(client)
        resp = client.post("/api/workouts/sessions/start",
                           json={"name": "Test Workout"},
                           headers=auth_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "in_progress"
        assert data["name"] == "Test Workout"

    def test_get_session(self, client):
        auth_headers = _make_user(client)
        # Start a session first
        start_resp = client.post("/api/workouts/sessions/start",
                                 json={"name": "Get Test"},
                                 headers=auth_headers)
        session_id = start_resp.json()["id"]

        resp = client.get(f"/api/workouts/sessions/{session_id}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == session_id

    def test_complete_session(self, client):
        auth_headers = _make_user(client)
        start_resp = client.post("/api/workouts/sessions/start",
                                 json={"name": "Complete Test"},
                                 headers=auth_headers)
        session_id = start_resp.json()["id"]

        resp = client.post(f"/api/workouts/sessions/{session_id}/complete",
                           headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "completed"

    def test_abandon_session(self, client):
        auth_headers = _make_user(client)
        start_resp = client.post("/api/workouts/sessions/start",
                                 json={"name": "Abandon Test"},
                                 headers=auth_headers)
        session_id = start_resp.json()["id"]

        resp = client.post(f"/api/workouts/sessions/{session_id}/abandon",
                           headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "abandoned"

    def test_get_history(self, client):
        auth_headers = _make_user(client)
        resp = client.get("/api/workouts/history", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "total" in data

    def test_cannot_access_other_users_session(self, client, db):
        """User A cannot access User B's session."""
        # Register two users
        client.post("/api/auth/register", json={
            "email": "user_a@fitgenius.com",
            "password": "UserAPass1",
            "display_name": "User A",
        })
        client.post("/api/auth/register", json={
            "email": "user_b@fitgenius.com",
            "password": "UserBPass1",
            "display_name": "User B",
        })
        # Login as A
        resp_a = client.post("/api/auth/login", json={"email": "user_a@fitgenius.com", "password": "UserAPass1"})
        headers_a = {"Authorization": f"Bearer {resp_a.json()['access_token']}"}
        # Login as B
        resp_b = client.post("/api/auth/login", json={"email": "user_b@fitgenius.com", "password": "UserBPass1"})
        headers_b = {"Authorization": f"Bearer {resp_b.json()['access_token']}"}

        # A starts a session
        session_resp = client.post("/api/workouts/sessions/start",
                                   json={"name": "A session"},
                                   headers=headers_a)
        session_id = session_resp.json()["id"]

        # B tries to access it
        resp = client.get(f"/api/workouts/sessions/{session_id}", headers=headers_b)
        assert resp.status_code == 403
