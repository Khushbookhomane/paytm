def test_copilot_chat_sales_query(client, auth_headers):
    res = client.post(
        "/api/copilot/chat",
        json={"message": "आज की बिक्री कितनी हुई?", "language": "hi"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert len(data["reply"]) > 10
    assert "get_sales_summary" in data["tools_used"]
    assert "₹" in data["reply"]


def test_copilot_chat_restock_query(client, auth_headers):
    res = client.post(
        "/api/copilot/chat",
        json={"message": "What should I restock today?", "language": "en"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert "get_low_stock" in data["tools_used"] or "get_forecast" in data["tools_used"]
    assert len(data["reply"]) > 10
