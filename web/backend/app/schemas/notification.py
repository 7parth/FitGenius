from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional, Any
from app.models.notification import NotificationType


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    notification_type: NotificationType
    title: str
    body: str
    is_read: bool
    payload: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    total: int
    unread_count: int
    page: int
    page_size: int


class UnreadCountResponse(BaseModel):
    unread_count: int
