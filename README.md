# Paytm VentureAI

> **Next-Generation AI Business Partner & Copilot for Indian Merchants**  
> Complete merchant registration, passwordless authentication, business verification (KYB), bank account ownership verification, Account Aggregator (AA) integration, bank statement imports, and Paytm merchant adapter architecture.

---

## 1. Overview & Architecture

Paytm VentureAI empowers kirana and retail merchants to monitor real-time sales, manage stock, forecast 7-day demand, understand customer behaviour through RFM segmentation, launch multilingual WhatsApp marketing campaigns, analyse finances, and receive actionable business advice via an intelligent AI Copilot.

### Core Architectural Pillars

1. **Passwordless Authentication (Zero SMS OTP Dependency)**:
   - **Google OAuth 2.0 / OpenID Connect**: Server-side token validation, audience & signature verification, stable subject identifier linking, and prevention of duplicate accounts.
   - **Email Magic Links**: Cryptographically secure 32-byte tokens, stored strictly as SHA-256 hashes, single-use enforcement, 10-minute validity, resend cooldown, anti-enumeration generic responses, and configurable email provider (`console`, `ses`, `resend`).
   - **WebAuthn / FIDO2 Passkeys**: Fast biometric sign-in using Windows Hello, Touch ID, Apple Face ID, or hardware security keys with challenge-response verification and replay protection.
   - **No Mobile SMS OTP**: Eliminates SMS delivery failures, SIM-swap attacks, and telecom carrier dependencies.

2. **Merchant Business Onboarding Wizard**:
   - Step 1: Business Profile Information (Legal Name, Trading Name, Category, Address, City, State, PIN).
   - Step 2: Business Identity Verification (KYB: 15-char GSTIN, 10-char PAN, 21-char CIN format validation, document verification, and compliance review).
   - Step 3: Bank Account Ownership Verification (Cashfree Penny Drop sandbox, masked account numbers `••••1234`, IFSC routing).
   - Step 4: Account Aggregator Financial Consent (Setu / Finvu adapter, user-controlled scope and duration, instant revocation).
   - Step 5: Bank Statement Upload (CSV and PDF parser fallback with narration categorization and normalization).
   - Step 6: Paytm Merchant Integration (Partner credentials connection, webhook setup, and sync).
   - Step 7: Preferences & Regional Language (English, Hindi, Marathi, notifications, and passkey registration).
   - Step 8: Dashboard Activation (`POST /api/onboarding/complete`).

3. **Bank Account Verification & Deterministic Name Matching**:
   - Integration with **Cashfree Verification API** (Sandbox & Production).
   - Name matching engine comparing declared entity/proprietor names against bank returned account holder names using token containment and Levenshtein fuzzy distance.
   - Strict status workflow: `VERIFIED`, `REQUIRES_REVIEW`, `PENDING`, `FAILED`. Name mismatches are **never** auto-approved.
   - Webhook HMAC-SHA256 signature verification.

4. **Account Aggregator & Regulatory Isolation**:
   - Clean modular adapter architecture supporting **Setu** and **Finvu** AA providers.
   - **Strict RBI Regulatory Guard (`FIUComplianceGuard`)**: In compliance with Reserve Bank of India directions, live financial data queries remain disabled pending confirmed FIU partner licensing. Transparent sandbox messaging informs merchants while manual bank statement upload serves as an active fallback.

5. **Official Modular Paytm Merchant Adapter**:
   - Located in `backend/app/adapters/paytm/`:
     - `base.py`: Abstract adapter interface and data transfer objects.
     - `authentication.py`: Partner token caching and credential validation.
     - `merchant_adapter.py`: Production and sandbox merchant adapter implementation.
     - `data_sync.py`: Transaction polling and date-range settlement synchronization.
     - `webhooks.py`: Webhook signature validation and transaction event ingestion.

