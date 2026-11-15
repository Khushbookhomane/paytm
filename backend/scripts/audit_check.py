import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.db import SessionLocal
from app.models import Merchant, Product, Customer, Transaction, TransactionItem, Expense
from app.services.analytics import get_dashboard_metrics, get_sales_analytics
from app.services.inventory import get_inventory_status
from app.services.forecasting import generate_inventory_forecast
from app.services.customers import get_customer_segments
from app.services.finance import get_finance_summary
from app.services.recommendations import generate_recommendations

def audit_seed_and_features():
    db = SessionLocal()
    merchant = db.query(Merchant).filter(Merchant.email == "demo@venture.ai").first()
    if not merchant:
        print("[FAIL] Demo merchant not found!")
        return
    m_id = merchant.id

    print("=" * 60)
    print("AUDIT: Seed Data Patterns & Database Queries")
    print("=" * 60)

    # 1. Product, Customer, Transaction counts
    prods = db.query(Product).filter(Product.merchant_id == m_id).all()
    custs = db.query(Customer).filter(Customer.merchant_id == m_id).all()
    txs = db.query(Transaction).filter(Transaction.merchant_id == m_id).order_by(Transaction.ts.asc()).all()
    items = db.query(TransactionItem).join(Transaction, TransactionItem.transaction_id == Transaction.id).filter(Transaction.merchant_id == m_id).all()
    expenses = db.query(Expense).filter(Expense.merchant_id == m_id).all()

    print(f"Product Count: {len(prods)}")
    print(f"Customer Count: {len(custs)}")
    print(f"Transaction Count: {len(txs)}")
    print(f"Transaction Items Count: {len(items)}")
    print(f"Expense Records Count: {len(expenses)}")

    # Date range
    min_date = txs[0].ts.date()
    max_date = txs[-1].ts.date()
    today_date = datetime.utcnow().date()
    print(f"Date Range: {min_date} to {max_date} (Span: {(max_date - min_date).days + 1} days)")
    print(f"Today UTC: {today_date}, Max Date in DB: {max_date}")

    # 2. UPI Share
    upi_txs = [t for t in txs if t.payment_mode.upper() == "UPI"]
    upi_count_pct = (len(upi_txs) / len(txs)) * 100
    upi_vol = sum(t.amount for t in upi_txs)
    total_vol = sum(t.amount for t in txs)
    upi_vol_pct = (upi_vol / total_vol) * 100
    print(f"UPI Share by Count: {upi_count_pct:.2f}% ({len(upi_txs)}/{len(txs)})")
    print(f"UPI Share by Volume: {upi_vol_pct:.2f}% (Rs. {upi_vol:.2f} / Rs. {total_vol:.2f})")

    # 3. Cold drinks and snacks weekend vs weekday sales
    # Join items with transactions and products
    tx_dict = {t.id: t for t in txs}
    prod_dict = {p.id: p for p in prods}

    snack_drinks_daily = {}
    for item in items:
        p = prod_dict.get(item.product_id)
        if p and p.category in ("Cold Drinks", "Snacks"):
            t = tx_dict.get(item.transaction_id)
            if t:
                d = t.ts.date()
                snack_drinks_daily[d] = snack_drinks_daily.get(d, 0.0) + item.qty

    weekday_qtys = [qty for d, qty in snack_drinks_daily.items() if d.weekday() < 5]
    weekend_qtys = [qty for d, qty in snack_drinks_daily.items() if d.weekday() in (5, 6)]
    avg_weekday = np.mean(weekday_qtys) if weekday_qtys else 0
    avg_weekend = np.mean(weekend_qtys) if weekend_qtys else 0
    uplift = ((avg_weekend - avg_weekday) / avg_weekday) * 100 if avg_weekday else 0
    print(f"Cold Drinks & Snacks Daily Units - Weekday Avg: {avg_weekday:.2f}, Weekend Avg: {avg_weekend:.2f}, Uplift: {uplift:.2f}%")

    # 4. Churn Customers (20 customers not visited in last 21 days)
    cust_last_visit = {}
    cust_visit_counts = {}
    for t in txs:
        if t.customer_id:
            cust_visit_counts[t.customer_id] = cust_visit_counts.get(t.customer_id, 0) + 1
            if t.customer_id not in cust_last_visit or t.ts.date() > cust_last_visit[t.customer_id]:
                cust_last_visit[t.customer_id] = t.ts.date()

    twenty_one_days_ago = max_date - timedelta(days=21)
    churn_candidates = []
    for c in custs:
        lv = cust_last_visit.get(c.id)
        vc = cust_visit_counts.get(c.id, 0)
        if lv and lv < twenty_one_days_ago and vc >= 4:
            churn_candidates.append((c.id, c.name, lv, (max_date - lv).days, vc))
    print(f"At-risk Customers (last visited >21d ago, >=4 prior visits): {len(churn_candidates)}")

    # 5. Products below reorder level
    low_stock = [p for p in prods if p.stock_qty <= p.reorder_level]
    print(f"Products below reorder level ({len(low_stock)}):")
    for p in low_stock:
        print(f"  - {p.name} ({p.category}): Stock={p.stock_qty}, ReorderLevel={p.reorder_level}")

    # 6. Expenses Breakdown
    exp_cats = {}
    for e in expenses:
        exp_cats[e.category] = exp_cats.get(e.category, 0.0) + e.amount
    print(f"Monthly Expenses Breakdown: {exp_cats}")

    # 7. Masked phone check
    unmasked = [c for c in custs if not ("XXXXXX" in c.phone_masked)]
    print(f"Unmasked Phone Numbers in DB: {len(unmasked)}")

    print("\n" + "=" * 60)
    print("AUDIT: Independent Computation vs API Verification")
    print("=" * 60)

    # Recompute Dashboard numbers
    # Today's sales
    today_txs = [t for t in txs if t.ts.date() == max_date]
    recalc_today_sales = round(sum(t.amount for t in today_txs), 2)
    yesterday_date = max_date - timedelta(days=1)
    yesterday_txs = [t for t in txs if t.ts.date() == yesterday_date]
    recalc_yesterday_sales = round(sum(t.amount for t in yesterday_txs), 2)
    recalc_vs_pct = round(((recalc_today_sales - recalc_yesterday_sales) / recalc_yesterday_sales) * 100, 1)

    # Profit
    today_tx_ids = set(t.id for t in today_txs)
    today_items = [i for i in items if i.transaction_id in today_tx_ids]
    today_cogs = round(sum(i.qty * prod_dict[i.product_id].cost_price for i in today_items), 2)
    recalc_profit = round(recalc_today_sales - today_cogs, 2)

    api_dash = get_dashboard_metrics(db, m_id)
    print(f"Today Sales: API={api_dash['today_sales']}, Recalc={recalc_today_sales} (Match: {api_dash['today_sales'] == recalc_today_sales})")
    print(f"Vs Yesterday Pct: API={api_dash['vs_yesterday_pct']}%, Recalc={recalc_vs_pct}% (Match: {api_dash['vs_yesterday_pct'] == recalc_vs_pct})")
    print(f"Estimated Profit: API={api_dash['estimated_profit']}, Recalc={recalc_profit} (Match: {api_dash['estimated_profit'] == recalc_profit})")

    # Finance verification: revenue - cogs - expenses = net_profit
    fin = get_finance_summary(db, m_id, time_range="month")
    recalc_net = round(fin["gross_profit"] - fin["expenses_total"], 2)
    print(f"Finance Net Profit: API={fin['net_profit']}, Recalc={recalc_net} (Match: {fin['net_profit'] == recalc_net})")

    # Recommendations check
    recs = generate_recommendations(db, m_id, language="en")
    print(f"\nGenerated Recommendations ({len(recs)} cards):")
    for r in recs:
        print(f"  - [{r['type']}] {r['title']} (target: {r['button_target']})")
        print(f"    Why: {r['why']}")

    db.close()

if __name__ == "__main__":
    audit_seed_and_features()
