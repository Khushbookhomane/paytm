from typing import List, Optional
from .llm import llm_service
from ..schemas import MarketingVariant


def _get_templates(store_name: str) -> dict:
    """Build offline templates dynamically using the actual merchant store name."""
    return {
        "hi": {
            "win_back": [
                f"नमस्ते जी! 🙏 {store_name} पर आपकी कमी खल रही है। आपके लिए खास 10% की विशेष छूट! आज ही पधारें।",
                f"नमस्ते! 🌟 बहुत दिन हुए आपसे मिले। {store_name} से ₹500 की खरीदारी पर पाइए ₹50 की सीधी छूट!",
                f"प्रिय ग्राहक! 🙏 {store_name} में नया ताजा स्टॉक आ चुका है। आज ही आएं और 10% स्पेशल डिस्काउंट पाएं!",
            ],
            "weekend_special": [
                f"वीकेंड का मज़ा अब दोगुना! 🎉 {store_name} पर कोल्ड ड्रिंक्स और स्नैक्स पर 15% छूट! आज ही पधारें।",
                f"सुपर संडे ऑफर! 🥤🍟 {store_name} पर कोल्ड ड्रिंक्स और नमकीन कॉम्बो पर ₹40 की छूट। जल्दी आएं!",
                f"शानदार वीकेंड बचत! 🌟 {store_name} पर स्नैक्स और बिस्कुट पर भारी छूट। स्टॉक सीमित है!",
            ],
            "clear_stock": [
                f"स्टॉक क्लीयरेंस महासेल! 💥 {store_name} पर चुनिंदा किराना पर 20% तक की छूट। सीमित समय!",
                f"बचत ही बचत! 🏷️ {store_name} में विशेष क्लीयरेंस सेल। आज ही आएं और भारी छूट पाएं!",
                f"धमाका ऑफर! 🛒 {store_name} पर दैनिक सामान पर विशेष छूट। अभी पधारें और बचत करें!",
            ],
            "festive": [
                f"त्योहारों की शुभकामनाएं! 🪔 {store_name} पर त्योहारी खरीदारी पर 10% छूट और उपहार पाएं।",
                f"उत्सव की खुशियां! 🎁 {store_name} में घी, तेल, चाय और चीनी पर विशेष उत्सव डिस्काउंट।",
                f"त्योहारी महाबचत! ✨ {store_name} से पूरी त्योहारी खरीदारी करें और सुनिश्चित उपहार पाएं!",
            ],
            "new_product": [
                f"खुशखबरी! 🛍️ {store_name} पर नया फ्रेश स्टॉक पहुंच चुका है। आज ही आएं!",
                f"नया आगमन! ✨ {store_name} में प्रीमियम चाय, बिस्कुट और दैनिक सामान की नई खेप उपलब्ध।",
                f"ताजा स्टॉक तैयार है! 📦 {store_name} में शुद्ध आटा, तेल और दालों की नई वेरायटी आ चुकी है।",
            ],
        },
        "en": {
            "win_back": [
                f"Namaste! 🙏 We missed you at {store_name}. Enjoy an exclusive 10% discount on your next visit!",
                f"Special offer! 🌟 Shop ₹500+ at {store_name} and get ₹50 flat off. Visit us today!",
                f"Dear customer! 🙏 Fresh stock has arrived at {store_name}. Visit today for a 10% welcome-back offer!",
            ],
            "weekend_special": [
                f"Weekend Special! 🎉 Get 15% off on cold drinks & snacks at {store_name} today!",
                f"Weekend Combo! 🥤🍟 Buy cold drinks and chips at {store_name} and save ₹40!",
                f"Weekend Delight! 🌟 Grab beverages and biscuits at special prices at {store_name}. Limited stock!",
            ],
            "clear_stock": [
                f"Flash Sale! 💥 Up to 20% off on selected daily staples at {store_name}. Today only!",
                f"Clearance Savings! 🏷️ High-quality kirana items at special rates at {store_name}. Visit now!",
                f"Super Offer! 🛒 Special price cuts on grocery staples at {store_name}. Visit before stock ends!",
            ],
            "festive": [
                f"Festive Greetings! 🪔 Celebrate with {store_name}. Enjoy 10% off on festive groceries!",
                f"Festive Happiness! 🎁 Special discounts on Ghee, Sugar, Tea & Sweets at {store_name} this week.",
                f"Celebrate & Save! ✨ Complete your festive grocery list at {store_name} and get guaranteed gifts!",
            ],
            "new_product": [
                f"Fresh Arrivals! 🛍️ New stock of premium tea, dals & snacks now available at {store_name}.",
                f"New in store! ✨ Premium quality staples and daily essentials just arrived at {store_name}.",
                f"Restocked! 📦 Check out the freshest dairy and grocery inventory at {store_name}.",
            ],
        },
        "mr": {
            "win_back": [
                f"नमस्कार! 🙏 {store_name}मध्ये तुमची आठवण येत आहे. खास १०% सूट! आजच भेट द्या.",
                f"खास ऑफर! 🌟 {store_name}मध्ये ₹५०० च्या खरेदीवर ₹५० ची थेट सूट! आजच नक्की या.",
                f"प्रिय ग्राहक! 🙏 {store_name}मध्ये नवीन ताजा माल आला आहे. आजच भेट द्या आणि खास ऑफर मिळवा!",
            ],
            "weekend_special": [
                f"वीकेंड धमाका! 🎉 {store_name}मध्ये कोल्ड ड्रिंक्स व स्नॅक्सवर १५% खास सूट. आजच या!",
                f"रविवार स्पेशल! 🥤🍟 {store_name}मध्ये कोल्ड ड्रिंक्स व चिप्स कॉम्बोवर ₹४० ची सूट.",
                f"वीकेंड आनंद! 🌟 {store_name}मध्ये शीतपेये व बिस्किटांवर आकर्षक सवलत. आजच खरेदी करा!",
            ],
            "clear_stock": [
                f"महासेल! 💥 {store_name}मध्ये निवडक किराणावर २०% पर्यंत सूट. मर्यादित वेळ!",
                f"बचतीची संधी! 🏷️ {store_name}मध्ये विशेष क्लिअरन्स सवलत. आजच भेट द्या!",
                f"धमाका सेल! 🛒 {store_name}मध्ये दैनंदिन वस्तूंवर विशेष सूट. मर्यादित साठा!",
            ],
            "festive": [
                f"सणाच्या शुभेच्छा! 🪔 {store_name}कडून उत्सवाच्या खरेदीवर १०% सूट व भेटवस्तू!",
                f"उत्सवाचा आनंद! 🎁 {store_name}मध्ये तूप, साखर, चहा व तेलावर विशेष सवलत.",
                f"सणानिमित्त बचत! ✨ {store_name}मधून संपूर्ण सणाची खरेदी करा आणि आकर्षक भेट मिळवा!",
            ],
            "new_product": [
                f"आनंदाची बातमी! 🛍️ {store_name}मध्ये नवीन ताजा साठा दाखल झाला आहे. आजच या.",
                f"नवीन आगमन! ✨ {store_name}मध्ये उत्कृष्ट दर्जाचा चहा, बिस्किटे व किराणा माल उपलब्ध.",
                f"ताजा साठा! 📦 {store_name}मध्ये शुद्ध डाळी, तेल व गव्हाचे पीठ उपलब्ध.",
            ],
        },
    }


