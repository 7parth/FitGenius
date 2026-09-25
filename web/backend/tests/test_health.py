"""
Health check and infrastructure tests.
"""
import pytest


class TestHealth:
    def test_health_endpoint(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert "status" in data
        assert "version" in data
        assert "checks" in data

    def test_health_has_database_check(self, client):
        resp = client.get("/api/health")
        data = resp.json()
        assert "database" in data["checks"]

    def test_cors_headers(self, client):
        resp = client.get("/api/health", headers={"Origin": "http://localhost:5173"})
        assert resp.status_code == 200

    def test_security_headers_present(self, client):
        resp = client.get("/api/health")
        assert "x-content-type-options" in resp.headers
        assert resp.headers["x-content-type-options"] == "nosniff"
        assert "x-frame-options" in resp.headers

    def test_404_on_unknown_route(self, client):
        resp = client.get("/api/this-does-not-exist")
        assert resp.status_code == 404

    def test_method_not_allowed(self, client):
        resp = client.delete("/api/health")
        assert resp.status_code == 405
