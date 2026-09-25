from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.conversation import AIConversation
from app.schemas.coach import (
    SendMessageRequest,
    SendMessageResponse,
    ConversationSummary,
    ConversationDetailResponse,
    CoachMessage,
)
from app.services.coach_service import get_coach_reply

router = APIRouter()


@router.post("/message", response_model=SendMessageResponse)
async def send_message(
    body: SendMessageRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    from datetime import datetime, timezone

    now_iso = datetime.now(timezone.utc).isoformat()

    # Resolve or create conversation
    if body.conversation_id:
        conv = db.query(AIConversation).filter(
            AIConversation.id == body.conversation_id,
            AIConversation.user_id == current_user.id,
        ).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conv = AIConversation(
            user_id=current_user.id,
            title=body.content[:60] + ("…" if len(body.content) > 60 else ""),
            messages=[],
            message_count=0,
        )
        db.add(conv)
        db.flush()

    # Append user message
    messages = list(conv.messages)
    messages.append({"role": "user", "content": body.content, "ts": now_iso})

    # Get AI reply (OpenAI — key server-side only)
    reply_text, prompt_tokens, completion_tokens = await get_coach_reply(
        messages=messages,
        user=current_user,
        db=db,
    )

    reply_ts = datetime.now(timezone.utc).isoformat()
    messages.append({"role": "assistant", "content": reply_text, "ts": reply_ts})

    conv.messages = messages
    conv.message_count = len(messages)
    conv.total_prompt_tokens += prompt_tokens
    conv.total_completion_tokens += completion_tokens
    conv.last_message_at = reply_ts

    # Auto-generate better title after first exchange
    if conv.message_count == 2:
        conv.title = body.content[:80] + ("…" if len(body.content) > 80 else "")

    db.commit()
    db.refresh(conv)

    return SendMessageResponse(
        conversation_id=conv.id,
        reply=reply_text,
        conversation_title=conv.title,
    )


@router.get("/conversations", response_model=list[ConversationSummary])
async def list_conversations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(AIConversation)
        .filter(
            AIConversation.user_id == current_user.id,
            AIConversation.is_archived == False,  # noqa: E712
        )
        .order_by(AIConversation.last_message_at.desc())
        .all()
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    conv = db.query(AIConversation).filter(
        AIConversation.id == conversation_id,
        AIConversation.user_id == current_user.id,
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return ConversationDetailResponse(
        id=conv.id,
        title=conv.title,
        messages=[CoachMessage(**m) for m in conv.messages],
        message_count=conv.message_count,
        created_at=conv.created_at.isoformat(),
    )


@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    conv = db.query(AIConversation).filter(
        AIConversation.id == conversation_id,
        AIConversation.user_id == current_user.id,
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conv.is_archived = True
    db.commit()
