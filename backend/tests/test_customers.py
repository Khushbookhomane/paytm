def test_customer_segments_output(client, auth_headers):
    res = client.get("/api/customers/segments", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "summary" in data
    assert "customers" in data
    assert len(data["summary"]) == 3
    segment_names = [s["segment"] for s in data["summary"]]
    assert "Regular" in segment_names
    assert "Occasional" in segment_names
    assert "At-risk" in segment_names
    assert len(data["customers"]) == 150
    at_risk = [c for c in data["customers"] if c["segment"] == "At-risk"]
    assert len(at_risk) >= 15
    for c in data["customers"][:10]:
        assert "XXXXXX" in c["phone_masked"]
        assert c["recency_days"] >= 0
        assert c["reason"] != ""