6. **Multi-Tenant Organization & Access Control**:
   - Role-Based Access Control: `OWNER`, `ADMIN`, `ACCOUNTANT`, `STAFF`, `READ_ONLY`.
   - Complete tenant isolation across transactions, products, customer data, and bank records.
   - Comprehensive audit logging (`audit_events` table) recording timestamp, user ID, organization ID, and IP address for all compliance events.

---

## 2. Directory Structure

```
Paytm-VentureAi/
├── backend/
│   ├── alembic/                      # Database migrations
│   ├── app/
│   │   ├── adapters/
│   │   │   ├── account_aggregator/   # Setu, Finvu & FIUComplianceGuard
│   │   │   ├── paytm/                # Modular Paytm Merchant adapter
│   │   │   ├── bank_verification.py  # Cashfree penny drop & name matching
│   │   │   ├── kyb.py                # GSTIN, PAN, CIN verification
│   │   │   ├── csv_upload.py         # CSV store sales ingestion
│   │   │   └── seeded_demo.py        # Seeded 90-day retail data generator
│   │   ├── routers/
│   │   │   ├── auth.py               # Magic links, Google OIDC, Passkeys
│   │   │   ├── organizations.py      # Org CRUD, onboarding flow, team roles
│   │   │   ├── business_verification.py # KYB endpoints & review
│   │   │   ├── bank_verification.py  # Cashfree penny drop & AA consent
│   │   │   ├── imports.py            # CSV & PDF bank statement processing
│   │   │   ├── integrations.py       # Paytm connect, disconnect & status
│   │   │   ├── webhooks.py           # Cashfree, AA & KYB webhook listeners
│   │   │   ├── sales.py              # 7-day & 30-day sales analytics
│   │   │   ├── inventory.py          # Stock catalog & reorder alerts
│   │   │   ├── customers.py          # RFM customer segmentation
│   │   │   ├── marketing.py          # WhatsApp campaign generator
│   │   │   ├── finance.py            # P&L statement & margin analytics
│   │   │   └── copilot.py            # AI assistant with Claude/offline fallback
│   │   ├── models.py                 # SQLAlchemy ORM models (27 tables)
│   │   ├── schemas.py                # Pydantic validation schemas
│   │   ├── auth.py                   # JWT security & user session resolver
│   │   ├── db.py                     # SQLAlchemy session engine
│   │   └── main.py                   # FastAPI application factory & CORS
│   ├── scripts/
│   │   ├── seed.py                   # Database seeder
│   │   ├── reset_demo.py             # Tenant database reset script
│   │   └── demo_check.py             # Automated 18-point health audit
│   └── tests/                        # 53 automated pytest test cases
├── frontend/
│   ├── app/
│   │   ├── sign-in/                  # Modern login (Google, Magic Link, Passkey)
│   │   ├── sign-up/                  # Merchant registration landing page
│   │   ├── verify-email/             # Magic link dispatch confirmation
│   │   ├── recover-account/          # Secure account recovery
│   │   ├── auth/callback/            # Google OAuth & magic link callback handler
│   │   ├── auth/verify/              # Magic link token verification
│   │   ├── onboarding/               # Master onboarding wizard dashboard
│   │   ├── onboarding/business/      # Step 1: Business Profile form
│   │   ├── onboarding/verification/  # Step 2: KYB Identity Verification
│   │   ├── onboarding/bank-account/  # Step 3: Bank Account Verification
│   │   ├── onboarding/bank-consent/  # Step 4: Account Aggregator Consent
│   │   ├── onboarding/integrations/  # Step 6: Paytm & Data Integrations
│   │   ├── onboarding/preferences/   # Step 7: Language, Currency & Passkey
│   │   ├── onboarding/complete/      # Step 8: Dashboard Activation
│   │   ├── home/                     # Primary merchant dashboard
│   │   ├── dashboard/                # Merchant dashboard route
│   │   ├── sales/                    # Sales trend & breakdown charts
│   │   ├── inventory/                # Stock levels & demand forecasting
│   │   ├── stock/                    # Inventory route alias
│   │   ├── customers/                # Loyal, Regular & At-Risk RFM views
│   │   ├── marketing/                # WhatsApp promo copy generator
│   │   ├── finance/                  # Financial P&L overview
│   │   ├── copilot/                  # Voice-enabled AI Kirana Copilot
│   │   ├── bank-connections/         # Bank Accounts, AA Consents & Statements
│   │   ├── team/                     # Organization Team & RBAC management
│   │   └── settings/                 # Merchant profile, plan & settings
│   ├── components/                   # Reusable UI component library
│   └── lib/                          # API client, translations & types
└── .env.example                      # Complete environment configuration template
```

