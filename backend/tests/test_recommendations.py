def test_recommendations_today(client, auth_headers):
    res = client.get("/api/recommendations/today?language=hi", headers=auth_headers)
    assert res.status_code == 200
    cards = res.json()
    assert len(cards) >= 3
    assert len(cards) <= 5
    types = [c["type"] for c in cards]
    assert "low_stock" in types
    assert "weekend_spike" in types or "churn_winback" in types
    for card in cards:
        assert card["title"] != ""
        assert card["why"] != ""
        assert card["suggested_action"] != ""
        assert card["button_target"].startswith("/")
        assert card["button_text"] != ""
        assert isinstance(card["numbers"], dict)
