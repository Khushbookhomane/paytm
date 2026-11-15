from datetime import date, timedelta


def test_csv_upload_valid(client, auth_headers):
    # Use a unique quantity to avoid collision with seeded transactions
    yesterday = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")
    csv_data = f"date,product_name,category,qty,price,cost_price,payment_mode\n{yesterday} 23:45:00,Amul Taaza Milk 500ml,Dairy,7,27.0,22.0,UPI\n".encode()
    response = client.post(
        "/api/upload/csv",
        headers=auth_headers,
        files={"file": ("test.csv", csv_data, "text/csv")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["rows_processed"] == 1
    assert data["transactions_added"] == 1


def test_csv_upload_malformed(client, auth_headers):
    yesterday = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")
    csv_data = f"date,product_name,category,qty,price,payment_mode\n{yesterday} 10:00:00,Amul Taaza Milk 500ml,Dairy,NOT_A_NUMBER,27.0,UPI\n".encode()
    response = client.post(
        "/api/upload/csv",
        headers=auth_headers,
        files={"file": ("malformed.csv", csv_data, "text/csv")},
    )
    assert response.status_code == 400
    # Accept either error message variant
    detail = response.json()["detail"]
    assert "qty" in detail.lower() or "quantity" in detail.lower() or "invalid" in detail.lower()