---

## 3. Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Configure Environment
```bash
cp .env.example .env
# Fill in your configuration values in .env
```

### 2. Setup and Run Backend
```bash
cd backend
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python scripts/seed.py
uvicorn app.main:app --reload --port 8000
```
Backend API will be running at `http://localhost:8000`.  
Interactive Swagger docs: `http://localhost:8000/docs`.

### 3. Setup and Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 4. Verification & Testing

### Run Pytest Automated Test Suite (53 Tests)
```bash
cd backend
pytest tests/
```
Output:
```
53 passed, 1 warning in 40.59s (100% PASS)
```

### Run Automated System Health Audit
```bash
cd backend
python scripts/demo_check.py
```
Output:
```
=================================================================
PAYTM VENTUREAI: SYSTEM & VERIFICATION HEALTH CHECK
=================================================================
--- 1. DATABASE & SEED PATTERNS ---
 [PASS] Catalog Size (>=40 products)               Found: 80
 [PASS] Customer Base (>=150 shoppers)             Found: 300
 [PASS] Transaction History (90 days, >3000 txs)   Found: 7214
 [PASS] UPI Payment Share (~75%)                   Found: 74.4%
 [PASS] Low Stock Alert Items (>=5 items)          Found: 10
 [PASS] Monthly Expenses Tracked (Rent/Salary/Elec) Found: 30

--- 2. AUTHENTICATION & SECURITY ---
 [PASS] Secure Session Creation                    User ID: 2
 [PASS] JWT Route Protection (No Token -> 401)     

--- 3. LIVE ENDPOINTS (CODE-COMPUTED) ---
 [PASS] Dashboard Metrics (/api/dashboard)         Today Sales: ₹0.0
 [PASS] Sales Analytics (/api/sales)               Week Total: ₹60,904.0
 [PASS] Inventory Status (/api/inventory)          Tracked: 80 products
 [PASS] 7-Day Forecast (/api/inventory/forecast)   Forecasts: 80
 [PASS] Customer Segments (/api/customers/segments) Summary: 3 groups
 [PASS] Marketing Generator (/api/marketing/generate) Variants: 3
 [PASS] Finance Summary (/api/finance/summary)     Net Profit: ₹-391.98
 [PASS] Recommendations Cards (/api/recommendations/today) Cards: 5

--- 4. COPILOT OFFLINE INTELLIGENCE ---
 [PASS] Copilot Sales Query ('आज की बिक्री...')    
 [PASS] Copilot Week Profit Query ('इस हफ्ते...')  
=================================================================
HEALTH CHECK SCORE: 18/18 CHECKS PASSED (100%)
>>> ALL CHECKS PASSED - ENVIRONMENT IS FULLY OPERATIONAL <<<
=================================================================
```

### Production Build Verification
```bash
cd frontend
npm run build
```
Output:
```
✓ Compiled successfully
✓ Finished TypeScript
✓ Generating static pages using 3 workers (30/30) in 2.4s
All 30 app routes compiled with zero errors.
```

---

## 5. API Endpoints Reference

