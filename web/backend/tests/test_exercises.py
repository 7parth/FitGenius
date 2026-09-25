"""
Exercise endpoint tests — list, detail, alternatives, admin CRUD.
"""
import uuid
import pytest


def _make_user(client):
    email = f"exercise-{uuid.uuid4().hex[:8]}@fitgenius.com"
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "TestPass1", "display_name": "Exercise Tester"
    })
    assert resp.status_code == 201, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


class TestExerciseList:
    def test_list_requires_auth(self, client):
        resp = client.get("/api/exercises")
        assert resp.status_code == 401

    def test_list_authenticated(self, client):
        auth_headers = _make_user(client)
        resp = client.get("/api/exercises", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "pages" in data

    def test_list_pagination(self, client):
        auth_headers = _make_user(client)
        resp = client.get("/api/exercises?page=1&page_size=5", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["page"] == 1
        assert data["page_size"] == 5
        assert len(data["items"]) <= 5

    def test_list_filter_by_category(self, client):
        auth_headers = _make_user(client)
        resp = client.get("/api/exercises?category=strength", headers=auth_headers)
        assert resp.status_code == 200
        items = resp.json()["items"]
        for item in items:
            assert item["category"] == "strength"

    def test_list_filter_by_difficulty(self, client):
        auth_headers = _make_user(client)
        resp = client.get("/api/exercises?difficulty=beginner", headers=auth_headers)
        assert resp.status_code == 200
        items = resp.json()["items"]
        for item in items:
            assert item["difficulty"] == "beginner"

    def test_list_search(self, client):
        auth_headers = _make_user(client)
        resp = client.get("/api/exercises?search=squat", headers=auth_headers)
        assert resp.status_code == 200
        # Should return exercises with squat in the name
        items = resp.json()["items"]
        for item in items:
            assert "squat" in item["name"].lower()

    def test_list_pose_analysis_filter(self, client):
        auth_headers = _make_user(client)
        resp = client.get("/api/exercises?supports_pose=true", headers=auth_headers)
        assert resp.status_code == 200
        items = resp.json()["items"]
        for item in items:
            assert item["supports_pose_analysis"] is True


class TestExerciseDetail:
    def test_get_nonexistent(self, client):
        auth_headers = _make_user(client)
        resp = client.get("/api/exercises/nonexistent-id", headers=auth_headers)
        assert resp.status_code == 404

    def test_get_alternatives_nonexistent(self, client):
        auth_headers = _make_user(client)
        resp = client.get("/api/exercises/nonexistent-id/alternatives", headers=auth_headers)
        assert resp.status_code == 404


class TestExerciseAdmin:
    def test_create_requires_admin(self, client):
        auth_headers = _make_user(client)
        """Regular users cannot create exercises."""
        payload = {
            "name": "Test Exercise",
            "slug": "test-exercise",
            "category": "strength",
            "difficulty": "beginner",
        }
        resp = client.post("/api/exercises", json=payload, headers=auth_headers)
        assert resp.status_code == 403

    def test_create_as_admin(self, client, db):
        """Admin users can create exercises."""
        from app.models.user import User, UserRole
        from app.core.security import hash_password

        admin = User(
            email="admin_ex@fitgenius.com",
            hashed_password=hash_password("AdminPass1"),
            display_name="Admin",
            role=UserRole.admin,
        )
        db.add(admin)
        db.flush()

        # Login as admin
        resp = client.post("/api/auth/login", json={"email": "admin_ex@fitgenius.com", "password": "AdminPass1"})
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        payload = {
            "name": "Admin Test Exercise",
            "slug": "admin-test-exercise",
            "category": "strength",
            "difficulty": "beginner",
            "primary_muscles": ["chest"],
            "secondary_muscles": [],
            "equipment_required": [],
            "is_bodyweight": True,
            "instructions": ["Step 1", "Step 2"],
            "tips": [],
            "accessibility_categories": ["low_impact"],
            "contraindications": [],
            "alternative_exercise_ids": [],
            "default_sets": 3,
            "rest_seconds": 60,
            "supports_pose_analysis": False,
        }
        resp = client.post("/api/exercises", json=payload, headers=headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Admin Test Exercise"
        assert data["is_active"] is True
