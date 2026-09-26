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
