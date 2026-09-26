import asyncio
import sys
import types
from types import SimpleNamespace

import pytest


def test_get_coach_engine_status(client):
    res = client.get("/api/coach/engine")
    assert res.status_code == 200
    data = res.json()
    assert data["framework"] == "LangChain"
    assert "model" in data
    assert "provider" in data
    assert "status" in data


def test_send_coach_message_and_manage_conversation(client, auth_headers):
    # 1. Send first message
    payload = {"content": "I have lower back soreness today. How should I adjust my leg workout?"}
    res = client.post("/api/coach/message", headers=auth_headers, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "conversation_id" in data
    assert "reply" in data
    assert len(data["reply"]) > 20
    assert "engine" in data
    conv_id = data["conversation_id"]

    # 2. Send follow-up in same conversation
    payload_followup = {
        "conversation_id": conv_id,
        "content": "Can you give me form tips for Romanian Deadlifts?",
    }
    res_followup = client.post("/api/coach/message", headers=auth_headers, json=payload_followup)
    assert res_followup.status_code == 200
    data_followup = res_followup.json()
    assert data_followup["conversation_id"] == conv_id
    assert "reply" in data_followup

    # 3. List conversations
    res_list = client.get("/api/coach/conversations", headers=auth_headers)
    assert res_list.status_code == 200
    conv_list = res_list.json()
    assert any(c["id"] == conv_id for c in conv_list)

    # 4. Get conversation details
    res_detail = client.get(f"/api/coach/conversations/{conv_id}", headers=auth_headers)
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert detail["id"] == conv_id
    assert len(detail["messages"]) >= 4  # 2 user + 2 assistant

    # 5. Delete / Archive conversation
    res_del = client.delete(f"/api/coach/conversations/{conv_id}", headers=auth_headers)
    assert res_del.status_code == 204

    # 6. Verify deleted from active list
    res_list_after = client.get("/api/coach/conversations", headers=auth_headers)
    assert not any(c["id"] == conv_id for c in res_list_after.json())


def test_coach_calls_groq_before_openai_fallback(db, monkeypatch):
    from app.core.config import settings
    from app.models.user import User
    from app.services.coach_service import get_coach_reply

    calls = []

    class FakeMessage:
        def __init__(self, content):
            self.content = content

    class FakeChatGroq:
        def __init__(self, **kwargs):
            calls.append(("init", kwargs))

        async def ainvoke(self, messages):
            calls.append(("invoke", messages))
            return SimpleNamespace(
                content="Reply from mocked Groq",
                usage_metadata={"input_tokens": 12, "output_tokens": 7},
                response_metadata={},
            )

    groq_module = types.ModuleType("langchain_groq")
    groq_module.ChatGroq = FakeChatGroq
    messages_module = types.ModuleType("langchain_core.messages")
    messages_module.SystemMessage = FakeMessage
    messages_module.HumanMessage = FakeMessage
    messages_module.AIMessage = FakeMessage
    monkeypatch.setitem(sys.modules, "langchain_groq", groq_module)
    monkeypatch.setitem(sys.modules, "langchain_core.messages", messages_module)
    monkeypatch.setattr(settings, "GROQ_API_KEY", "test-groq-key")
    monkeypatch.setattr(settings, "GROQ_MODEL", "test-groq-model")
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "fallback-must-not-be-used")

    user = User(
        email="groq-route-test@example.com",
        hashed_password="not-used",
        display_name="Groq Route Test",
    )
    db.add(user)
    db.flush()

    reply, prompt_tokens, completion_tokens, engine = asyncio.run(
        get_coach_reply(
            messages=[{"role": "user", "content": "Give me a short warm-up."}],
            user=user,
            db=db,
        )
    )

    assert reply == "Reply from mocked Groq"
    assert prompt_tokens == 12
    assert completion_tokens == 7
    assert engine["provider"] == "Groq LPU (LangChain)"
    assert len([call for call in calls if call[0] == "invoke"]) == 1
