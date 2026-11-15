from datetime import timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from ..models import Transaction, TransactionItem, Product, Customer
from ..utils.dates import get_ist_today


def get_dashboard_metrics(db: Session, merchant_id: int) -> Dict[str, Any]:
    """Compute real-time dashboard figures from transaction and product records."""
    today_date = get_ist_today()
    yesterday_date = today_date - timedelta(days=1)

    # Today's sales
    today_txs = db.query(Transaction).filter(
        Transaction.merchant_id == merchant_id,
        func.date(Transaction.ts) == str(today_date)
    ).all()
    today_sales = sum(t.amount for t in today_txs)

    # Yesterday's sales
    yesterday_txs = db.query(Transaction).filter(
        Transaction.merchant_id == merchant_id,
        func.date(Transaction.ts) == str(yesterday_date)
    ).all()
    yesterday_sales = sum(t.amount for t in yesterday_txs)

    vs_yesterday_pct = (
        round(((today_sales - yesterday_sales) / yesterday_sales) * 100, 1)
        if yesterday_sales > 0 else 0.0
    )

    # 7-day trend
    seven_day_trend = []
    for i in range(6, -1, -1):
        d = today_date - timedelta(days=i)
        d_txs = db.query(Transaction).filter(
            Transaction.merchant_id == merchant_id,
            func.date(Transaction.ts) == str(d)
        ).all()
        seven_day_trend.append({
            "date": d.strftime("%d %b"),
            "day": d.strftime("%a"),
            "sales": round(sum(t.amount for t in d_txs), 2),
            "transactions": len(d_txs)
        })

    # Top 5 products (last 30 days)
    thirty_days_ago = today_date - timedelta(days=30)
    top_items_query = db.query(
        Product.id,
        Product.name,
        Product.category,
        func.sum(TransactionItem.qty).label("qty_sold"),
        func.sum(TransactionItem.qty * TransactionItem.price).label("revenue")
    ).join(
        TransactionItem, Product.id == TransactionItem.product_id
    ).join(
        Transaction, TransactionItem.transaction_id == Transaction.id
    ).filter(
        Transaction.merchant_id == merchant_id,
        func.date(Transaction.ts) >= str(thirty_days_ago)
    ).group_by(Product.id).order_by(desc("qty_sold")).limit(5).all()

    top_5_products = [
        {
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "qty_sold": int(item.qty_sold or 0),
            "revenue": round(float(item.revenue or 0), 2)
        }
        for item in top_items_query
    ]

    # Estimated Profit & Margin on today's sales
    today_items = db.query(
        TransactionItem.qty,
        TransactionItem.price,
        Product.cost_price
    ).join(
        Product, TransactionItem.product_id == Product.id
    ).join(
        Transaction, TransactionItem.transaction_id == Transaction.id
    ).filter(
        Transaction.merchant_id == merchant_id,
        func.date(Transaction.ts) == str(today_date)
    ).all()

    today_cogs = sum(qty * cost_price for qty, _, cost_price in today_items)
    estimated_profit = round(today_sales - today_cogs, 2)
    margin_pct = round((estimated_profit / today_sales * 100), 1) if today_sales > 0 else 0.0

    # Payment Mode Split (last 30 days)
    recent_txs = db.query(Transaction).filter(
        Transaction.merchant_id == merchant_id,
        func.date(Transaction.ts) >= str(thirty_days_ago)
    ).all()
    total_recent_sales = sum(t.amount for t in recent_txs) or 1.0

    mode_counts: Dict[str, Dict[str, Any]] = {}
    for t in recent_txs:
        mode = t.payment_mode or "UPI"
        if mode not in mode_counts:
            mode_counts[mode] = {"mode": mode, "amount": 0.0, "count": 0}
        mode_counts[mode]["amount"] += t.amount
        mode_counts[mode]["count"] += 1

    payment_mode_split = sorted([
        {
            "mode": v["mode"],
            "amount": round(v["amount"], 2),
            "percentage": round((v["amount"] / total_recent_sales) * 100, 1),
            "count": v["count"]
        }
        for v in mode_counts.values()
    ], key=lambda x: x["amount"], reverse=True)

    # Active customers today
    cust_ids = {t.customer_id for t in today_txs if t.customer_id is not None}

    # Low stock count
    low_stock_count = db.query(Product).filter(
        Product.merchant_id == merchant_id,
        Product.stock_qty <= Product.reorder_level
    ).count()

    return {
        "today_sales": round(today_sales, 2),
        "vs_yesterday_pct": vs_yesterday_pct,
        "seven_day_trend": seven_day_trend,
        "top_5_products": top_5_products,
        "estimated_profit": estimated_profit,
        "margin_pct": margin_pct,
        "payment_mode_split": payment_mode_split,
        "active_customers_today": len(cust_ids),
        "low_stock_count": low_stock_count,
    }


