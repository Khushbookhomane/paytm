from datetime import timedelta
from typing import Dict, Any, List
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models import Customer, Transaction
from ..utils.dates import get_ist_today


def get_customer_segments(db: Session, merchant_id: int) -> Dict[str, Any]:
    """
    RFM (Recency, Frequency, Monetary) rule-based customer segmentation.
    Uses deterministic business rules — no KMeans (insufficient data for reliable clustering).
    Uses real IST today as anchor date.
    """
    customers = db.query(Customer).filter(Customer.merchant_id == merchant_id).all()
    if not customers:
        return {"summary": [], "customers": []}

    today_date = get_ist_today()

    tx_summary = db.query(
        Transaction.customer_id,
        func.max(Transaction.ts).label("last_visit"),
        func.count(Transaction.id).label("visit_count"),
        func.sum(Transaction.amount).label("total_spend")
    ).filter(
        Transaction.merchant_id == merchant_id,
        Transaction.customer_id.isnot(None)
    ).group_by(Transaction.customer_id).all()

    tx_map = {
        row.customer_id: {
            "last_visit": row.last_visit.date() if row.last_visit else None,
            "visit_count": int(row.visit_count or 0),
            "total_spend": round(float(row.total_spend or 0), 2),
        }
        for row in tx_summary
    }

    cust_records = []
    for c in customers:
        t_info = tx_map.get(c.id, {"last_visit": None, "visit_count": 0, "total_spend": 0.0})
        recency_days = (today_date - t_info["last_visit"]).days if t_info["last_visit"] else 90
        visit_count = t_info["visit_count"]
        total_spend = t_info["total_spend"]
        avg_bill = round(total_spend / visit_count, 2) if visit_count > 0 else 0.0

        cust_records.append({
            "id": c.id,
            "name": c.name,
            "phone_masked": c.phone_masked,
            "first_seen": c.first_seen,
            "recency_days": recency_days,
            "visit_count": visit_count,
            "total_spend": total_spend,
            "avg_bill": avg_bill,
        })

    reg_count = occ_count = at_risk_count = 0
    classified_items = []

    for item in cust_records:
        r = item["recency_days"]
        f = item["visit_count"]
        m = item["total_spend"]

        if r >= 21 and f >= 4:
            segment = "At-risk"
            churn_risk = True
            reason = f"No visits in {r} days (previously visited {f} times, spent ₹{int(m)})"
            at_risk_count += 1
        elif r <= 14 and f >= 5:
            segment = "Regular"
            churn_risk = False
            reason = f"Visited {r}d ago · {f} visits · ₹{int(item['avg_bill'])} avg bill"
            reg_count += 1
        else:
            segment = "Occasional"
            churn_risk = False
            reason = f"Visits occasionally · {f} purchases"
            occ_count += 1

        item["segment"] = segment
        item["churn_risk"] = churn_risk
        item["reason"] = reason
        classified_items.append(item)

    seg_priority = {"At-risk": 0, "Regular": 1, "Occasional": 2}
    classified_items.sort(key=lambda x: (seg_priority[x["segment"]], -x["total_spend"]))

    total_c = len(classified_items) or 1
    summary = [
        {
            "segment": "Regular",
            "count": reg_count,
            "percentage": round((reg_count / total_c) * 100, 1),
            "description": "Frequent and loyal shoppers with consistent visits",
        },
        {
            "segment": "Occasional",
            "count": occ_count,
            "percentage": round((occ_count / total_c) * 100, 1),
            "description": "Intermittent shoppers who visit for top-up purchases",
        },
        {
            "segment": "At-risk",
            "count": at_risk_count,
            "percentage": round((at_risk_count / total_c) * 100, 1),
            "description": "High past spenders who have stopped visiting for 21+ days",
        },
    ]

    return {"summary": summary, "customers": classified_items}
