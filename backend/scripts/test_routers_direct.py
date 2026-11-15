import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.db import SessionLocal
from app.models import Merchant
from app.routers import (
    dashboard, sales, inventory, customers, marketing,
    finance, growth_score, notifications, intelligence, reports
)

def test_all_routers():
    db = SessionLocal()
    merchant = db.query(Merchant).first()
    assert merchant is not None, "No merchant found"
    print(f"Testing with Merchant: {merchant.name} (id: {merchant.id})")

    # 1. Dashboard
    dash = dashboard.get_dashboard(current_merchant=merchant, db=db)
    print(f"[✓] Dashboard: sales={dash['today_sales']}, top_products={len(dash['top_5_products'])}")

    # 2. Sales
    s = sales.get_sales(range="week", current_merchant=merchant, db=db)
    txs = sales.get_transactions(page=1, limit=5, current_merchant=merchant, db=db)
    print(f"[✓] Sales: weekly_total={s['total_sales']}, txs_retrieved={len(txs['transactions'])}")

    # 3. Inventory
    inv = inventory.get_inventory(current_merchant=merchant, db=db)
    fc = inventory.get_forecast(days=7, current_merchant=merchant, db=db)
    reorders = inventory.list_reorders(current_merchant=merchant, db=db)
    print(f"[✓] Inventory: products={len(inv)}, forecasts={len(fc)}, reorders={len(reorders)}")

    # 4. Customers
    cust = customers.get_segments(current_merchant=merchant, db=db)
    print(f"[✓] Customers: total={len(cust['customers'])}, segments={len(cust['summary'])}")

    # 5. Finance
    fin = finance.get_summary(range="month", current_merchant=merchant, db=db)
    exps = finance.list_expenses(current_merchant=merchant, db=db)
    print(f"[✓] Finance: revenue={fin['revenue']}, expenses={len(exps)}")

    # 6. Growth Score
    gs = growth_score.get_growth_score(current_merchant=merchant, db=db)
    print(f"[✓] Growth Score: {gs['overall_score']}/100, tier={gs['tier']}, dimensions={len(gs['dimensions'])}")

    # 7. Notifications
    notifs = notifications.get_notifications(current_merchant=merchant, db=db)
    print(f"[✓] Notifications: total={notifs['total_count']}, unread={notifs['unread_count']}")

    # 8. Intelligence
    intel = intelligence.get_intelligence_summary(time_range="30d", current_merchant=merchant, db=db)
    print(f"[✓] Intelligence: 30d_rev={intel['revenue']['current']}, anomalies={len(intel['anomalies'])}")

    # 9. Reports
    rep = reports.get_report_summary(period="weekly", current_merchant=merchant, db=db)
    print(f"[✓] Reports: title='{rep['title']}', total_sales={rep['metrics']['total_sales']}")

    db.close()
    print("\n" + "=" * 50)
    print("ALL ROUTER SERVICES VERIFIED AND HEALTHY!")
    print("=" * 50)

if __name__ == "__main__":
    test_all_routers()