def generate_marketing_messages(
    segment: str,
    goal: str = "win_back",
    language: str = "hi",
    product: Optional[str] = None,
    discount_pct: Optional[int] = 10,
    merchant_name: str = "हमारी दुकान",
) -> List[MarketingVariant]:
    """Generate 3 WhatsApp/SMS message variations using actual merchant store name."""
    lang = language.lower()
    if lang not in ("hi", "en", "mr"):
        lang = "hi"

    goal_key = goal.lower()
    if goal_key not in ("win_back", "weekend_special", "clear_stock", "festive", "new_product"):
        goal_key = "win_back"

    # Online LLM — use actual merchant name
    if llm_service.is_online():
        prompt = f"""Generate 3 distinct WhatsApp/SMS marketing messages for an Indian kirana store named '{merchant_name}'.
Target segment: {segment}
Campaign goal: {goal_key}
Product focus: {product or 'Grocery staples & snacks'}
Discount: {discount_pct}%
Language: {lang} (Hindi/Marathi in Devanagari, English in Latin).

Rules:
1. Each message MUST be under 280 characters.
2. Use 1-2 relevant emojis per message.
3. Sound warm and hyper-local. Use the store name '{merchant_name}' naturally.
4. Return ONLY the 3 messages numbered 1, 2, 3 — no preamble or markdown.
"""
        try:
            resp_text = llm_service.generate_text(prompt, max_tokens=350)
            lines = [l.strip() for l in resp_text.split("\n") if l.strip()]
            candidates = []
            for line in lines:
                clean = line[2:].strip() if (line[0].isdigit() and len(line) > 2 and line[1] in (".", ")", ":", " ")) else line
                if clean and len(clean) < 320:
                    candidates.append(clean)
            if len(candidates) >= 3:
                return [
                    MarketingVariant(id=i + 1, text=candidates[i][:299], character_count=len(candidates[i][:299]), suggested_channel="whatsapp")
                    for i in range(3)
                ]
        except Exception as e:
            print(f"[Marketing] LLM failed, using templates: {e}")

    # Offline fallback with dynamic store name
    templates = _get_templates(merchant_name)
    lang_tpl = templates.get(lang, templates["hi"])
    goal_tpl = lang_tpl.get(goal_key, lang_tpl["win_back"])

    variants = []
    for i, tpl in enumerate(goal_tpl[:3]):
        text = tpl
        if product and product.lower() not in text.lower():
            if lang == "hi":
                text = f"{tpl.rstrip('।').rstrip('!')} · {product} पर विशेष छूट!"
            elif lang == "mr":
                text = f"{tpl.rstrip('!')} · {product} वर विशेष सवलत!"
            else:
                text = f"{tpl.rstrip('!')} · Special deal on {product}!"
        variants.append(MarketingVariant(id=i + 1, text=text[:299], character_count=len(text[:299]), suggested_channel="whatsapp"))

    return variants
