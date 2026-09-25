"""
Auth endpoint tests — register, login, refresh, logout, /me.
"""
import pytest


# ── Register ──────────────────────────────────────────────────────────────────

class TestRegister:
    def test_register_success(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "new@fitgenius.com",
            "password": "StrongPass1",
            "display_name": "New User",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_register_duplicate_email(self, client):
        payload = {
            "email": "dup@fitgenius.com",
            "password": "StrongPass1",
            "display_name": "Dup User",
        }
        client.post("/api/auth/register", json=payload)
        resp = client.post("/api/auth/register", json=payload)
        assert resp.status_code == 409
        assert "already registered" in resp.json()["detail"].lower()

    def test_register_weak_password_no_uppercase(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "weak@fitgenius.com",
            "password": "weakpass1",
            "display_name": "Weak User",
        })
        assert resp.status_code == 422

    def test_register_weak_password_no_digit(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "weak2@fitgenius.com",
            "password": "WeakPassword",
            "display_name": "Weak User",
        })
        assert resp.status_code == 422

    def test_register_weak_password_too_short(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "short@fitgenius.com",
            "password": "Sh1",
            "display_name": "Short User",
        })
        assert resp.status_code == 422

    def test_register_invalid_email(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "not-an-email",
            "password": "StrongPass1",
            "display_name": "Bad Email",
        })
        assert resp.status_code == 422

    def test_register_display_name_too_short(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "short_name@fitgenius.com",
            "password": "StrongPass1",
            "display_name": "X",
        })
        assert resp.status_code == 422


# ── Login ─────────────────────────────────────────────────────────────────────

class TestLogin:
    def test_login_success(self, client, registered_user):
        resp = client.post("/api/auth/login", json={
            "email": registered_user["_email"],
            "password": "TestPass1",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_login_wrong_password(self, client, registered_user):
        resp = client.post("/api/auth/login", json={
            "email": registered_user["_email"],
            "password": "WrongPassword1",
        })
        assert resp.status_code == 401

    def test_login_unknown_email(self, client):
        resp = client.post("/api/auth/login", json={
            "email": "nobody@fitgenius.com",
            "password": "SomePass1",
        })
        assert resp.status_code == 401

    def test_login_email_case_insensitive(self, client, registered_user):
        resp = client.post("/api/auth/login", json={
            "email": registered_user["_email"].upper(),
            "password": "TestPass1",
        })
        assert resp.status_code == 200


# ── /me ───────────────────────────────────────────────────────────────────────

class TestMe:
    def test_get_me_authenticated(self, client, auth_headers, registered_user):
        resp = client.get("/api/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == registered_user["_email"]
        assert data["display_name"] == "Test User"
        assert data["role"] == "user"
        assert data["is_active"] is True

    def test_get_me_unauthenticated(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

    def test_get_me_bad_token(self, client):
        resp = client.get("/api/auth/me", headers={"Authorization": "Bearer garbage"})
        assert resp.status_code == 401


# ── Refresh ───────────────────────────────────────────────────────────────────

class TestRefresh:
    def test_refresh_success(self, client, registered_user):
        refresh_token = registered_user["refresh_token"]
        resp = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_refresh_invalid_token(self, client):
        resp = client.post("/api/auth/refresh", json={"refresh_token": "invalid.token.here"})
        assert resp.status_code == 401


# ── Health ────────────────────────────────────────────────────────────────────

class TestHealth:
    def test_health_check(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
