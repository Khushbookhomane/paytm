import sys
import secrets
import hashlib
from datetime import datetime, timedelta
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app
from app.db import SessionLocal
from app.models import Product, Customer, Transaction, Expense, User, UserSession, Merchant

def main():
    print("=" * 65)
    print("PAYTM VENTUREAI: SYSTEM & VERIFICATION HEALTH CHECK")
    print("=" * 65)

    client = TestClient(app)
    db = SessionLocal()
    checks_passed = 0
    total_checks = 0

    def check(name, condition, detail=""):
        nonlocal checks_passed, total_checks
        total_checks += 1
        status = "\033[92m[PASS]\033[0m" if condition else "\033[91m[FAIL]\033[0m"
        print(f" {status} {name:<42} {detail}")
        if condition:
            checks_passed += 1

    # 1. Database Seed Pattern Checks
    print("\n--- 1. DATABASE & SEED PATTERNS ---")
    prod_count = db.query(Product).count()
    check("Catalog Size (>=40 products)", prod_count >= 40, f"Found: {prod_count}")

    cust_count = db.query(Customer).count()
    check("Customer Base (>=150 shoppers)", cust_count >= 150, f"Found: {cust_count}")

    tx_count = db.query(Transaction).count()
    check("Transaction History (90 days, >3000 txs)", tx_count >= 3000, f"Found: {tx_count}")

    upi_count = db.query(Transaction).filter(Transaction.payment_mode == "UPI").count()
    upi_pct = (upi_count / (tx_count or 1)) * 100
    check("UPI Payment Share (~75%)", 68.0 <= upi_pct <= 82.0, f"Found: {upi_pct:.1f}%")

    low_stock = db.query(Product).filter(Product.stock_qty <= Product.reorder_level).count()
    check("Low Stock Alert Items (>=5 items)", low_stock >= 5, f"Found: {low_stock}")

    exp_count = db.query(Expense).count()
    check("Monthly Expenses Tracked (Rent/Salary/Elec)", exp_count >= 12, f"Found: {exp_count}")

    # 2. Authentication & Security
    print("\n--- 2. AUTHENTICATION & SECURITY ---")
    dev_merchant = db.query(Merchant).first()
    if not dev_merchant:
        print("No merchant found! Please seed the database first.")
        return 1

    # Ensure linked User exists
    user = db.query(User).filter(User.email == dev_merchant.email).first()
    if not user:
        user = User(email=dev_merchant.email, name=dev_merchant.name, email_verified_at=datetime.utcnow())
        db.add(user)
        db.commit()
        db.refresh(user)
        dev_merchant.user_id = user.id
        db.commit()

    # Create session token
    raw_token = secrets.token_urlsafe(48)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    session = UserSession(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(hours=24),
    )
    db.add(session)
    db.commit()

    headers = {"Authorization": f"Bearer {raw_token}"}
    check("Secure Session Creation", True, f"User ID: {user.id}")

    unauth_res = client.get("/api/dashboard")
    check("JWT Route Protection (No Token -> 401)", unauth_res.status_code == 401)

    # 3. API Endpoint Verification
    print("\n--- 3. LIVE ENDPOINTS (CODE-COMPUTED) ---")
    dash = client.get("/api/dashboard", headers=headers)
    check("Dashboard Metrics (/api/dashboard)", dash.status_code == 200, f"Today Sales: ₹{dash.json().get('today_sales')}")

    sales = client.get("/api/sales?range=week", headers=headers)
    check("Sales Analytics (/api/sales)", sales.status_code == 200, f"Week Total: ₹{sales.json().get('total_sales')}")

    inv = client.get("/api/inventory", headers=headers)
    check("Inventory Status (/api/inventory)", inv.status_code == 200, f"Tracked: {len(inv.json())} products")

    fc = client.get("/api/inventory/forecast?days=7", headers=headers)
    check("7-Day Forecast (/api/inventory/forecast)", fc.status_code == 200, f"Forecasts: {len(fc.json())}")

    cust_seg = client.get("/api/customers/segments", headers=headers)
    check("Customer Segments (/api/customers/segments)", cust_seg.status_code == 200, f"Summary: {len(cust_seg.json().get('summary', []))} groups")

    mkt = client.post("/api/marketing/generate", headers=headers, json={"segment": "At-risk", "goal": "win_back", "language": "hi"})
    check("Marketing Generator (/api/marketing/generate)", mkt.status_code == 200, f"Variants: {len(mkt.json().get('variants', []))}")

    fin = client.get("/api/finance/summary?range=month", headers=headers)
    check("Finance Summary (/api/finance/summary)", fin.status_code == 200, f"Net Profit: ₹{fin.json().get('net_profit')}")

    recs = client.get("/api/recommendations/today", headers=headers)
    check("Recommendations Cards (/api/recommendations/today)", recs.status_code == 200, f"Cards: {len(recs.json())}")

    # 4. Copilot Offline Zero-Hallucination Check
    print("\n--- 4. COPILOT OFFLINE INTELLIGENCE ---")
    copilot_res = client.post("/api/copilot/chat", headers=headers, json={"message": "आज की बिक्री कितनी हुई?", "language": "hi"})
    check("Copilot Sales Query ('आज की बिक्री...')", copilot_res.status_code == 200 and "get_sales_summary" in copilot_res.json().get("tools_used", []))

    copilot_profit = client.post("/api/copilot/chat", headers=headers, json={"message": "इस हफ्ते मेरा profit कितना हुआ?", "language": "hi"})
    check("Copilot Week Profit Query ('इस हफ्ते...')", copilot_profit.status_code == 200 and "इस हफ्ते" in copilot_profit.json().get("reply", ""))

    print("\n" + "=" * 65)
    print(f"HEALTH CHECK SCORE: {checks_passed}/{total_checks} CHECKS PASSED ({(checks_passed/total_checks)*100:.0f}%)")
    if checks_passed == total_checks:
        print("\033[92m>>> ALL CHECKS PASSED - ENVIRONMENT IS FULLY OPERATIONAL <<<\033[0m")
    else:
        print("\033[91m>>> ATTENTION: SOME CHECKS FAILED - REVIEW LOGS ABOVE <<<\033[0m")
    print("=" * 65)

    db.close()
    return 0 if checks_passed == total_checks else 1

if __name__ == "__main__":
    sys.exit(main())
