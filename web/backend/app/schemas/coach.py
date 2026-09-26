from pydantic import BaseModel, Field
from typing import Optional


class CoachMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str
    ts: str


class SendMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000)
    conversation_id: Optional[str] = None   # if None → new conversation


class SendMessageResponse(BaseModel):
    conversation_id: str
    reply: str
    conversation_title: str
    engine: Optional[str] = "LangChain + Groq"
    model: Optional[str] = "llama-3.3-70b-versatile"


class CoachEngineInfo(BaseModel):
    provider: str
    model: str
    status: str
    framework: str = "LangChain"
    active: bool
    description: str


class ConversationSummary(BaseModel):
    id: str
    title: str
    message_count: int
    last_message_at: Optional[str]
    created_at: str

    model_config = {"from_attributes": True}


class ConversationDetailResponse(BaseModel):
    id: str
    title: str
    messages: list[CoachMessage]
    message_count: int
    created_at: str

    model_config = {"from_attributes": True}
