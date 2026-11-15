from datetime import timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models import Transaction, TransactionItem, Product, Expense
from ..utils.dates import get_ist_today
from .llm import llm_service


def get_finance_summary(db: Session, merchant_id: int, time_range: str = "month") -> Dict[str, Any]:
    """Compute exact financial statement and cash-flow series using real IST date."""
    today_date = get_ist_today()
    days_back = 7 if time_range == "week" else 30
    start_date = today_date - timedelta(days=days_back - 1)

    # 1. Total Revenue
    txs = db.query(Transaction).filter(
        Transaction.merchant_id == merchant_id,
        func.date(Transaction.ts) >= str(start_date),
        func.date(Transaction.ts) <= str(today_date)
    ).all()
    revenue = round(sum(t.amount for t in txs), 2)

    # 2. COGS
    items = db.query(
        TransactionItem.qty,
        Product.cost_price
    ).join(
        Product, TransactionItem.product_id == Product.id
    ).join(
        Transaction, TransactionItem.transaction_id == Transaction.id
    ).filter(
        Transaction.merchant_id == merchant_id,
        func.date(Transaction.ts) >= str(start_date),
        func.date(Transaction.ts) <= str(today_date)
    ).all()

    cogs = round(sum(qty * cost_price for qty, cost_price in items), 2)
    gross_profit = round(revenue - cogs, 2)

    # 3. Operating Expenses (exclude inventory/supplier — already in COGS)
    expenses = db.query(Expense).filter(
        Expense.merchant_id == merchant_id,
        Expense.date >= start_date,
        Expense.date <= today_date
    ).all()

    expenses_by_cat: Dict[str, float] = {}
    for exp in expenses:
        if exp.category.lower() not in ("inventory", "stock", "supplier"):
            cat = exp.category.capitalize()
            expenses_by_cat[cat] = expenses_by_cat.get(cat, 0.0) + exp.amount

    total_expenses = round(sum(expenses_by_cat.values()), 2)
    net_profit = round(gross_profit - total_expenses, 2)
    net_margin_pct = round((net_profit / (revenue or 1)) * 100, 1)

    # 4. Daily Cash Flow Series
    exp_by_date: Dict[str, float] = {}
    for exp in expenses:
        d_str = str(exp.date)
        exp_by_date[d_str] = exp_by_date.get(d_str, 0.0) + exp.amount

    sales_by_date: Dict[str, float] = {}
    for t in txs:
        d_str = str(t.ts.date())
        sales_by_date[d_str] = sales_by_date.get(d_str, 0.0) + t.amount

    daily_cashflow = []
    for i in range(days_back):
        d = start_date + timedelta(days=i)
        d_str = str(d)
        inflow = round(sales_by_date.get(d_str, 0.0), 2)
        outflow = round(exp_by_date.get(d_str, 0.0), 2)
        daily_cashflow.append({
            "date": d.strftime("%d %b"),
            "raw_date": d_str,
            "inflow": inflow,
            "outflow": outflow,
            "net": round(inflow - outflow, 2),
        })

    return {
        "range": time_range,
        "revenue": revenue,
        "cogs": cogs,
        "gross_profit": gross_profit,
        "expenses_total": total_expenses,
        "expenses_by_category": {k: round(v, 2) for k, v in expenses_by_cat.items()},
        "net_profit": net_profit,
        "net_margin_pct": net_margin_pct,
        "cash_flow_series": daily_cashflow,
    }


def explain_finance_metrics(summary: Dict[str, Any], language: str = "hi") -> Dict[str, Any]:
    """Plain-language finance explanation. Numbers strictly from computed summary."""
    lang = language.lower()
    if lang not in ("hi", "en", "mr"):
        lang = "hi"

    rev = int(summary["revenue"])
    cogs = int(summary["cogs"])
    gross = int(summary["gross_profit"])
    exp = int(summary["expenses_total"])
    net = int(summary["net_profit"])
    margin = summary["net_margin_pct"]
    period = summary["range"]

    if llm_service.is_online():
        prompt = f"""Explain this kirana store's finances to the shopkeeper in simple, conversational {lang}:
- Period: {period}
- Total Revenue: ₹{rev:,}
- Product Cost (COGS): ₹{cogs:,}
- Gross Profit: ₹{gross:,}
- Store Fixed Expenses: ₹{exp:,}
- Net Profit: ₹{net:,}
- Net Margin: {margin}%

Rules:
1. Write exactly 3-4 short sentences.
2. Use ONLY the exact figures above. Do NOT invent numbers.
3. Be encouraging and clear.
4. Language: {lang} (Hindi/Marathi in Devanagari, English in Latin).
"""
        try:
            llm_text = llm_service.generate_text(prompt, max_tokens=250)
            sentences = [s.strip() for s in llm_text.replace("।", ".").split(".") if s.strip()]
            if len(sentences) >= 2:
                return {"summary_text": llm_text.strip(), "sentences": sentences[:5], "language": lang, "key_metrics": summary}
        except Exception as e:
            print(f"[FinanceExplain] LLM error: {e}")

    # Deterministic fallback
    time_frame_hi = "पिछले 30 दिनों" if period == "month" else "पिछले 7 दिनों"
    time_frame_mr = "मागील ३० दिवसांत" if period == "month" else "मागील ७ दिवसांत"

    if lang == "en":
        sentences = [
            f"Over the last {'30 days' if period == 'month' else '7 days'}, your store generated ₹{rev:,} in total revenue.",
            f"After ₹{cogs:,} in stock purchase costs, your gross profit is ₹{gross:,}.",
            f"Deducting ₹{exp:,} in operating expenses, your net take-home profit is ₹{net:,}.",
            f"Your store is running at a {margin}% net profit margin.",
        ]
    elif lang == "mr":
        sentences = [
            f"{time_frame_mr} तुमच्या दुकानाने एकूण ₹{rev:,} ची विक्री नोंदवली.",
            f"मालाच्या खरेदीवर ₹{cogs:,} खर्च झाल्यानंतर स्थूल नफा ₹{gross:,} राहिला.",
            f"दुकानाचे खर्च ₹{exp:,} वजा जाता निव्वळ बचत ₹{net:,} झाली.",
            f"तुमचा व्यवसाय {margin}% नफा मार्जिनवर चालू आहे.",
        ]
    else:
        sentences = [
            f"{time_frame_hi} में आपकी दुकान की कुल बिक्री ₹{rev:,} रही।",
            f"सामान की खरीद लागत ₹{cogs:,} हटाने के बाद सकल मुनाफा ₹{gross:,} बना।",
            f"दुकान के खर्चे ₹{exp:,} निकालने पर शुद्ध बचत ₹{net:,} रही।",
            f"आपकी दुकान {margin}% के मजबूत शुद्ध मार्जिन पर चल रही है।",
        ]

    return {
        "summary_text": " ".join(sentences),
        "sentences": sentences,
        "language": lang,
        "key_metrics": summary,
    }
