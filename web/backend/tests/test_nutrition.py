import pytest
from app.models.nutrition import MealType, DietaryPreference


def test_get_nutrition_today_empty(client, auth_headers):
    res = client.get("/api/nutrition/today", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_calories"] == 0
    assert data["logs"] == []
    assert "goal" in data
    assert data["goal"]["target_calories"] > 0


def test_log_and_delete_meal(client, auth_headers):
    # 1. Log a meal
    payload = {
        "name": "Oatmeal with Banana & Whey",
        "meal_type": "breakfast",
        "calories": 450,
        "protein_g": 32.0,
        "carbs_g": 60.0,
        "fat_g": 8.0,
    }
    res_log = client.post("/api/nutrition/log", headers=auth_headers, json=payload)
    assert res_log.status_code == 201
    log_data = res_log.json()
    assert log_data["name"] == payload["name"]
    assert log_data["calories"] == 450
    log_id = log_data["id"]

    # 2. Check today summary includes logged meal
    res_today = client.get("/api/nutrition/today", headers=auth_headers)
    assert res_today.status_code == 200
    today_data = res_today.json()
    assert today_data["total_calories"] == 450
    assert today_data["total_protein_g"] == 32.0
    assert len(today_data["logs"]) == 1

    # 3. Delete logged meal
    res_del = client.delete(f"/api/nutrition/log/{log_id}", headers=auth_headers)
    assert res_del.status_code == 204

    # 4. Confirm deletion
    res_after = client.get("/api/nutrition/today", headers=auth_headers)
    assert res_after.json()["total_calories"] == 0
    assert len(res_after.json()["logs"]) == 0


def test_update_goals_and_ai_recommend(client, auth_headers):
    # 1. Update goals
    goal_payload = {
        "target_calories": 2500,
        "target_protein_g": 180,
        "dietary_preference": "high_protein",
    }
    res_goal = client.put("/api/nutrition/goals", headers=auth_headers, json=goal_payload)
    assert res_goal.status_code == 200
    assert res_goal.json()["target_calories"] == 2500
    assert res_goal.json()["target_protein_g"] == 180

    # 2. Request AI meal recommendations
    rec_payload = {"target_meal": "lunch", "max_calories": 600}
    res_rec = client.post("/api/nutrition/ai-recommend", headers=auth_headers, json=rec_payload)
    assert res_rec.status_code == 200
    rec_data = res_rec.json()
    assert len(rec_data["recommendations"]) > 0
    assert "rationale" in rec_data
