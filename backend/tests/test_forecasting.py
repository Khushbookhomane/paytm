def test_inventory_list(client, auth_headers):
    res = client.get("/api/inventory", headers=auth_headers)
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 40
    statuses = set(item["status"] for item in items)
    assert "low" in statuses
    assert "ok" in statuses
    low_items = [i for i in items if i["status"] == "low"]
    assert len(low_items) >= 5


def test_inventory_forecast_shape(client, auth_headers):
    res = client.get("/api/inventory/forecast?days=7", headers=auth_headers)
    assert res.status_code == 200
    forecasts = res.json()
    assert len(forecasts) == 40
    first = forecasts[0]
    assert "product_name" in first
    assert "predicted_demand_7d" in first
    assert first["predicted_demand_7d"] > 0
    assert len(first["daily_forecast"]) == 7
    cold_drinks = [f for f in forecasts if f["category"] in ("Cold Drinks", "Snacks")]
    assert len(cold_drinks) > 0
    spike_detected = any(cd["weekend_spike_flag"] for cd in cold_drinks)
    assert spike_detected is True
    for day in first["daily_forecast"]:
        assert day["lower"] <= day["pred"] <= day["upper"]
