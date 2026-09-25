from sqlalchemy import String, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, UUIDMixin, TimestampMixin


class AIConversation(Base, UUIDMixin, TimestampMixin):
    """AI coach conversation thread per user."""

    __tablename__ = "ai_conversations"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False, default="New conversation")
    # Ordered list of {"role": "user"|"assistant", "content": "...", "ts": "..."}
    messages: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    message_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Token usage for cost tracking (never exposed to frontend)
    total_prompt_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_completion_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_archived: Mapped[bool] = mapped_column(String(5), default=False, nullable=False)
    last_message_at: Mapped[str | None] = mapped_column(String(50), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="conversations")
