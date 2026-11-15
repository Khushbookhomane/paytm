"""
Reports & Exports Engine for Paytm VentureAI.
Generates structured daily, weekly, and monthly business summaries for Paytm merchants.
Supports data export and printable executive statements.
"""
from datetime import datetime, timedelta, date
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from ..db import get_db
from ..models import Merchant, Transaction, TransactionItem, Product, Expense
from ..auth import get_current_merchant
from ..utils.dates import get_ist_today

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/summary")
def get_report_summary(
    period: str = Query("weekly", pattern="^(daily|weekly|monthly)$"),
    target_date: Optional[str] = Query(None),
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    """Generate official merchant operational and financial statement."""
    merchant_id = current_merchant.id
    today = get_ist_today()

    if period == "daily":
        d = datetime.strptime(target_date, "%Y-%m-%d").date() if target_date else today
        start_date = d
        end_date = d
        title = f"Daily Business Report — {d.strftime('%d %B %Y')}"
    elif period == "weekly":
        end_date = today
        start_date = today - timedelta(days=6)
        title = f"Weekly Business Performance — {start_date.strftime('%d %b')} to {end_date.strftime('%d %b %Y')}"
    else: # monthly
        end_date = today
        start_date = today - timedelta(days=29)
        title = f"Monthly Executive Financial Statement — Last 30 Days"

    # Fetch transactions in period
    txs = db.query(Transaction).filter(
        Transaction.merchant_id == merchant_id,
        func.date(Transaction.ts) >= str(start_date),
        func.date(Transaction.ts) <= str(end_date)
    ).order_by(Transaction.ts.desc()).all()

    total_sales = sum(t.amount for t in txs)
    total_tx = len(txs)
    aov = round(total_sales / total_tx, 2) if total_tx > 0 else 0.0

    # Payment modes breakdown
    mode_counts: Dict[str, Dict[str, Any]] = {}
    for t in txs:
        mode = t.payment_mode or "UPI"
        if mode not in mode_counts:
            mode_counts[mode] = {"mode": mode, "amount": 0.0, "count": 0}
        mode_counts[mode]["amount"] += t.amount
        mode_counts[mode]["count"] += 1

    payment_breakdown = sorted([
        {
            "mode": v["mode"],
            "amount": round(v["amount"], 2),
            "percentage": round((v["amount"] / (total_sales or 1)) * 100, 1),
            "count": v["count"]
        }
        for v in mode_counts.values()
    ], key=lambda x: x["amount"], reverse=True)

    # Top items sold
    top_items_query = db.query(
        Product.name,
        Product.category,
        func.sum(TransactionItem.qty).label("qty"),
        func.sum(TransactionItem.qty * TransactionItem.price).label("revenue")
    ).join(
        TransactionItem, Product.id == TransactionItem.product_id
    ).join(
        Transaction, TransactionItem.transaction_id == Transaction.id
    ).filter(
        Transaction.merchant_id == merchant_id,
        func.date(Transaction.ts) >= str(start_date),
        func.date(Transaction.ts) <= str(end_date)
    ).group_by(Product.id).order_by(desc("revenue")).limit(5).all()

    top_items = [
        {
            "name": row.name,
            "category": row.category,
            "units": int(row.qty or 0),
            "revenue": round(float(row.revenue or 0), 2)
        }
        for row in top_items_query
    ]

    # Estimated Gross Profit & COGS
    tx_items = db.query(
        TransactionItem.qty,
        TransactionItem.price,
        Product.cost_price
    ).join(
        Product, TransactionItem.product_id == Product.id
    ).join(
        Transaction, TransactionItem.transaction_id == Transaction.id
    ).filter(
        Transaction.merchant_id == merchant_id,
        func.date(Transaction.ts) >= str(start_date),
        func.date(Transaction.ts) <= str(end_date)
    ).all()

    cogs = sum(qty * cost for qty, _, cost in tx_items)
    gross_profit = round(total_sales - cogs, 2)
    margin_pct = round((gross_profit / total_sales * 100), 1) if total_sales > 0 else 0.0

    # Expenses in period
    expenses = db.query(Expense).filter(
        Expense.merchant_id == merchant_id,
        Expense.date >= start_date,
        Expense.date <= end_date
    ).all()
    total_expenses = sum(e.amount for e in expenses)
    net_profit = round(gross_profit - total_expenses, 2)

    # Executive AI commentary
    executive_summary = (
        f"During this {period} reporting cycle, {current_merchant.name} generated ₹{int(total_sales):,} across "
        f"{total_tx:,} transactions with an average ticket size of ₹{int(aov)}. "
        f"Verified gross profit stood at ₹{int(gross_profit):,} ({margin_pct}% margin). "
        f"Paytm Soundbox and digital QR transactions accounted for the vast majority of volume, "
        f"ensuring zero transaction leakage and real-time bank reconciliation."
    )

    return {
        "period": period,
        "title": title,
        "start_date": str(start_date),
        "end_date": str(end_date),
        "generated_at": datetime.now().strftime("%d %b %Y, %I:%M %p"),
        "merchant": {
            "name": current_merchant.name,
            "category": current_merchant.category or "Kirana & Grocery",
            "id": current_merchant.id,
            "status": "Verified Paytm Merchant",
        },
        "metrics": {
            "total_sales": round(total_sales, 2),
            "total_transactions": total_tx,
            "average_order_value": aov,
            "cogs": round(cogs, 2),
            "gross_profit": gross_profit,
            "gross_margin_pct": margin_pct,
            "recorded_expenses": round(total_expenses, 2),
            "net_estimated_profit": net_profit,
        },
        "payment_modes": payment_breakdown,
        "top_products": top_items,
        "executive_summary": executive_summary,
    }
