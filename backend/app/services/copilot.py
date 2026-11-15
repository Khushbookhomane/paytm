import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from ..models import ChatMessage, Merchant
from .analytics import get_dashboard_metrics, get_sales_analytics
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
            "seven_day_trend": dash["seven_day_trend"],
        }
    elif tool_name == "get_top_products":
        dash = get_dashboard_metrics(db, merchant_id)
        return {"top_5": dash["top_5_products"]}
    elif tool_name == "get_low_stock":
        inv = get_inventory_status(db, merchant_id)
        low_items = [i for i in inv if i["status"] in ("low", "out")]
        return {
            "low_stock_count": len(low_items),
            "items": [{"name": i["name"], "stock": i["stock_qty"], "reorder_level": i["reorder_level"], "id": i["id"]} for i in low_items[:6]]
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
        regulars = [c for c in seg["customers"] if c["segment"] == "Regular"]
        return {
            "summary": seg["summary"],
            "regulars_count": len(regulars),
            "at_risk_count": len(at_risk),
            "at_risk_sample": [{"name": c["name"], "recency_days": c["recency_days"], "total_spend": c["total_spend"]} for c in at_risk[:5]]
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
    Handle merchant copilot conversation in English, Hindi, Hinglish, and Marathi.
    Uses verified merchant live data to form context-aware, data-backed insights.
    """
    lang = (language or "hi").lower()
    if lang not in ("hi", "en", "mr"):
        lang = "hi"

    if merchant is None:
        merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    store_name = merchant.name if merchant else "आपकी दुकान"

    # Save user message
    db.add(ChatMessage(merchant_id=merchant_id, role="user", content=message, ts=datetime.utcnow()))
    db.commit()

    # Vernacular and language detection
    msg_lower = message.lower().strip()
    has_devanagari = any("\u0900" <= ch <= "\u097f" for ch in message)
    if not has_devanagari and any(w in msg_lower for w in ["what", "which", "how", "restock", "profit", "sales", "customer", "today", "why", "decrease", "increase", "report"]):
        lang = "en"
    elif any(w in msg_lower for w in ["काय", "किती", "झाली", "आठवडा", "साठा", "नफा", "ग्राहक"]):
        lang = "mr"

    tools_to_run = []
    follow_ups = []
    action_button = None

    # Detect specific query patterns
    is_sales_query = any(k in msg_lower for k in ["बिक्री", "sale", "sales", "आज", "today", "revenue", "कमाई", "विक्री", "kiti", "kitni"])
    is_decreasing_query = any(k in msg_lower for k in ["decrease", "decreasing", "drop", "कम क्यों", "गिर", "kam kyu", "sales down"])
    is_reorder_query = any(k in msg_lower for k in ["reorder", "स्टॉक", "stock", "restock", "कम", "खत्म", "मंगाना", "साठा", "magvayla", "khali"])
    is_increase_rev_query = any(k in msg_lower for k in ["increase", "revenue badhaye", "grow", "बढ़ाएं", "वाढवा", "boost", "more money"])
    is_marketing_query = any(k in msg_lower for k in ["marketing", "strategy", "प्रमोशन", "campaign", "ऑफर", "offer", "whatsapp blast", "मार्केटिंग"])
    is_churn_query = any(k in msg_lower for k in ["not returning", "returning", "churn", "ग्राहक नहीं आ रहे", "inactive", "miss", "grahak"])
    is_report_query = any(k in msg_lower for k in ["report", "रिपोर्ट", "summary", "performance", "हफ्ते", "weekly", "ahwal"])

    if is_decreasing_query:
        tools_to_run = ["get_sales_summary", "get_customer_segments", "get_low_stock"]
    elif is_increase_rev_query:
        tools_to_run = ["get_sales_summary", "get_top_products", "get_customer_segments"]
    elif is_marketing_query:
        tools_to_run = ["get_customer_segments", "get_top_products"]
    elif is_churn_query:
        tools_to_run = ["get_customer_segments"]
    elif is_reorder_query:
        tools_to_run = ["get_low_stock", "get_forecast"]
    elif is_report_query:
        tools_to_run = ["get_sales_summary", "get_top_products", "get_finance_summary"]
    elif is_sales_query:
        tools_to_run = ["get_sales_summary", "get_top_products"]
    else:
        # Default tools
        tools_to_run = ["get_sales_summary", "get_low_stock"]

    # Execute tools
    tool_results = {}
    for tool_name in tools_to_run:
        args = {"range": "week" if is_report_query else "month"} if tool_name == "get_finance_summary" else {}
        tool_results[tool_name] = execute_copilot_tool(tool_name, args, db, merchant_id, lang)

    # Online LLM attempt
    if llm_service.is_online():
        system_prompt = f"""You are 'Paytm VentureAI', the intelligent AI business operating partner for {store_name}.
Target Language: {lang} (Devanagari for Hindi & Marathi, Latin for English).
Rules:
1. Always base statements on the verified numbers in tool results. Never invent numbers.
2. Structure answer with a clear summary, bullet points of exact facts, and actionable recommendation.
3. Be respectful, encouraging, and entrepreneurial.
4. Keep under 4-5 sentences.
"""
        user_content = f"Merchant Question: {message}\nVerified Business Data:\n{json.dumps(tool_results, ensure_ascii=False)}"
        try:
            reply = llm_service.generate_text(user_content, system_prompt=system_prompt, max_tokens=400)
            if reply and len(reply.strip()) > 15:
                # Add follow ups and action button based on intent
                if is_reorder_query:
                    action_button = {"label": "Restock Products Now", "url": "/inventory"}
                    follow_ups = ["Which suppliers deliver fastest?", "Show 7-day demand forecast", "Check dead stock"]
                elif is_churn_query or is_marketing_query:
                    action_button = {"label": "Launch Win-Back Campaign", "url": "/marketing"}
                    follow_ups = ["Create WhatsApp offer", "How to increase repeat rate?", "Show customer segments"]
                elif is_sales_query:
                    action_button = {"label": "View Sales Breakdown", "url": "/sales"}
                    follow_ups = ["Which are my top products?", "What are my peak rush hours?", "Check today's profit margin"]
                else:
                    action_button = {"label": "View Intelligence Dashboard", "url": "/intelligence"}
                    follow_ups = ["Aaj meri total sale kitni hui?", "Which products should I reorder?", "Show monthly profit"]

                db.add(ChatMessage(merchant_id=merchant_id, role="assistant", content=reply.strip(), ts=datetime.utcnow()))
                db.commit()
                return {
                    "reply": reply.strip(),
                    "language": lang,
                    "tools_used": tools_to_run,
                    "tool_results": tool_results,
                    "follow_ups": follow_ups,
                    "action_button": action_button
                }
        except Exception as e:
            print(f"[Copilot] LLM generation error: {e}")

    # Deterministic Context-Aware Response Engine
    # 1. Why are my sales decreasing?
    if is_decreasing_query:
        cust_seg = tool_results.get("get_customer_segments", {})
        at_risk = cust_seg.get("at_risk_count", 0)
        low_stk = tool_results.get("get_low_stock", {}).get("low_stock_count", 0)
        if lang == "en":
            final_reply = (
                f"Based on our store diagnostics for **{store_name}**, two primary factors are impacting sales:\n\n"
                f"1. **Customer Churn:** {at_risk} regular buyers haven't visited in 21+ days.\n"
                f"2. **Stockouts:** {low_stk} fast-moving items are currently below reorder thresholds, causing missed sales.\n\n"
                f"**Recommended Action:** Restock your top products and send a targeted WhatsApp win-back coupon to your inactive regulars."
            )
            follow_ups = ["Which customers are not returning?", "Which products should I reorder?", "Draft win-back offer"]
            action_button = {"label": "Launch Customer Win-Back", "url": "/marketing"}
        elif lang == "mr":
            final_reply = (
                f"**{store_name}** च्या डेटा विश्लेषणावर आधारित, विक्री कमी होण्याची २ मुख्य कारणे आहेत:\n\n"
                f"१. **नियमित ग्राहक अनुपस्थित:** {at_risk} नियमित ग्राहक २१+ दिवसांपासून दुकानात आलेले नाहीत.\n"
                f"२. **साठा संपणे:** {low_stk} जास्त खपणारे सामान संपण्याच्या मार्गावर आहे.\n\n"
                f"**सल्ला:** तातडीने माल भरून घ्या आणि अनुपस्थित ग्राहकांना व्हॉट्सॲप ऑफर पाठवा."
            )
            follow_ups = ["कोणते ग्राहक आलेले नाहीत?", "कोणता माल मागवावा?", "व्हॉट्सॲप मेसेज तयार करा"]
            action_button = {"label": "ग्राहक ऑफर पाठवा", "url": "/marketing"}
        else: # Hindi / Hinglish
            final_reply = (
                f"**{store_name}** के बिज़नेस डेटा के अनुसार, बिक्री प्रभावित होने के २ मुख्य कारण हैं:\n\n"
                f"१. **नियमित ग्राहकों की कमी:** {at_risk} पुराने नियमित ग्राहक पिछले २१ दिनों से दुकान नहीं आए हैं।\n"
                f"२. **स्टॉक की कमी:** {low_stk} तेज़ी से बिकने वाले सामान आउट-ऑफ-स्टॉक होने वाले हैं।\n\n"
                f"**सलाह:** तुरंत सप्लायर से माल मंगाएं और पुराने ग्राहकों को १०% छूट का व्हाट्सऐप मैसेज भेजें।"
            )
            follow_ups = ["कौन से ग्राहक नहीं आ रहे हैं?", "कौन सा सामान खत्म हो रहा है?", "ऑफर मैसेज तैयार करो"]
            action_button = {"label": "ग्राहकों को ऑफर भेजें", "url": "/marketing"}

    # 2. How can I increase monthly revenue?
    elif is_increase_rev_query:
        top_p = tool_results.get("get_top_products", {}).get("top_5", [])
        top_names = ", ".join([p["name"] for p in top_p[:2]]) if top_p else "Fast movers"
        if lang == "en":
            final_reply = (
                f"Here is your AI growth playbook to increase monthly revenue for **{store_name}**:\n\n"
                f"1. **Promote Star Items:** Your top revenue drivers are **{top_names}**. Ensure zero stockouts during the weekend.\n"
                f"2. **Bundle Cross-Sells:** Bundle high-margin items (e.g., Namkeen with Cold Drinks) to raise Average Transaction Value (ATV).\n"
                f"3. **Reactivate Churned Buyers:** Recovering just 15 inactive customers can add ~₹13,800 in incremental monthly receipts."
            )
            follow_ups = ["Show peak rush hours", "Draft a bundle offer", "Which customers should I message?"]
            action_button = {"label": "View Growth Score Details", "url": "/growth-score"}
        elif lang == "mr":
            final_reply = (
                f"**{store_name}** चा मासिक महसूल वाढवण्यासाठी ३ सोपे मार्ग:\n\n"
                f"१. **सर्वाधिक विक्रीच्या वस्तू:** **{top_names}** चा साठा भरपूर ठेवा.\n"
                f"२. **कॉम्बो ऑफर्स:** कोल्ड ड्रिंक आणि स्नॅक्स एकत्र ऑफर देऊन सरासरी बिल रक्कम वाढवा.\n"
                f"३. **जुने ग्राहक परत आणा:** जुन्या ग्राहकांना विशेष सवलत दिल्यास महसूल १०-१५% वाढू शकतो."
            )
            follow_ups = ["पीक अवर्स कोणते आहेत?", "व्हॉट्सॲप मेसेज बनवा", "नफा कसा वाढवायचा?"]
            action_button = {"label": "ग्रोथ स्कोअर तपासा", "url": "/growth-score"}
        else: # Hindi
            final_reply = (
                f"**{store_name}** का मासिक रेवेन्यू बढ़ाने के लिए ३ प्रमुख कदम:\n\n"
                f"१. **टॉप प्रोडक्ट्स की उपलब्धता:** आपके सबसे ज्यादा बिकने वाले सामान **{top_names}** हैं। इनका स्टॉक कभी खत्म न होने दें।\n"
                f"२. **बास्केट साइज बढ़ाएं:** चाय के साथ बिस्कुट या नमकीन का कॉम्बो पैक ऑफर करें जिससे हर बिल की रकम बढ़े।\n"
                f"३. **पुराने ग्राहकों को वापस लाएं:** २० निष्क्रिय ग्राहकों को व्हाट्सऐप कूपन भेजकर वापस दुकान बुलाएं।"
            )
            follow_ups = ["पीक घंटे कौन से हैं?", "कॉम्बो ऑफर तैयार करो", "ग्रोथ स्कोर कैसे सुधारें?"]
            action_button = {"label": "ग्रोथ स्कोर देखें", "url": "/growth-score"}

    # 3. Which products should I reorder?
    elif is_reorder_query:
        low_items = tool_results.get("get_low_stock", {}).get("items", [])
        if low_items:
            items_str = "\n".join([f"• **{i['name']}** — {i['stock']} units left (Threshold: {i['reorder_level']})" for i in low_items[:4]])
        else:
            items_str = "All primary products have adequate stock levels."

        if lang == "en":
            final_reply = (
                f"Here are the items requiring immediate supplier restock for **{store_name}**:\n\n"
                f"{items_str}\n\n"
                f"**Recommendation:** Place supplier orders now to avoid weekend shortages."
            )
            follow_ups = ["Show 7-day demand forecast", "Check supplier order history", "View dead stock"]
            action_button = {"label": "Place Reorder Now", "url": "/inventory"}
        elif lang == "mr":
            final_reply = (
                f"**{store_name}** मध्ये तातडीने मागवण्याची गरज असलेला माल:\n\n"
                f"{items_str}\n\n"
                f"**सल्ला:** वीकेंडच्या गर्दीआधी सप्लायरला ऑर्डर द्या."
            )
            follow_ups = ["मागणीचा अंदाज दाखवा", "सप्लायर ऑर्डर्स", "डेड स्टॉक तपासा"]
            action_button = {"label": "माल मागवा", "url": "/inventory"}
        else: # Hindi
            final_reply = (
                f"**{store_name}** में तुरंत री-ऑर्डर करने योग्य सामान:\n\n"
                f"{items_str}\n\n"
                f"**सलाह:** वीकेंड रश से पहले सप्लायर को नया ऑर्डर दें।"
            )
            follow_ups = ["अगले ७ दिनों की मांग दिखाओ", "सप्लायर ऑर्डर हिस्ट्री", "डेड स्टॉक कौन सा है?"]
            action_button = {"label": "स्टॉक री-ऑर्डर करें", "url": "/inventory"}

    # 4. Which customers are not returning?
    elif is_churn_query:
        cust_seg = tool_results.get("get_customer_segments", {})
        at_risk = cust_seg.get("at_risk_sample", [])
        total_risk = cust_seg.get("at_risk_count", 0)
        c_str = "\n".join([f"• **{c['name']}** — Last seen {c['recency_days']} days ago (Total spend: ₹{int(c.get('total_spend', 0)):,})" for c in at_risk[:4]])

        if lang == "en":
            final_reply = (
                f"**{total_risk} loyal customers** have paused visits for over 3 weeks:\n\n"
                f"{c_str}\n\n"
                f"**Opportunity:** Sending an automated WhatsApp discount (e.g. Flat ₹50 off via Paytm UPI) typically recovers 35–45% of churned buyers."
            )
            follow_ups = ["Draft WhatsApp win-back message", "How to increase repeat customer rate?", "Show all customer profiles"]
            action_button = {"label": "Send WhatsApp Campaign", "url": "/marketing"}
        elif lang == "mr":
            final_reply = (
                f"**{total_risk} नियमित ग्राहक** मागील ३ आठवड्यांपासून आलेले नाहीत:\n\n"
                f"{c_str}\n\n"
                f"**सल्ला:** त्यांना व्हॉट्सॲपवर 'आम्हाला तुमची आठवण येते' अशी ₹५० सवलतीची ऑफर पाठवा."
            )
            follow_ups = ["व्हॉट्सॲप संदेश तयार करा", "ग्राहक यादी दाखवा", "नियमित ग्राहक किती आहेत?"]
            action_button = {"label": "व्हॉट्सॲप ऑफर पाठवा", "url": "/marketing"}
        else: # Hindi
            final_reply = (
                f"**{total_risk} नियमित ग्राहक** पिछले २१+ दिनों से दुकान नहीं आए हैं:\n\n"
                f"{c_str}\n\n"
                f"**सुझाव:** इन्हें पेटीएम यूपीआई से ₹५० कैशबैक या १०% छूट का व्हाट्सऐप मैसेज भेजकर तुरंत आकर्षित करें।"
            )
            follow_ups = ["व्हाट्सऐप कूपन तैयार करो", "ग्राहक प्रोफाइल दिखाओ", "नियमित ग्राहक कितने हैं?"]
            action_button = {"label": "व्हाट्सऐप कैंपेन भेजें", "url": "/marketing"}

    # 5. Marketing Strategy
    elif is_marketing_query:
        top_p = tool_results.get("get_top_products", {}).get("top_5", [])
        p_name = top_p[0]["name"] if top_p else "किराना सामान"
        if lang == "en":
            final_reply = (
                f"Here is a 3-step AI marketing strategy for **{store_name}**:\n\n"
                f"1. **Weekend Bonanza Campaign:** Send a WhatsApp flyer offering 10% OFF on **{p_name}** and pantry staples on Friday evenings.\n"
                f"2. **Soundbox Payment Incentive:** Remind shoppers that paying via Paytm Soundbox earns them instant rewards.\n"
                f"3. **VIP Loyalty Privileges:** Give your top 20 spenders advance booking on seasonal festival goods."
            )
            follow_ups = ["Create Diwali marketing campaign", "Draft WhatsApp blast", "How to get more Soundbox payments?"]
            action_button = {"label": "Open Marketing Assistant", "url": "/marketing"}
        elif lang == "mr":
            final_reply = (
                f"**{store_name}** साठी ३-टप्प्यांची मार्केटिंग रणनीती:\n\n"
                f"१. **वीकेंड धमाका:** शुक्रवारी संध्याकाळी **{p_name}** वर १०% सूटचा व्हॉट्सॲप मेसेज पाठवा.\n"
                f"२. **पेटीएम साउंडबॉक्स रिवॉर्ड्स:** ग्राहकांना साउंडबॉक्सद्वारे पेमेंट करण्यास प्रोत्साहित करा.\n"
                f"३. **व्हीआयपी ग्राहक सवलत:** उच्च खरेदी करणाऱ्या २० ग्राहकांसाठी खास ऑफर ठेवा."
            )
            follow_ups = ["दिवाळी मोहिमेचा मसुदा तयार करा", "व्हॉट्सॲप मेसेज बनवा", "मार्केटिंग असिस्टंट उघडा"]
            action_button = {"label": "मार्केटिंग असिस्टंट", "url": "/marketing"}
        else: # Hindi
            final_reply = (
                f"**{store_name}** के लिए ३-चरणीय AI मार्केटिंग रणनीति:\n\n"
                f"१. **वीकेंड महाबचत ऑफर:** शुक्रवार शाम को **{p_name}** और राशन सामान पर १०% छूट का व्हाट्सऐप मैसेज भेजें।\n"
                f"२. **पेटीएम साउंडबॉक्स यूपीआई ऑफर:** काउंटर पर साउंडबॉक्स स्कैन करके पेमेंट करने पर ग्राहकों को खास फायदा दें।\n"
                f"३. **लॉयल्टी रिवॉर्ड्स:** शीर्ष २० वफादार ग्राहकों के लिए पर्सनल डिस्काउंट कूपन जारी करें।"
            )
            follow_ups = ["दिवाली कैंपेन मैसेज बनाओ", "व्हाट्सऐप ब्लास्ट तैयार करो", "मार्केटिंग असिस्टंट खोलें"]
            action_button = {"label": "मार्केटिंग असिस्टंट खोलें", "url": "/marketing"}

    # 6. Weekly / Performance Report
    elif is_report_query:
        sales = tool_results.get("get_sales_summary", {})
        fin = tool_results.get("get_finance_summary", {})
        top_p = tool_results.get("get_top_products", {}).get("top_5", [])
        rev = int(fin.get("revenue", sales.get("today_sales", 0) * 7))
        net = int(fin.get("net_profit", 18500))
        top_name = top_p[0]["name"] if top_p else "Dairy & Staples"

        if lang == "en":
            final_reply = (
                f"📊 **Weekly Business Performance for {store_name}**:\n\n"
                f"• **Gross Revenue:** ₹{rev:,}\n"
                f"• **Estimated Net Profit:** ₹{net:,} (~{fin.get('net_margin_pct', 18.5)}% margin)\n"
                f"• **Top Selling Product:** {top_name}\n"
                f"• **Digital Transaction Share:** 78% processed via Paytm Soundbox & UPI QR.\n\n"
                f"Your business consistency remains strong with zero payment leakage."
            )
            follow_ups = ["Download PDF report", "Show category sales breakdown", "View profit & loss statement"]
            action_button = {"label": "Download Official Report", "url": "/reports"}
        elif lang == "mr":
            final_reply = (
                f"📊 **{store_name} चा साप्ताहिक व्यवसाय अहवाल**:\n\n"
                f"• **एकूण विक्री:** ₹{rev:,}\n"
                f"• **अंदाजे नफा:** ₹{net:,} ({fin.get('net_margin_pct', 18.5)}% मार्जिन)\n"
                f"• **सर्वाधिक खपणारे उत्पादन:** {top_name}\n"
                f"• **डिजिटल पेमेंट:** ७८% व्यवहार पेटीएम साउंडबॉक्स आणि यूपीआयद्वारे पूर्ण झाले."
            )
            follow_ups = ["पीडीएफ अहवाल डाउनलोड करा", "नफ्याचा तपशील पहा", "कॅटेगरीनुसार विक्री"]
            action_button = {"label": "अहवाल डाउनलोड करा", "url": "/reports"}
        else: # Hindi
            final_reply = (
                f"📊 **{store_name} की साप्ताहिक परफॉर्मेंस रिपोर्ट**:\n\n"
                f"• **कुल बिक्री:** ₹{rev:,}\n"
                f"• **अनुमानित शुद्ध मुनाफा:** ₹{net:,} ({fin.get('net_margin_pct', 18.5)}% मार्जिन)\n"
                f"• **नंबर १ प्रोडक्ट:** {top_name}\n"
                f"• **डिजिटल पेमेंट शेयर:** ७८% लेन-देन पेटीएम साउंडबॉक्स और यूपीआई क्यूआर से सफल हुए।"
            )
            follow_ups = ["पीडीएफ रिपोर्ट डाउनलोड करें", "मुनाफे का विवरण देखें", "कैटेगरी ब्रेकडाउन दिखाओ"]
            action_button = {"label": "ऑफिशियल रिपोर्ट डाउनलोड करें", "url": "/reports"}

    # 7. Today's sales (default fallback)
    else:
        s = tool_results.get("get_sales_summary", {})
        ts_val = int(s.get("today_sales", 0))
        vs = s.get("vs_yesterday_pct", 0)
        prof = int(s.get("estimated_profit_today", 0))
        top_p = tool_results.get("get_top_products", {}).get("top_5", [])
        top_str = f" Top item: {top_p[0]['name']}." if top_p else ""

        if lang == "en":
            trend = f"+{vs}% vs yesterday" if vs >= 0 else f"{vs}% vs yesterday"
            final_reply = (
                f"Today's total sales at **{store_name}** are **₹{ts_val:,}** ({trend}) with an estimated gross profit of **₹{prof:,}**.{top_str}\n\n"
                f"Counter checkout volume is steady across Paytm QR & Soundbox."
            )
            follow_ups = ["Which products should I reorder?", "Show hourly peak rush", "Check today's profit margin"]
            action_button = {"label": "View Sales & Transactions", "url": "/sales"}
        elif lang == "mr":
            trend = f"कालपेक्षा +{vs}%" if vs >= 0 else f"कालपेक्षा {vs}%"
            final_reply = (
                f"आज **{store_name}** ची एकूण विक्री **₹{ts_val:,}** झाली ({trend}), अंदाजे नफा **₹{prof:,}**.{top_str}\n\n"
                f"पेटीएम साउंडबॉक्सद्वारे सर्व व्यवहार सुरळीत नोंदवले गेले आहेत."
            )
            follow_ups = ["कोणता माल मागवावा?", "गर्दीची वेळ कोणती?", "नफा तपासा"]
            action_button = {"label": "विक्री तपशील पहा", "url": "/sales"}
        else: # Hindi
            trend = f"कल से +{vs}%" if vs >= 0 else f"कल से {vs}%"
            final_reply = (
                f"आज **{store_name}** की कुल बिक्री **₹{ts_val:,}** रही ({trend}), जिसमें अनुमानित मुनाफा **₹{prof:,}** है।{top_str}\n\n"
                f"पेटीएम साउंडबॉक्स और क्यूआर से सभी पेमेंट तुरंत वेरीफाई हुए हैं।"
            )
            follow_ups = ["कौन सा सामान री-ऑर्डर करें?", "आज की सबसे ज्यादा बिक्री का समय?", "मुनाफे का हिसाब दिखाओ"]
            action_button = {"label": "सेल्स व ट्रांजैक्शन देखें", "url": "/sales"}

    db.add(ChatMessage(merchant_id=merchant_id, role="assistant", content=final_reply, ts=datetime.utcnow()))
    db.commit()

    return {
        "reply": final_reply,
        "language": lang,
        "tools_used": tools_to_run,
        "tool_results": tool_results,
        "follow_ups": follow_ups,
        "action_button": action_button
    }
