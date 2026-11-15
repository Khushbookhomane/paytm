def test_marketing_generate_hindi(client, auth_headers):
    payload = {"segment": "At-risk", "goal": "win_back", "language": "hi", "product": "Tata Tea", "discount_pct": 10}
    res = client.post("/api/marketing/generate", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["variants"]) == 3
    for v in data["variants"]:
        assert len(v["text"]) <= 300
        assert v["character_count"] <= 300
        assert v["character_count"] > 20
        assert v["suggested_channel"] == "whatsapp"


def test_marketing_generate_marathi_and_english(client, auth_headers):
    res_mr = client.post(
        "/api/marketing/generate",
        json={"segment": "Regular", "goal": "weekend_special", "language": "mr"},
        headers=auth_headers,
    )
    assert res_mr.status_code == 200
    assert len(res_mr.json()["variants"]) == 3

    res_en = client.post(
        "/api/marketing/generate",
        json={"segment": "Occasional", "goal": "clear_stock", "language": "en"},
        headers=auth_headers,
    )
    assert res_en.status_code == 200
    assert len(res_en.json()["variants"]) == 3
    for v in res_en.json()["variants"]:
        assert len(v["text"]) <= 300
