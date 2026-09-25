import pytest
from app.models.notification import Notification, NotificationType
from app.models.user import User
from sqlalchemy import select


def test_get_notifications_empty(client, auth_headers):
    res = client.get("/api/notifications", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["unread_count"] == 0


def test_notifications_lifecycle(client, auth_headers, registered_user, db):
    user_email = registered_user["_email"]
    user = db.scalar(select(User).where(User.email == user_email))
    assert user is not None

    # Seed a notification directly in DB
    notif = Notification(
        user_id=user.id,
        notification_type=NotificationType.achievement_unlocked,
        title="First Workout Complete!",
        body="Congratulations on completing your first workout session.",
        is_read=False,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    # 1. Unread count check
    res_count = client.get("/api/notifications/unread-count", headers=auth_headers)
    assert res_count.status_code == 200
    assert res_count.json()["unread_count"] == 1

    # 2. List notifications
    res_list = client.get("/api/notifications", headers=auth_headers)
    assert res_list.status_code == 200
    list_data = res_list.json()
    assert list_data["total"] == 1
    assert list_data["unread_count"] == 1
    assert list_data["items"][0]["id"] == notif.id

    # 3. Mark single as read
    res_read = client.patch(f"/api/notifications/{notif.id}/read", headers=auth_headers)
    assert res_read.status_code == 200
    assert res_read.json()["is_read"] is True

    # 4. Delete notification
    res_del = client.delete(f"/api/notifications/{notif.id}", headers=auth_headers)
    assert res_del.status_code == 204

    # 5. List empty after delete
    res_after = client.get("/api/notifications", headers=auth_headers)
    assert res_after.json()["total"] == 0


def test_export_user_data(client, auth_headers, registered_user, db):
    user_email = registered_user["_email"]
    user = db.scalar(select(User).where(User.email == user_email))
    res = client.get("/api/profile/export", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["user_account"]["email"] == user.email
    assert "profile" in data
    assert "accessibility_settings" in data
    assert "workout_history" in data
