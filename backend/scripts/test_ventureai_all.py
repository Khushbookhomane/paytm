"""
Comprehensive Test Script for Paytm VentureAI Backend & 12 Operating Modules.
Tests all endpoints using FastAPI TestClient with real database integration.
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("=" * 60)
print("TESTING PAYTM VENTUREAI FULL STACK API SUITE")
print("=" * 60)

# 1. Health check
res = client.get("/health")
assert res.status_code == 200, f"Health check failed: {res.text}"
print("[✓] 1. Health Check:", res.json())

# 2. Login as Demo Merchant
res = client.post("/api/auth/login", json={"email": "demo@venture.ai", "password": "demo123"})
assert res.status_code == 200, f"Login failed: {res.text}"
token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print(f"[✓] 2. Merchant Auth Login: Success! Token acquired (merchant: {res.json()['user']['email']})")

# 3. Overview Dashboard
res = client.get("/api/dashboard", headers=headers)
assert res.status_code == 200, f"Dashboard failed: {res.text}"
dash = res.json()
print(f"[✓] 3. Overview Dashboard: Today Sales ₹{dash['today_sales']}, 7-day points: {len(dash['seven_day_trend'])}, Top products: {len(dash['top_5_products'])}")

# 4. Copilot Conversational AI (All 4 Languages & Key Queries)
queries = [
    ("Aaj meri total sale kitni hui?", "hi"),
    ("Why are my sales decreasing?", "en"),
    ("Which products should I reorder?", "en"),
    ("How can I increase my monthly revenue?", "en"),
    ("Mere business ke liye marketing strategy banao.", "hi"),
    ("Which customers are not returning?", "en"),
    ("Give me a weekly business performance report.", "en"),
    ("आजची विक्री किती झाली?", "mr"),
]

print("\n--- Testing AI Business Copilot Queries ---")
for q, lang in queries:
    res = client.post("/api/copilot/chat", json={"message": q, "language": lang}, headers=headers)
    assert res.status_code == 200, f"Copilot failed on '{q}': {res.text}"
    c_res = res.json()
    print(f"[✓] Copilot '{q[:30]}...' -> Reply length {len(c_res['reply'])}, Follow-ups: {len(c_res.get('follow_ups', []))}")

# 5. AI Business Intelligence Summary
res = client.get("/api/intelligence/summary?range=30d", headers=headers)
assert res.status_code == 200, f"Intelligence failed: {res.text}"
intel = res.json()
print(f"[✓] 5. Business Intelligence: 30d Revenue ₹{intel['revenue']['current']:,}, Hourly peak {intel['peak_hour']['hour']}, Anomalies detected: {len(intel['anomalies'])}")

# 6. Sales & Transactions Listing
res = client.get("/api/sales?range=week", headers=headers)
assert res.status_code == 200
res_tx = client.get("/api/sales/transactions?page=1&limit=10", headers=headers)
assert res_tx.status_code == 200
tx_data = res_tx.json()
print(f"[✓] 6. Sales & Transactions: Total records {tx_data['total']}, Retrieved {len(tx_data['transactions'])} txs with items")

# 7. AI Inventory & Forecast & Reorders
res = client.get("/api/inventory", headers=headers)
assert res.status_code == 200
inv = res.json()
res_fc = client.get("/api/inventory/forecast?days=7", headers=headers)
assert res_fc.status_code == 200
fc = res_fc.json()
print(f"[✓] 7. Inventory Management: {len(inv)} products in catalog, {len(fc)} products with 7-day demand forecast")

# 8. Customer RFM Intelligence
res = client.get("/api/customers/segments", headers=headers)
assert res.status_code == 200
cust = res.json()
print(f"[✓] 8. Customer Intelligence: {len(cust['customers'])} customer profiles with masked KYC, Segments: {[s['segment'] for s in cust['summary']]}")

# 9. AI Marketing Generator & Campaigns
res = client.post("/api/marketing/generate", json={
    "segment": "at_risk",
    "goal": "win_back",
    "language": "hi",
    "discount_pct": 10,
    "product": "Basmati Rice"
}, headers=headers)
assert res.status_code == 200
mkt = res.json()
res_c = client.get("/api/marketing/campaigns", headers=headers)
assert res_c.status_code == 200
print(f"[✓] 9. Marketing Assistant: Generated {len(mkt['variants'])} variants, Retrieved {len(res_c.json())} campaigns in history")

# 10. Financial Assistant & Expenses
res = client.get("/api/finance/summary?range=month", headers=headers)
assert res.status_code == 200
fin = res.json()
res_exp = client.get("/api/finance/expenses", headers=headers)
assert res_exp.status_code == 200
print(f"[✓] 10. Financial Assistant: Gross Revenue ₹{fin['revenue']:,}, COGS ₹{fin['cogs']:,}, Net Profit ₹{fin['net_profit']:,} ({fin['net_margin_pct']}% margin)")

# 11. Merchant Growth Score
res = client.get("/api/growth-score", headers=headers)
assert res.status_code == 200
gs = res.json()
print(f"[✓] 11. Merchant Growth Score: {gs['overall_score']}/100 ({gs['tier']}), {len(gs['dimensions'])} dimensions evaluated")

# 12. Proactive AI Alerts & Notifications
res = client.get("/api/notifications", headers=headers)
assert res.status_code == 200
notifs = res.json()
print(f"[✓] 12. Notifications & Alerts: {notifs['total_count']} active alerts ({notifs['unread_count']} unread)")

# 13. Reports & Exports
res = client.get("/api/reports/summary?period=weekly", headers=headers)
assert res.status_code == 200
rep = res.json()
print(f"[✓] 13. Reports & Exports: Generated '{rep['title']}' with executive commentary")

print("\n" + "=" * 60)
print("ALL 13 VERIFICATIONS PASSED WITH 100% SUCCESS!")
print("=" * 60)
