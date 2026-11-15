# Paytm VentureAI - 3-Minute Hackathon Demo Script

> **Judge Pitch Angle**: "India has 12+ million Kirana stores using Paytm Soundbox and QR codes daily. But small merchants don't need raw CSVs or complex accounting charts—they need plain-language, actionable answers in their mother tongue. Paytm VentureAI turns everyday payment flows into immediate profit-protecting actions."

---

## Pre-Demo Prep (10 Seconds)
1. In terminal:
   ```bash
   python backend/scripts/reset_demo.py
   python backend/scripts/demo_check.py
   ```
   *(Confirms 100% test pass and fresh relative date baseline ending today).*
2. Open Browser in mobile device mode (**iPhone 12/13/14 390px** or on a real phone via local network).
3. Navigate to: `http://localhost:3000`

---

## 3-Minute Live Demo Flow

### Act 1: The Kirana Store Reality (0:00 - 0:45)
- **Action**: Log in with `demo@venture.ai` / `demo123`.
- **Showcase**: Dashboard Home (`/home`).
- **Talking Points**:
  - *"Meet Sharma Ji, running a 40-item kirana store in Mumbai with 150 local shoppers."*
  - Point to **Today's Sales**: **₹4,998** *(computed from 42 transactions today, down -0.2% vs yesterday, ₹919 estimated profit)*.
  - Point to **Payment Split**: **74.7% UPI via Paytm QR**, steady cash & card.
  - Notice the **5 Actionable Recommendation Cards**:
    1. **Critical Stock Alert**: Amul Gold Milk (only 3 packets left, 71.9 units needed over 7 days).
    2. **Weekend Demand Surge**: Sprite & Snacks surge by **+95.6%** on Saturday/Sunday.
    3. **Win-Back Offer**: 20 churned regulars represent ₹75,817 in past revenue.

---

### Act 2: Machine Learning Inventory & Pro Plan Gating (0:45 - 1:30)
- **Action**: Tap **Stock** (`/inventory`).
- **Showcase**:
  - Show the 5 low-stock alert products (Amul Milk, Thums Up, Parle-G, Tata Tea, Surf Excel).
  - Tap on **Amul Gold Milk 500ml**:
    - Notice the **Pro Gate Card**: *"7-Day AI Demand Forecasting (Prophet & Moving Average)"*.
    - Tap **"Upgrade to Pro (Instant Demo)"** button.
    - Instantly unlocks the interactive 7-day forecast graph showing daily demand and upper/lower bounds!
  - Tap **"Reorder 70 Units"** -> Instant confirmation feedback.

---

### Act 3: Customer Churn & Vernacular WhatsApp Marketing (1:30 - 2:15)
- **Action**: Tap **Customers** (`/customers`).
- **Showcase**:
  - Show **Customer RFM Segmentation**: 68 Regulars, 62 Occasional, and **20 At-risk Churned Shoppers**.
  - All phone numbers masked for merchant privacy (`98XXXXXX21`).
  - Tap **"Send Offer"** on the At-risk segment.
- **Showcase**: Direct deep-link opens **Marketing Campaign Studio** (`/marketing?segment=At-risk&goal=win_back`):
  - 3 AI variants generated under 300 characters in **Hindi**, **Marathi**, or **English**.
  - Tap **"Share on WhatsApp"** -> Opens genuine `wa.me/?text=...` prefilled with URL-encoded Hindi copy:
    > *"नमस्ते! शर्मा जनरल स्टोर से आपके लिए खास 10% छूट का कूपन। आइए और इस हफ्ते अपनी पसंदीदा ग्रोसरी पर बचत पाएं।"*

---

### Act 4: Voice-Powered AI Copilot & Finance (2:15 - 3:00)
- **Action**: Tap **Copilot** (`/copilot`).
- **Showcase**: Ask the Copilot live questions (via mic or quick-chips):
  1. *"आज की बिक्री कितनी हुई?"*  
     -> **Instant Devanagari answer**: *"आज आपकी दुकान की कुल बिक्री ₹4,998 रही है (कल से -0.2% कम), जिससे अनुमानित मुनाफा ₹919 बना है।"*
  2. *"What should I restock?"*  
     -> **Strict tool output**: *"You have 5 items running low on stock (including Amul Gold Milk 500ml, Thums Up 750ml). Recommended to restock before weekend rush."*
  3. *"इस हफ्ते मेरा profit कितना हुआ?"*  
     -> **Exact code-computed net profit**: *"इस हफ्ते का आपका शुद्ध मुनाफा ₹2,643 रहा है, और मार्जिन 8.5% का मजबूत बना हुआ है।"*
- **Action**: Switch language to **Marathi (मराठी)** in header and tap **Finance** (`/finance`):
  - Tap **"Explain in simple words"** -> Tap **"Read Aloud"** to demonstrate Web Speech API voice synthesis in Marathi/Hindi.
  - Conclude: *"Zero hallucinated figures. Everything computed from live database queries. Runs 100% offline or with Claude/Sarvam API."*

---

## Emergency Demo FAQ for Judges

| Question | Answer |
|---|---|
| **What happens if WiFi drops?** | The app runs 100% offline on SQLite + FastAPI + Next.js with deterministic template generation. No internet or LLM key required. |
| **How are the numbers calculated?** | Strict separation: All arithmetic (COGS, revenue, RFM clustering, Prophet/Moving Average) is executed by Python/SQL. The LLM only formats or translates verified numbers. |
| **Why is customer phone masked?** | DPDP Act (India's Digital Personal Data Protection) compliance. Full numbers are never exposed in UI or API payloads. |
| **Can we upload custom data?** | Yes, via Settings -> Upload CSV or `/api/upload/csv`. Sample files provided in `backend/sample_data/`. |