def get_sales_analytics(db: Session, merchant_id: int, time_range: str = "week") -> Dict[str, Any]:
    """Compute detailed sales analytics over a week or month."""
    today_date = get_ist_today()
    days_back = 7 if time_range == "week" else 30
    start_date = today_date - timedelta(days=days_back - 1)

    txs = db.query(Transaction).filter(
        Transaction.merchant_id == merchant_id,
        func.date(Transaction.ts) >= str(start_date),
        func.date(Transaction.ts) <= str(today_date)
    ).order_by(Transaction.ts.asc()).all()

    total_sales = sum(t.amount for t in txs)
    total_tx_count = len(txs)
    aov = round(total_sales / total_tx_count, 2) if total_tx_count > 0 else 0.0

    # Daily aggregation
    daily_map: Dict[str, Dict[str, Any]] = {}
    for i in range(days_back):
        d = start_date + timedelta(days=i)
        d_str = str(d)
        daily_map[d_str] = {
            "date": d_str,
            "display_date": d.strftime("%d %b"),
            "day": d.strftime("%a"),
            "sales": 0.0,
            "transactions": 0
        }

    for t in txs:
        t_date = str(t.ts.date())
        if t_date in daily_map:
            daily_map[t_date]["sales"] += t.amount
            daily_map[t_date]["transactions"] += 1

    sales_series = [
        {
            "date": v["display_date"],
            "raw_date": v["date"],
            "day": v["day"],
            "sales": round(v["sales"], 2),
            "transactions": v["transactions"]
        }
        for v in daily_map.values()
    ]

    active_days = [d for d in sales_series if d["transactions"] > 0]
    best_day = max(active_days, key=lambda x: x["sales"]) if active_days else {"date": "N/A", "sales": 0.0, "day": ""}
    worst_day = min(active_days, key=lambda x: x["sales"]) if active_days else {"date": "N/A", "sales": 0.0, "day": ""}

    # Category breakdown
    cat_query = db.query(
        Product.category,
        func.sum(TransactionItem.qty * TransactionItem.price).label("revenue"),
        func.sum(TransactionItem.qty).label("units")
    ).join(
        TransactionItem, Product.id == TransactionItem.product_id
    ).join(
        Transaction, TransactionItem.transaction_id == Transaction.id
    ).filter(
        Transaction.merchant_id == merchant_id,
        func.date(Transaction.ts) >= str(start_date)
    ).group_by(Product.category).order_by(desc("revenue")).all()

    category_breakdown = [
        {
            "category": row.category,
            "revenue": round(float(row.revenue or 0), 2),
            "units": int(row.units or 0),
            "percentage": round((float(row.revenue or 0) / (total_sales or 1)) * 100, 1)
        }
        for row in cat_query
    ]

    # Peak hours (7–22)
    hour_map = {h: {"hour": f"{h:02d}:00", "sales": 0.0, "transactions": 0} for h in range(7, 23)}
    for t in txs:
        h = t.ts.hour
        if h in hour_map:
            hour_map[h]["sales"] += t.amount
            hour_map[h]["transactions"] += 1

    peak_hours = [
        {"hour": v["hour"], "sales": round(v["sales"], 2), "transactions": v["transactions"]}
        for v in sorted(hour_map.values(), key=lambda x: x["hour"])
    ]

    return {
        "range": time_range,
        "total_sales": round(total_sales, 2),
        "total_transactions": total_tx_count,
        "average_order_value": aov,
        "sales_series": sales_series,
        "category_breakdown": category_breakdown,
        "peak_hours": peak_hours,
        "best_day": best_day,
        "worst_day": worst_day,
    }
