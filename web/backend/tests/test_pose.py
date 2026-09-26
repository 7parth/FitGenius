import uuid

from app.models.exercise import DifficultyLevel, Exercise, ExerciseCategory


def _pose_exercise(db):
    exercise = Exercise(
        name="Pose Test Squat",
        slug=f"pose-test-squat-{uuid.uuid4().hex[:8]}",
        category=ExerciseCategory.strength,
        difficulty=DifficultyLevel.beginner,
        primary_muscles=["quads"],
        secondary_muscles=[],
        equipment_required=["bodyweight"],
        instructions=[],
        tips=[],
        supports_pose_analysis=True,
        pose_model_key="squat",
        is_active=True,
    )
    db.add(exercise)
    db.commit()
    return exercise


def test_pose_record_creates_session_and_history(client, db, auth_headers):
    _pose_exercise(db)
    response = client.post("/api/pose/sessions/record", headers=auth_headers, json={
        "exercise_key": "squat",
        "set_number": 1,
        "pose_score": 91,
        "reps_completed": 8,
        "feedback": "Good depth",
    })
    assert response.status_code == 201, response.text
    recorded = response.json()
    assert recorded["session_id"]
    assert recorded["session_exercise_id"]
    assert recorded["reps_completed"] == 8

    history = client.get("/api/pose/sessions/history", headers=auth_headers)
    assert history.status_code == 200
    assert history.json()[0]["pose_score"] == 91


def test_pose_record_rejects_unknown_exercise_key(client, auth_headers):
    response = client.post("/api/pose/sessions/record", headers=auth_headers, json={
        "exercise_key": "not-a-pose-exercise",
        "set_number": 1,
        "pose_score": 80,
    })
    assert response.status_code == 404


def test_pose_score_must_be_in_range(client, auth_headers):
    response = client.post("/api/pose/sessions/record", headers=auth_headers, json={
        "exercise_key": "squat",
        "set_number": 1,
        "pose_score": 120,
    })
    assert response.status_code == 422
