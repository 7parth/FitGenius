from datetime import UTC, datetime


def test_manual_wearable_reading_round_trips_fatigue_enum(client, auth_headers):
    response = client.post("/api/wearables/data", headers=auth_headers, json={
        "source": "manual",
        "recorded_at": datetime.now(UTC).isoformat(),
        "steps": 8400,
        "active_calories": 420,
        "resting_heart_rate": 56,
        "avg_heart_rate": 92,
        "max_heart_rate": 145,
        "hrv_ms": 52,
        "sleep_hours": 7.7,
        "sleep_quality_score": 85,
        "recovery_score": 88,
    })
    assert response.status_code == 201, response.text
    assert response.json()["fatigue_level"] == "NORMAL"

    history = client.get("/api/wearables/data", headers=auth_headers)
    assert history.status_code == 200
    assert history.json()[0]["fatigue_level"] == "NORMAL"
