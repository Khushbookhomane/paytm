import json
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from ..models import ChatMessage, Merchant
from .analytics import get_dashboard_metrics
from .inventory import get_inventory_status
from .forecasting import generate_inventory_forecast
from .customers import get_customer_segments
from .finance import get_finance_summary
from .recommendations import generate_recommendations
from .llm import llm_service

COPILOT_TOOLS = [
    {
        "name": "get_sales_summary",
        "description": "Get today's store sales, vs yesterday growth %, and 7-day trend.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_top_products",
        "description": "Get the top 5 highest selling products by units and revenue over the last 30 days.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_low_stock",
        "description": "Get products currently running below reorder level that need immediate supplier restock.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_forecast",
        "description": "Get 7-day predicted demand forecast and suggested reorder quantities.",
        "input_schema": {
            "type": "object",
            "properties": {"days": {"type": "integer", "description": "Number of forecast days, default 7"}},
        },
    },
    {
        "name": "get_customer_segments",
        "description": "Get customer RFM segments: Regulars, Occasional, and At-risk churn customers.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_finance_summary",
        "description": "Get store finance: gross revenue, COGS, operating expenses, and net profit.",
        "input_schema": {
            "type": "object",
            "properties": {"range": {"type": "string", "enum": ["week", "month"]}},
        },
    },
    {
        "name": "get_recommendations",
        "description": "Get prioritized action cards and recommendations for the store today.",
        "input_schema": {"type": "object", "properties": {}},
    },
]


def execute_copilot_tool(tool_name: str, tool_args: Dict[str, Any], db: Session, merchant_id: int, language: str) -> Dict[str, Any]:
    """Execute a business tool and return verified computed data."""
    if tool_name == "get_sales_summary":
        dash = get_dashboard_metrics(db, merchant_id)
        return {
            "today_sales": dash["today_sales"],
            "vs_yesterday_pct": dash["vs_yesterday_pct"],
            "estimated_profit_today": dash["estimated_profit"],
            "margin_pct": dash["margin_pct"],
        }
    elif tool_name == "get_top_products":
        dash = get_dashboard_metrics(db, merchant_id)
        return {"top_5": dash["top_5_products"]}
    elif tool_name == "get_low_stock":
        inv = get_inventory_status(db, merchant_id)
        low_items = [i for i in inv if i["status"] in ("low", "out")]
        return {
            "low_stock_count": len(low_items),
            "items": [{"name": i["name"], "stock": i["stock_qty"], "reorder_level": i["reorder_level"]} for i in low_items[:6]]
        }
    elif tool_name == "get_forecast":
        fc = generate_inventory_forecast(db, merchant_id, forecast_days=tool_args.get("days", 7))
        urgent = [f for f in fc if f["urgency"] == "urgent"]
        return {
            "total_tracked": len(fc),
            "urgent_items": [
                {
                    "name": str(f["product_name"]),
                    "current_stock": int(f["current_stock"]),
                    "pred_demand_7d": float(f["predicted_demand_7d"]),
                    "suggested_order": int(f["suggested_reorder_qty"]),
                    "weekend_spike": bool(f["weekend_spike_flag"])
                }
                for f in urgent[:5]
            ]
        }
    elif tool_name == "get_customer_segments":
        seg = get_customer_segments(db, merchant_id)
        at_risk = [c for c in seg["customers"] if c["segment"] == "At-risk"]
        return {
            "summary": seg["summary"],
            "at_risk_count": len(at_risk),
            "at_risk_sample": [{"name": c["name"], "recency_days": c["recency_days"]} for c in at_risk[:5]]
        }
    elif tool_name == "get_finance_summary":
        fin = get_finance_summary(db, merchant_id, time_range=tool_args.get("range", "month"))
        return {
            "revenue": fin["revenue"],
            "cogs": fin["cogs"],
            "expenses": fin["expenses_total"],
            "net_profit": fin["net_profit"],
            "net_margin_pct": fin["net_margin_pct"]
        }
    elif tool_name == "get_recommendations":
        recs = generate_recommendations(db, merchant_id, language=language)
        return {
            "recommendations": [{"title": r["title"], "why": r["why"], "action": r["suggested_action"]} for r in recs[:4]]
        }
    return {"error": f"Unknown tool: {tool_name}"}


