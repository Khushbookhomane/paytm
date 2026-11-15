import math
from datetime import timedelta
from typing import List, Dict, Any
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models import Product, Transaction, TransactionItem
from ..utils.dates import get_ist_today


def generate_inventory_forecast(db: Session, merchant_id: int, forecast_days: int = 7) -> List[Dict[str, Any]]:
    """
    Day-of-Week Adjusted Seasonal Moving Average Demand Forecasting.
    Uses real IST today as anchor — never derives date from transaction history.
    """
    products = db.query(Product).filter(Product.merchant_id == merchant_id).all()
    if not products:
        return []

    anchor_date = get_ist_today()
    start_date = anchor_date - timedelta(days=90)

    raw_sales = db.query(
        TransactionItem.product_id,
        func.date(Transaction.ts).label("sale_date"),
        func.sum(TransactionItem.qty).label("daily_qty")
    ).join(
        Transaction, TransactionItem.transaction_id == Transaction.id
    ).filter(
        Transaction.merchant_id == merchant_id,
        func.date(Transaction.ts) >= str(start_date)
    ).group_by(
        TransactionItem.product_id,
        func.date(Transaction.ts)
    ).all()

    if raw_sales:
        df = pd.DataFrame([
            {"product_id": r.product_id, "date": pd.to_datetime(r.sale_date), "qty": float(r.daily_qty)}
            for r in raw_sales
        ])
    else:
        df = pd.DataFrame(columns=["product_id", "date", "qty"])

    forecast_results = []

    for product in products:
        p_df = df[df["product_id"] == product.id] if not df.empty else pd.DataFrame()

        dow_totals = {dow: [] for dow in range(7)}
        if not p_df.empty:
            for _, row in p_df.iterrows():
                dow_totals[row["date"].weekday()].append(row["qty"])

        dow_means = {dow: (np.mean(vals) if vals else 1.0) for dow, vals in dow_totals.items()}
        overall_mean = np.mean(list(dow_means.values())) or 1.0
        dow_factors = {dow: (dow_means[dow] / overall_mean) for dow in range(7)}

        if not p_df.empty:
            recent_p = p_df[p_df["date"] >= pd.to_datetime(anchor_date - timedelta(days=14))]
            recent_base = recent_p["qty"].mean() if not recent_p.empty else overall_mean
            std_err = recent_p["qty"].std() if len(recent_p) > 1 and not np.isnan(recent_p["qty"].std()) else 1.2
        else:
            recent_base = 2.0
            std_err = 1.0

        std_err = max(0.5, float(std_err))

        weekday_avg = np.mean([dow_means[d] for d in range(5)]) or 1.0
        weekend_avg = np.mean([dow_means[5], dow_means[6]]) or 1.0
        weekend_uplift_pct = round(((weekend_avg - weekday_avg) / weekday_avg) * 100, 1)
        weekend_spike_flag = bool(weekend_uplift_pct >= 25.0)

        daily_forecast = []
        total_pred_demand = 0.0

        for i in range(1, forecast_days + 1):
            f_date = anchor_date + timedelta(days=i)
            dow = f_date.weekday()
            pred = max(0.5, recent_base * dow_factors.get(dow, 1.0))
            pred_rounded = round(float(pred), 1)
            lower = max(0.0, round(pred_rounded - 1.28 * std_err, 1))
            upper = round(pred_rounded + 1.28 * std_err, 1)

            daily_forecast.append({
                "day": f_date.strftime("%a"),
                "date": f_date.strftime("%d %b"),
                "pred": pred_rounded,
                "lower": lower,
                "upper": upper,
                "is_weekend": dow in (5, 6),
            })
            total_pred_demand += pred_rounded

        total_pred_7d = round(total_pred_demand, 1)

        safety_stock = product.reorder_level
        deficit = (total_pred_7d + safety_stock) - product.stock_qty
        suggested_reorder_qty = math.ceil(max(0.0, deficit))

        three_day_demand = sum(d["pred"] for d in daily_forecast[:3])
        if product.stock_qty <= 0 or product.stock_qty <= product.reorder_level or product.stock_qty < three_day_demand:
            urgency = "urgent"
        elif product.stock_qty < total_pred_7d:
            urgency = "moderate"
        else:
            urgency = "normal"

        forecast_results.append({
            "product_id": product.id,
            "product_name": product.name,
            "category": product.category,
            "current_stock": product.stock_qty,
            "predicted_demand_7d": total_pred_7d,
            "daily_forecast": daily_forecast,
            "weekend_spike_flag": weekend_spike_flag,
            "weekend_uplift_pct": weekend_uplift_pct,
            "suggested_reorder_qty": suggested_reorder_qty,
            "urgency": urgency,
        })

    urgency_order = {"urgent": 0, "moderate": 1, "normal": 2}
    forecast_results.sort(key=lambda x: (urgency_order[x["urgency"]], -x["suggested_reorder_qty"]))
    return forecast_results
