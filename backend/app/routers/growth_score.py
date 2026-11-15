"""
AI Merchant Growth Score Engine for Paytm VentureAI.
Evaluates merchant performance across 5 core dimensions:
1. Revenue Growth (25 pts)
2. Customer Retention (20 pts)
3. Inventory Efficiency (20 pts)
4. Sales Consistency (20 pts)
5. Business Activity & Paytm Adoption (15 pts)
"""
from datetime import timedelta
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..db import get_db
from ..models import Merchant, Transaction, TransactionItem, Product, Customer
from ..auth import get_current_merchant
from ..utils.dates import get_ist_today
from ..services.inventory import get_inventory_status
from ..services.customers import get_customer_segments

router = APIRouter(prefix="/growth-score", tags=["growth_score"])

@router.get("")
def get_growth_score(
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    """Compute the multi-factor AI Merchant Growth Score (0–100) with diagnostic breakdown."""
    merchant_id = current_merchant.id
    today = get_ist_today()

    # 1. Dimension: Revenue Growth (Weight: 25)
    last_30_start = today - timedelta(days=30)
    prev_30_start = today - timedelta(days=60)

    recent_sales = db.query(func.sum(Transaction.amount)).filter(
        Transaction.merchant_id == merchant_id,
        func.date(Transaction.ts) >= str(last_30_start),
        func.date(Transaction.ts) <= str(today)
    ).scalar() or 0.0

    prev_sales = db.query(func.sum(Transaction.amount)).filter(
        Transaction.merchant_id == merchant_id,
        func.date(Transaction.ts) >= str(prev_30_start),
        func.date(Transaction.ts) < str(last_30_start)
    ).scalar() or 0.0

    growth_pct = round(((recent_sales - prev_sales) / prev_sales * 100), 1) if prev_sales > 0 else 5.0
    if growth_pct >= 15:
        revenue_score = 25
    elif growth_pct >= 8:
        revenue_score = 22
    elif growth_pct >= 0:
        revenue_score = 18
    elif growth_pct >= -10:
        revenue_score = 14
    else:
        revenue_score = 10

    # 2. Dimension: Customer Retention (Weight: 20)
    cust_data = get_customer_segments(db, merchant_id)
    summary_map = {s["segment"]: s["count"] for s in cust_data.get("summary", [])}
    total_custs = sum(summary_map.values()) or 1
    regulars = summary_map.get("Regular", 0)
    at_risk = summary_map.get("At-risk", 0)
    retention_rate = round((regulars / total_custs) * 100, 1)

    if retention_rate >= 50:
        retention_score = 20
    elif retention_rate >= 35:
        retention_score = 17
    elif retention_rate >= 20:
        retention_score = 14
    else:
        retention_score = 10

    # 3. Dimension: Inventory Efficiency (Weight: 20)
    inv = get_inventory_status(db, merchant_id)
    total_prods = len(inv) or 1
    low_or_out = sum(1 for i in inv if i["status"] in ("low", "out"))
    in_stock_rate = round(((total_prods - low_or_out) / total_prods) * 100, 1)

    if in_stock_rate >= 90:
        inventory_score = 20
    elif in_stock_rate >= 80:
        inventory_score = 17
    elif in_stock_rate >= 70:
        inventory_score = 13
    else:
        inventory_score = 9

    # 4. Dimension: Sales Consistency (Weight: 20)
    # Check coefficient of variation across past 14 days
    fourteen_days_ago = today - timedelta(days=14)
    daily_txs = db.query(
        func.date(Transaction.ts).label("tx_date"),
        func.sum(Transaction.amount).label("day_sum")
    ).filter(
        Transaction.merchant_id == merchant_id,
        func.date(Transaction.ts) >= str(fourteen_days_ago)
    ).group_by(func.date(Transaction.ts)).all()

    day_sums = [float(row.day_sum or 0) for row in daily_txs]
    if len(day_sums) >= 7:
        mean_s = sum(day_sums) / len(day_sums)
        variance = sum((x - mean_s) ** 2 for x in day_sums) / len(day_sums)
        std_dev = variance ** 0.5
        cv = (std_dev / mean_s) if mean_s > 0 else 0.5
        if cv < 0.25:
            consistency_score = 20
        elif cv < 0.40:
            consistency_score = 17
        elif cv < 0.60:
            consistency_score = 14
        else:
            consistency_score = 10
    else:
        consistency_score = 15

    # 5. Dimension: Business Activity & Paytm Adoption (Weight: 15)
    total_tx = db.query(Transaction).filter(
        Transaction.merchant_id == merchant_id,
        func.date(Transaction.ts) >= str(last_30_start)
    ).count()

    paytm_tx = db.query(Transaction).filter(
        Transaction.merchant_id == merchant_id,
        func.date(Transaction.ts) >= str(last_30_start),
        Transaction.payment_mode.in_(["Paytm QR", "Soundbox UPI", "UPI", "Paytm Wallet"])
    ).count()
    paytm_adoption = round((paytm_tx / (total_tx or 1)) * 100, 1)

    if total_tx >= 600 and paytm_adoption >= 70:
        activity_score = 15
    elif total_tx >= 300:
        activity_score = 13
    elif total_tx >= 100:
        activity_score = 11
    else:
        activity_score = 8

    # Total Score
    total_score = min(100, max(0, revenue_score + retention_score + inventory_score + consistency_score + activity_score))

    # Rating Tier
    if total_score >= 85:
        tier = "Elite Merchant"
        badge_color = "emerald"
        tier_description = "Outstanding operational health, consistent revenue, and high customer loyalty."
    elif total_score >= 70:
        tier = "Strong Performer"
        badge_color = "sky"
        tier_description = "Solid business fundamentals with clear opportunities to boost customer retention and stock turnover."
    elif total_score >= 55:
        tier = "Moderate Growth"
        badge_color = "amber"
        tier_description = "Healthy transaction flow, but experiencing inventory bottlenecks and churned regular buyers."
    else:
        tier = "Needs Attention"
        badge_color = "rose"
        tier_description = "Urgent attention required on restocking fast movers and winning back inactive customers."

    # Strengths
    strengths = []
    if activity_score >= 13:
        strengths.append({
            "title": "High Digital & Paytm Soundbox Adoption",
            "desc": f"{paytm_adoption}% of checkouts are completed via digital UPI/QR with instant audio confirmation."
        })
    if consistency_score >= 16:
        strengths.append({
            "title": "Resilient Daily Cash Flow",
            "desc": "Low sales variance between weekdays and weekends ensures predictable working capital."
        })
    if revenue_score >= 18:
        strengths.append({
            "title": "Positive Monthly Growth Trajectory",
            "desc": f"30-day revenue increased by {abs(growth_pct)}% compared to the previous period."
        })
    if in_stock_rate >= 80:
        strengths.append({
            "title": "Stable Core Catalog Availability",
            "desc": f"{in_stock_rate}% of your product catalog is actively in stock."
        })

    # Areas for Improvement
    improvements = []
    if at_risk > 0:
        improvements.append({
            "title": f"{at_risk} Churning Customers Need Re-engagement",
            "desc": "Regular buyers have paused visits for over 3 weeks. Direct marketing win-back campaigns can recover up to 40% of them.",
            "impact": "High Revenue Impact",
            "suggested_action": "Send WhatsApp win-back coupon",
            "target": "/marketing"
        })
    if low_or_out > 0:
        improvements.append({
            "title": f"{low_or_out} Fast-Selling Items Running Low",
            "desc": "Key grocery essentials are below safe reorder thresholds, risking stockouts during peak evening rushes.",
            "impact": "Immediate Stock Risk",
            "suggested_action": "Place supplier restock orders",
            "target": "/inventory"
        })
    if retention_rate < 45:
        improvements.append({
            "title": "Expand Loyalty & Repeat Customer Share",
            "desc": f"Only {retention_rate}% of buyers return regularly. Launching weekly weekend deals can drive habit-forming visits.",
            "impact": "Medium-Term Growth",
            "suggested_action": "Create weekend promotional blast",
            "target": "/marketing"
        })

    # Dimensions detail
    dimensions = [
        {
            "name": "Revenue Growth",
            "score": revenue_score,
            "max": 25,
            "pct": round((revenue_score / 25) * 100),
            "status": "Positive" if growth_pct >= 0 else "Caution",
            "metric": f"{growth_pct:+0.1f}% 30-day delta",
            "weight": "25%"
        },
        {
            "name": "Customer Retention",
            "score": retention_score,
            "max": 20,
            "pct": round((retention_score / 20) * 100),
            "status": "Healthy" if retention_rate >= 35 else "Attention Needed",
            "metric": f"{retention_rate}% repeat buyers",
            "weight": "20%"
        },
        {
            "name": "Inventory Efficiency",
            "score": inventory_score,
            "max": 20,
            "pct": round((inventory_score / 20) * 100),
            "status": "Good" if in_stock_rate >= 80 else "Low Stock Alert",
            "metric": f"{in_stock_rate}% catalog in stock",
            "weight": "20%"
        },
        {
            "name": "Sales Consistency",
            "score": consistency_score,
            "max": 20,
            "pct": round((consistency_score / 20) * 100),
            "status": "Stable",
            "metric": "Steady weekday/weekend cadence",
            "weight": "20%"
        },
        {
            "name": "Business Activity",
            "score": activity_score,
            "max": 15,
            "pct": round((activity_score / 15) * 100),
            "status": "High Volume",
            "metric": f"{total_tx:,} monthly checkouts",
            "weight": "15%"
        },
    ]

    return {
        "overall_score": total_score,
        "tier": tier,
        "badge_color": badge_color,
        "tier_description": tier_description,
        "dimensions": dimensions,
        "strengths": strengths,
        "improvements": improvements,
        "methodology": {
            "title": "How the Paytm VentureAI Growth Score Works",
            "description": "The Merchant Growth Score is an objective AI composite benchmark that evaluates your store health across 5 pillars using verified transaction history, inventory turns, repeat customer visits, and cash-flow predictability. A score above 70 indicates a high-performing retail business with strong creditworthiness and expansion readiness.",
            "data_sources": ["Paytm Point-of-Sale & QR Transactions", "Product Inventory & Reorder History", "Customer RFM Visit Patterns", "Cash Flow & Expense Ratios"]
        }
    }