def process_copilot_chat(
    message: str,
    language: str,
    merchant_id: int,
    db: Session,
    merchant: Merchant = None,
) -> Dict[str, Any]:
    """
    Handle merchant copilot conversation.
    Uses merchant's actual name — never hardcodes store identity.
    """
    lang = (language or "hi").lower()
    if lang not in ("hi", "en", "mr"):
        lang = "hi"

    # Resolve merchant name for personalisation
    if merchant is None:
        merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    store_name = merchant.name if merchant else "आपकी दुकान"

    # Save user message
    db.add(ChatMessage(merchant_id=merchant_id, role="user", content=message, ts=datetime.utcnow()))
    db.commit()

    # Language detection from message content
    msg_lower = message.lower()
    has_devanagari = any("\u0900" <= ch <= "\u097f" for ch in message)
    if not has_devanagari and any(w in msg_lower for w in ["what", "which", "how", "restock", "profit", "sales", "customer", "today"]):
        lang = "en"
    elif any(w in msg_lower for w in ["काय", "किती", "झाली", "आठवडा", "साठा", "नफा"]):
        lang = "mr"

    # Intent → tool mapping
    fin_range = "week" if any(w in msg_lower for w in ["हफ्ते", "week", "weekly", "आठवडा"]) else "month"
    tools_to_run = []

    if any(k in msg_lower for k in ["बिक्री", "sale", "sales", "आज", "today", "revenue", "कमाई", "विक्री"]):
        tools_to_run.append("get_sales_summary")
    if any(k in msg_lower for k in ["टॉप", "top", "fast", "popular", "बिकने वाला", "जास्त"]):
        tools_to_run.append("get_top_products")
    if any(k in msg_lower for k in ["स्टॉक", "stock", "restock", "कम", "खत्म", "मंगाना", "साठा"]):
        tools_to_run.append("get_low_stock")
        tools_to_run.append("get_forecast")
    if any(k in msg_lower for k in ["ग्राहक", "customer", "churn", "offer", "ऑफर"]):
        tools_to_run.append("get_customer_segments")
    if any(k in msg_lower for k in ["मुनाफा", "profit", "margin", "finance", "खर्चा", "expense", "नफा"]):
        tools_to_run.append("get_finance_summary")
    if any(k in msg_lower for k in ["सुझाव", "advice", "recommend", "क्या करूं", "काय करू", "improve", "better"]):
        tools_to_run.append("get_recommendations")

    if not tools_to_run:
        tools_to_run = ["get_sales_summary", "get_low_stock"]

    # Execute tools
    tool_results = {}
    for tool_name in tools_to_run:
        args = {"range": fin_range} if tool_name == "get_finance_summary" else {}
        tool_results[tool_name] = execute_copilot_tool(tool_name, args, db, merchant_id, lang)

    # Online Claude — use actual merchant name, no hardcoded identity
    if llm_service.is_online():
        system_prompt = f"""You are 'Paytm VentureAI', an expert AI business copilot for small Indian store owners.
You are currently helping the owner of '{store_name}'.
Language: {lang} (Hindi in Devanagari, Marathi in Devanagari, English in Latin).

CRITICAL RULES:
1. All numbers MUST come strictly from the tool results below. Never invent figures.
2. Keep answer brief and actionable (2-4 sentences).
3. Be respectful and encouraging — like a trusted local business advisor.
4. Do NOT output raw JSON or code.
5. Address the merchant by their store name '{store_name}' naturally if appropriate.
"""
        user_content = f"Merchant Question: {message}\n\nVerified Store Data:\n{json.dumps(tool_results, ensure_ascii=False)}"
        try:
            reply = llm_service.generate_text(user_content, system_prompt=system_prompt, max_tokens=350)
            if reply and len(reply.strip()) > 10:
                db.add(ChatMessage(merchant_id=merchant_id, role="assistant", content=reply.strip(), ts=datetime.utcnow()))
                db.commit()
                return {"reply": reply.strip(), "language": lang, "tools_used": tools_to_run, "tool_results": tool_results}
        except Exception as e:
            print(f"[Copilot] LLM failed: {e}")

    # Deterministic offline fallback — uses real computed numbers, no hardcoded figures
    reply_parts = []

    if "get_sales_summary" in tool_results:
        s = tool_results["get_sales_summary"]
        ts_val = int(s["today_sales"])
        vs = s["vs_yesterday_pct"]
        prof = int(s["estimated_profit_today"])
        if lang == "en":
            trend = f"+{vs}% vs yesterday" if vs >= 0 else f"{vs}% vs yesterday"
            reply_parts.append(f"Today's sales at {store_name} are ₹{ts_val:,} ({trend}), with an estimated profit of ₹{prof:,}.")
        elif lang == "mr":
            trend = f"कालपेक्षा +{vs}%" if vs >= 0 else f"कालपेक्षा {vs}%"
            reply_parts.append(f"आज {store_name} ची एकूण विक्री ₹{ts_val:,} झाली ({trend}), अंदाजे नफा ₹{prof:,}.")
        else:
            trend = f"कल से +{vs}%" if vs >= 0 else f"कल से {vs}%"
            reply_parts.append(f"आज {store_name} की कुल बिक्री ₹{ts_val:,} रही ({trend}), अनुमानित मुनाफा ₹{prof:,}।")

    if "get_low_stock" in tool_results:
        ls = tool_results["get_low_stock"]
        count = ls["low_stock_count"]
        names = ", ".join([i["name"] for i in ls["items"][:2]]) if ls["items"] else ""
        if lang == "en":
            reply_parts.append(f"{count} items are running low on stock{(' including ' + names) if names else ''}. Restock before the weekend rush.")
        elif lang == "mr":
            reply_parts.append(f"दुकानात {count} वस्तूंचा साठा कमी आहे{(' (' + names + ')') if names else ''}. वीकेंडपूर्वी माल मागवा.")
        else:
            reply_parts.append(f"दुकान में {count} सामानों का स्टॉक कम है{(' (' + names + ')') if names else ''}। वीकेंड से पहले माल मंगाएं।")

    if "get_customer_segments" in tool_results:
        cs = tool_results["get_customer_segments"]
        churn_c = cs["at_risk_count"]
        if lang == "en":
            reply_parts.append(f"{churn_c} regular customers haven't visited in 21+ days. Send them a WhatsApp win-back offer.")
        elif lang == "mr":
            reply_parts.append(f"{churn_c} नियमित ग्राहक २१+ दिवसांपासून आलेले नाहीत. त्यांना व्हॉट्सॲप ऑफर पाठवा.")
        else:
            reply_parts.append(f"{churn_c} नियमित ग्राहक 21+ दिनों से नहीं आए। उन्हें व्हाट्सएप ऑफर भेजें।")

    if "get_finance_summary" in tool_results:
        f_data = tool_results["get_finance_summary"]
        net = int(f_data["net_profit"])
        marg = f_data["net_margin_pct"]
        period = "this week" if fin_range == "week" else "this month"
        period_hi = "इस हफ्ते" if fin_range == "week" else "इस महीने"
        period_mr = "या आठवड्यात" if fin_range == "week" else "या महिन्यात"
        if lang == "en":
            reply_parts.append(f"Net profit {period}: ₹{net:,} at {marg}% margin.")
        elif lang == "mr":
            reply_parts.append(f"{period_mr} निव्वळ नफा ₹{net:,} असून मार्जिन {marg}% आहे.")
        else:
            reply_parts.append(f"{period_hi} शुद्ध मुनाफा ₹{net:,}, मार्जिन {marg}%।")

    if "get_recommendations" in tool_results:
        recs = tool_results["get_recommendations"].get("recommendations", [])
        if recs:
            top = recs[0]
            if lang == "en":
                reply_parts.append(f"Top action: {top['action']}")
            elif lang == "mr":
                reply_parts.append(f"महत्त्वाची कृती: {top['action']}")
            else:
                reply_parts.append(f"मुख्य सुझाव: {top['action']}")

    # If no tool produced output, give a generic data-backed greeting
    if not reply_parts:
        if lang == "en":
            final_reply = f"Hello! I'm your VentureAI Copilot for {store_name}. Ask me about sales, stock, customers, or profits."
        elif lang == "mr":
            final_reply = f"नमस्कार! मी {store_name} साठी तुमचा VentureAI Copilot आहे. विक्री, साठा, ग्राहक किंवा नफ्याबद्दल विचारा."
        else:
            final_reply = f"नमस्ते! मैं {store_name} का VentureAI Copilot हूं। बिक्री, स्टॉक, ग्राहक या मुनाफे के बारे में पूछें।"
    else:
        final_reply = " ".join(reply_parts)

    db.add(ChatMessage(merchant_id=merchant_id, role="assistant", content=final_reply, ts=datetime.utcnow()))
    db.commit()

    return {"reply": final_reply, "language": lang, "tools_used": tools_to_run, "tool_results": tool_results}
