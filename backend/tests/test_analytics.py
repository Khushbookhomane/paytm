import pytest
from fastapi.testclient import TestClient
from app.main import app

# client and auth_headers come from conftest.py


def test_dashboard_metrics(client, auth_headers):
    res = client.get("/api/dashboard", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "today_sales" in data
    assert data["today_sales"] >= 0  # may be 0 if no transactions today in seed data
    assert len(data["seven_day_trend"]) == 7
    assert len(data["top_5_products"]) <= 5
    assert len(data["payment_mode_split"]) > 0
    total_pct = sum(m["percentage"] for m in data["payment_mode_split"])
    assert 99.0 <= total_pct <= 101.0


def test_sales_week_and_month(client, auth_headers):
    res_w = client.get("/api/sales?range=week", headers=auth_headers)
    assert res_w.status_code == 200
    dw = res_w.json()
    assert dw["range"] == "week"
    assert len(dw["sales_series"]) == 7
    assert len(dw["category_breakdown"]) > 0
    assert len(dw["peak_hours"]) == 16
    assert dw["total_sales"] > 0

    res_m = client.get("/api/sales?range=month", headers=auth_headers)
    assert res_m.status_code == 200
    dm = res_m.json()
    assert dm["range"] == "month"
    assert len(dm["sales_series"]) == 30
    assert dm["total_sales"] >= dw["total_sales"]