### Authentication & Passkeys
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/magic-link/request` | Request single-use 10-minute email magic link |
| `POST` | `/api/auth/magic-link/verify` | Verify magic link token & issue session JWT |
| `GET` | `/api/auth/google/url` | Get Google OAuth 2.0 / OIDC sign-in URL |
| `GET` | `/api/auth/google/callback` | Handle Google OAuth redirect & user linking |
| `POST` | `/api/auth/passkeys/login/options` | Generate WebAuthn authentication challenge |
| `POST` | `/api/auth/passkeys/login/verify` | Verify passkey assertion & sign in |
| `POST` | `/api/auth/passkeys/register/options`| Generate WebAuthn passkey registration challenge |
| `POST` | `/api/auth/passkeys/register/verify` | Verify & store passkey credential |
| `GET` | `/api/auth/passkeys` | List registered passkeys for current user |
| `DELETE`| `/api/auth/passkeys/{id}` | Remove passkey credential |
| `POST` | `/api/auth/logout` | Revoke active user session |
| `GET` | `/api/auth/me` | Current authenticated user & merchant profile |

### Organizations & Onboarding
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/organizations` | Create merchant business organization |
| `GET` | `/api/organizations/current` | Get active organization details |
| `PATCH`| `/api/organizations/current` | Update organization profile & preferences |
| `GET` | `/api/organizations/members` | List organization team members |
| `POST` | `/api/organizations/members` | Invite organization member with role |
| `DELETE`| `/api/organizations/members/{id}` | Remove member from organization |
| `GET` | `/api/onboarding/status` | Current step & completed steps list |
| `PATCH`| `/api/onboarding/progress` | Advance onboarding step |
| `POST` | `/api/onboarding/complete` | Activate organization dashboard |

### Business Identity Verification (KYB)
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/business/verify` | Submit GSTIN, PAN, CIN, or Document for verification |
| `GET` | `/api/business/verifications` | List business verification records |
| `GET` | `/api/business/verify/{id}` | Get specific verification result |
| `POST` | `/api/business/verify/{id}/review` | Compliance reviewer approval / rejection |

### Bank Account Verification & Account Aggregator
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/bank/verify` | Cashfree penny-drop verification with name matching |
| `GET` | `/api/bank/accounts` | List verified bank accounts |
| `GET` | `/api/bank/verify/{id}` | Check penny drop verification status |
| `POST` | `/api/bank/connections` | Initiate Account Aggregator consent (Setu / Finvu) |
| `GET` | `/api/bank/connections` | List AA financial consents |
| `POST` | `/api/bank/consents/{id}/revoke`| Revoke Account Aggregator consent |
| `POST` | `/api/bank/data/fetch` | FIU-guarded financial data fetch |
| `GET` | `/api/bank/transactions` | Normalized bank transactions feed |

### Bank Statement Imports & Integrations
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/imports/statements` | Upload and normalize CSV/PDF bank statement |
| `GET` | `/api/imports` | List uploaded statement history |
| `DELETE`| `/api/imports/{id}` | Delete statement & cascade imported transactions |
| `POST` | `/api/integrations/paytm/connect` | Connect Paytm merchant credentials |
| `GET` | `/api/integrations` | List active business data integrations |
| `DELETE`| `/api/integrations/{provider}` | Disconnect provider integration |

### Webhooks (Secured with HMAC Signatures)
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/webhooks/cashfree` | Cashfree verification webhook (HMAC-SHA256 verified) |
| `POST` | `/api/webhooks/account-aggregator`| Account Aggregator consent notification webhook |
| `POST` | `/api/webhooks/kyb` | Business registry KYB webhook |

---

## 6. Regulatory & Security Compliance

- **No Production Bypasses**: The legacy fixed demo account (`demo@venture.ai` / `demo123`) has been completely removed from production authentication routes.
- **Account Aggregator Policy**: Live banking pulls are blocked by `FIUComplianceGuard` pending official Reserve Bank of India FIU registration.
- **PII & Data Protection**: Sensitive bank account numbers are stored encrypted using Fernet symmetric encryption and masked as `••••1234` in responses. Tax identifiers (PAN, GSTIN) are masked.
- **CSRF & Anti-Replay**: WebAuthn challenges and OAuth state nonces are cryptographically validated and single-use.
#   p a y t m  
 