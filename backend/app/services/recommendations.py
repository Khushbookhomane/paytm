from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models import Product, Transaction, TransactionItem, Customer, Expense
from .forecasting import generate_inventory_forecast
from .customers import get_customer_segments
from .analytics import get_sales_analytics
from .llm import llm_service

def generate_recommendations(db: Session, merchant_id: int, language: str = "hi") -> List[Dict[str, Any]]:
    """
    Deterministic rule-based recommendation engine.
    Finds exact business anomalies and opportunities, strictly verified with computed store numbers.
    """
    lang = language.lower() if language else "hi"
    if lang not in ("hi", "en", "mr"):
        lang = "hi"

    cards = []

    # Rule 1: Low stock on fast-selling products
    forecasts = generate_inventory_forecast(db, merchant_id, forecast_days=7)
    urgent_items = [f for f in forecasts if f["urgency"] == "urgent" and f["current_stock"] <= 5]
    if urgent_items:
        top_urgent = urgent_items[0]
        # Numbers
        stock = top_urgent["current_stock"]
        pred_7d = top_urgent["predicted_demand_7d"]
        reorder_qty = top_urgent["suggested_reorder_qty"]
        prod_name = top_urgent["product_name"]

        if lang == "en":
            title = f"Critical Stock Alert: {prod_name}"
            why = f"Only {stock} units left in stock while 7-day predicted demand is {pred_7d} units. You risk running out of stock within 48 hours."
            action = f"Place reorder for +{reorder_qty} units with supplier immediately."
            btn_text = "Restock Now"
        elif lang == "mr":
            title = f"साठा इशारा: {prod_name}"
            why = f"दुकानात फक्त {stock} शिल्लक आहेत, तर ७ दिवसांची मागणी {pred_7d} इतकी अपेक्षित आहे. माल संपण्याचा धोका आहे."
            action = f"सप्लायरकडून +{reorder_qty} चा नवीन साठा मागवून घ्या."
            btn_text = "माल मागवा"
        else: # Hindi
            title = f"स्टॉक अलर्ट: {prod_name} खत्म होने वाला है"
            why = f"दुकान में केवल {stock} यूनिट बची हैं जबकि अगले 7 दिनों में {pred_7d} यूनिट की मांग अनुमानित है। 48 घंटे में स्टॉक खत्म हो सकता है।"
            action = f"सप्लायर को तुरंत +{reorder_qty} यूनिट का ऑर्डर भेजें।"
            btn_text = "तुरंत स्टॉक मंगाएं"

        cards.append({
            "id": 1,
            "title": title,
            "why": why,
            "numbers": {"current_stock": stock, "predicted_demand_7d": pred_7d, "suggested_reorder": reorder_qty},
            "suggested_action": action,
            "button_target": "/inventory",
            "button_text": btn_text,
            "type": "low_stock",
            "status": "active",
        })

    # Rule 2: Upcoming Weekend Demand Spike on Cold Drinks & Snacks
    category_map = {p.id: p.category for p in db.query(Product).filter(Product.merchant_id == merchant_id).all()}
    drink_snack_spikes = [
        f for f in forecasts
        if f["weekend_spike_flag"] and category_map.get(f["product_id"]) in ("Cold Drinks", "Snacks")
    ]
    if drink_snack_spikes:
        spike_item = max(drink_snack_spikes, key=lambda x: x["weekend_uplift_pct"])
    else:
        weekend_spikes = [f for f in forecasts if f["weekend_spike_flag"]]
        spike_item = weekend_spikes[0] if weekend_spikes else None

    if spike_item:
        uplift = spike_item["weekend_uplift_pct"]
        item_name = spike_item["product_name"]

        if lang == "en":
            title = f"Weekend Rush Prep: +{uplift}% Demand Surge"
            why = f"Sales of {item_name} and snacks surge by {uplift}% on Saturday and Sunday. Prepare inventory and bundle offers now."
            action = "Launch weekend WhatsApp snack combo promotion."
            btn_text = "Launch Weekend Offer"
        elif lang == "mr":
            title = f"वीकेंड गर्दी: विक्रीत +{uplift}% वाढीची शक्यता"
            why = f"शनिवार आणि रविवारी {item_name} व स्नॅक्सची विक्री {uplift}% ने वाढते. पुरेसा साठा ठेवा."
            action = "ग्राहकांना वीकेंड कॉम्बो ऑफर पाठवा."
            btn_text = "वीकेंड ऑफर पाठवा"
        else: # Hindi
            title = f"वीकेंड की तैयारी: +{uplift}% मांग में बढ़ोतरी"
            why = f"शनिवार और रविवार को {item_name} व स्नैक्स की बिक्री में {uplift}% की भारी उछाल आती है। समय रहते स्टॉक तैयार रखें।"
            action = "कोल्ड ड्रिंक्स और स्नैक्स का वीकेंड व्हाट्सएप ऑफर भेजें।"
            btn_text = "वीकेंड ऑफर बनाएं"

        cards.append({
            "id": 2,
            "title": title,
            "why": why,
            "numbers": {"weekend_uplift_pct": uplift, "product": item_name},
            "suggested_action": action,
            "button_target": "/marketing?goal=weekend_special",
            "button_text": btn_text,
            "type": "weekend_spike",
            "status": "active",
        })

    # Rule 3: Win-back offer for at-risk churned customers
    seg_data = get_customer_segments(db, merchant_id)
    at_risk_list = [c for c in seg_data["customers"] if c["segment"] == "At-risk"]
    if len(at_risk_list) >= 5:
        count_churn = len(at_risk_list)
        total_lost_val = sum(c["total_spend"] for c in at_risk_list)

        if lang == "en":
            title = f"Win Back {count_churn} Churned Regulars"
            why = f"{count_churn} previously loyal customers have not visited for 21+ days. They represent ₹{int(total_lost_val):,} in past store revenue."
            action = "Send a personalized 10% welcome-back WhatsApp discount voucher."
            btn_text = "Send Win-Back Offer"
        elif lang == "mr":
            title = f"{count_churn} जुन्या ग्राहकांना परत मिळवा"
            why = f"{count_churn} नियमित ग्राहकांनी गेल्या २१ दिवसांपासून भेट दिलेली नाही. त्यांची पूर्वीची एकूण खरेदी ₹{int(total_lost_val):,} होती."
            action = "१०% सवलतीचा व्हॉट्सॲप कूपन मेसेज पाठवून त्यांना पुन्हा बोलवा."
            btn_text = "ऑफर पाठवा"
        else: # Hindi
            title = f"{count_churn} पक्के ग्राहकों को वापस लाएं"
            why = f"पिछले 21 दिनों से {count_churn} नियमित ग्राहक दुकान पर नहीं आए हैं। इन्होंने पहले ₹{int(total_lost_val):,} की खरीदारी की थी।"
            action = "10% छूट का विशेष स्वागत व्हाट्सएप ऑफर भेजकर उन्हें पुनः आकर्षित करें।"
            btn_text = "ऑफर भेजें"

        cards.append({
            "id": 3,
            "title": title,
            "why": why,
            "numbers": {"churn_count": count_churn, "past_revenue": int(total_lost_val)},
            "suggested_action": action,
            "button_target": "/marketing?segment=At-risk&goal=win_back",
            "button_text": btn_text,
            "type": "churn_winback",
            "status": "active",
        })

    # Rule 4: Profit Margin Optimization & Operating Cost check
    sales_info = get_sales_analytics(db, merchant_id, time_range="week")
    total_w_sales = sales_info["total_sales"]

    # Compute dynamic weekly COGS and gross profit margin
    anchor_tx = db.query(Transaction.ts).filter(
        Transaction.merchant_id == merchant_id
    ).order_by(Transaction.ts.desc()).first()
    anchor_date = anchor_tx[0].date() if anchor_tx else datetime.utcnow().date()
    start_date = anchor_date - timedelta(days=6)

    weekly_items = db.query(
        TransactionItem.qty,
        Product.cost_price
    ).join(
        Product, TransactionItem.product_id == Product.id
    ).join(
        Transaction, TransactionItem.transaction_id == Transaction.id
    ).filter(
        Transaction.merchant_id == merchant_id,
        func.date(Transaction.ts) >= str(start_date),
        func.date(Transaction.ts) <= str(anchor_date)
    ).all()
    weekly_cogs = sum(qty * cost_price for qty, cost_price in weekly_items)
    gross_profit = total_w_sales - weekly_cogs
    margin_pct = round((gross_profit / total_w_sales * 100), 1) if total_w_sales > 0 else 25.0

    if lang == "en":
        title = f"Healthy Margin: {margin_pct}% Gross"
        why = f"Last 7 days total receipts reached ₹{int(total_w_sales):,} with a healthy {margin_pct}% gross profit margin. Staples maintain steady cash flow."
        action = "Review weekly profit breakdown and operating overhead."
        btn_text = "View Finance Report"
    elif lang == "mr":
        title = f"चांगला नफा मार्जिन: {margin_pct}% स्थूल नफा"
        why = f"गेल्या ७ दिवसांत एकूण ₹{int(total_w_sales):,} ची कमाई झाली असून {margin_pct}% स्थूल नफा मिळाला आहे. नकद प्रवाह स्थिर आहे."
        action = "नफा-तोटा अहवाल तपासा."
        btn_text = "अहवाल पहा"
    else: # Hindi
        title = f"मजबूत मुनाफा: {margin_pct}% ग्रॉस मार्जिन"
        why = f"पिछले 7 दिनों में कुल ₹{int(total_w_sales):,} की बिक्री हुई और {margin_pct}% ग्रॉस मार्जिन बना। डेयरी और दैनिक किराना से अच्छा कैश फ्लो है।"
        action = "दुकान के आय-व्यय और शुद्ध बचत का पूरा विवरण देखें।"
        btn_text = "मुनाफा रिपोर्ट देखें"

    cards.append({
        "id": 4,
        "title": title,
        "why": why,
        "numbers": {"week_sales": int(total_w_sales), "margin_pct": margin_pct},
        "suggested_action": action,
        "button_target": "/finance",
        "button_text": btn_text,
        "type": "margin_drop",
        "status": "active",
    })

    # Rule 5: Reorder Second Fast-Seller (Amul Gold Milk or Bread)
    if len(urgent_items) > 1:
        second_urgent = urgent_items[1]
        p_name = second_urgent["product_name"]
        st = second_urgent["current_stock"]
        re_qty = second_urgent["suggested_reorder_qty"]

        if lang == "en":
            title = f"Daily Staple Alert: {p_name}"
            why = f"Stock level is down to {st} units. Morning customer footfall requires at least {re_qty} units buffer."
            action = f"Add {p_name} (+{re_qty}) to your distributor order."
            btn_text = "Order Staple"
        elif lang == "mr":
            title = f"दैनंदिन गरज: {p_name} साठा कमी"
            why = f"शिल्लक साठा फक्त {st} उरला आहे. सकाळच्या ग्राहकांसाठी किमान {re_qty} युनिट्स आवश्यक आहेत."
            action = f"सकाळच्या डिलिव्हरीसाठी {p_name} चा ऑर्डर नोंदवा."
            btn_text = "साठा वाढवा"
        else: # Hindi
            title = f"दैनिक सामान चेतावनी: {p_name}"
            why = f"स्टॉक सिर्फ {st} यूनिट बचा है। सुबह के नियमित ग्राहकों के लिए कम से कम {re_qty} यूनिट की जरूरत है।"
            action = f"सुबह की डिलीवरी के लिए सप्लायर को {p_name} की पर्ची भेजें।"
            btn_text = "ऑर्डर लिस्ट में जोड़ें"

        cards.append({
            "id": 5,
            "title": title,
            "why": why,
            "numbers": {"current_stock": st, "reorder_qty": re_qty},
            "suggested_action": action,
            "button_target": "/inventory",
            "button_text": btn_text,
            "type": "falling_sales",
            "status": "active",
        })

    return cards
