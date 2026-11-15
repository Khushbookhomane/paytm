def test_finance_summary(client, auth_headers):
    res = client.get("/api/finance/summary?range=month", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["revenue"] > 0
    assert data["cogs"] > 0
    assert data["gross_profit"] == round(data["revenue"] - data["cogs"], 2)
    assert data["expenses_total"] > 0
    assert "Rent" in data["expenses_by_category"]
    assert "Salary" in data["expenses_by_category"]
    assert len(data["cash_flow_series"]) == 30


def test_finance_explain_multilingual(client, auth_headers):
    res_hi = client.post("/api/finance/explain", json={"range": "month", "language": "hi"}, headers=auth_headers)
    assert res_hi.status_code == 200
    d_hi = res_hi.json()
    assert len(d_hi["sentences"]) >= 3
    assert len(d_hi["summary_text"]) > 50

    res_en = client.post("/api/finance/explain", json={"range": "month", "language": "en"}, headers=auth_headers)
    assert res_en.status_code == 200
    d_en = res_en.json()
    assert "revenue" in d_en["summary_text"].lower() or "profit" in d_en["summary_text"].lower()
