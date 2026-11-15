# Paytm VentureAI — Production Deployment Guide

This guide details the deployment architecture, environment configurations, and production checklist for running Paytm VentureAI on modern cloud platforms (Render, Railway, Docker, AWS, or Vercel).

---

## 1. Production Architecture Overview

- **Frontend**: Next.js 16 (App Router + Turbopack) deployed on **Vercel** or containerized Node.js.
- **Backend**: FastAPI 0.111+ (ASGI) running on Python 3.11+, with Uvicorn workers behind a reverse proxy (Nginx or Cloudflare).
- **Database**: PostgreSQL (AWS RDS, Neon, Supabase, or Render Postgres) managed via Alembic migrations.
- **Authentication**:
  - Google OAuth 2.0 / OpenID Connect
  - Single-use Email Magic Links (Amazon SES or Resend)
  - WebAuthn / FIDO2 Passkeys (device biometrics)
  - **Zero SMS OTP dependencies**
- **Bank & Identity**:
  - Cashfree Verification API (Penny Drop)
  - Setu / Finvu Account Aggregator sandbox
  - Modular Paytm Merchant Partner Adapter
  - Direct CSV/PDF statement ingestion pipeline

---

## 2. Environment Variables Checklist

Ensure these variables are configured in your production host environment (e.g. Render/Railway dashboard):

```ini
# Application
APP_ENV=production
PROJECT_NAME=Paytm VentureAI
FRONTEND_URL=https://ventureai.yourdomain.com
BACKEND_URL=https://api.ventureai.yourdomain.com
ALLOWED_ORIGINS=https://ventureai.yourdomain.com
MERCHANT_TIMEZONE=Asia/Kolkata

# Database (PostgreSQL recommended in production)
DATABASE_URL=postgresql://user:securepassword@ep-host.ap-south-1.aws.neon.tech/ventureai?sslmode=require

# Security & Encryption
SECRET_KEY=generate-strong-64-char-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ENCRYPTION_KEY=generate-fernet-key-for-bank-account-storage

# WebAuthn / Passkeys
RP_ID=ventureai.yourdomain.com
RP_NAME=Paytm VentureAI
RP_ORIGIN=https://ventureai.yourdomain.com

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://api.ventureai.yourdomain.com/api/auth/google/callback

# Passwordless Email Provider
EMAIL_PROVIDER=resend              # ses | resend | console
EMAIL_API_KEY=re_your_resend_key
EMAIL_FROM=auth@ventureai.yourdomain.com

# Cashfree Bank Account Ownership Verification
CASHFREE_CLIENT_ID=cf_live_client_id
CASHFREE_CLIENT_SECRET=cf_live_secret
CASHFREE_ENVIRONMENT=production    # sandbox | production
CASHFREE_WEBHOOK_SECRET=your-cf-webhook-secret

# Account Aggregator (AA) Integration
ACCOUNT_AGGREGATOR_PROVIDER=setu
AA_CLIENT_ID=setu_client_id
AA_CLIENT_SECRET=setu_client_secret
AA_ENVIRONMENT=production
AA_WEBHOOK_SECRET=your-aa-webhook-secret

# Paytm Partner Integration
PAYTM_API_BASE_URL=https://securegw.paytm.in
PAYTM_CLIENT_ID=paytm_partner_id
PAYTM_CLIENT_SECRET=paytm_partner_secret
PAYTM_MERCHANT_ID=paytm_mid
PAYTM_WEBHOOK_SECRET=your-paytm-webhook-secret

# AI Intelligence
ANTHROPIC_API_KEY=sk-ant-your-api-key
LLM_MODEL=claude-3-5-sonnet-20241022

# Frontend
NEXT_PUBLIC_API_URL=https://api.ventureai.yourdomain.com/api
```

---

## 3. Database Migrations (Alembic)

Run database migrations before starting the application:

```bash
cd backend
# Run pending migrations
alembic upgrade head
```

---

## 4. Production Deployment Methods

### Option A: Backend on Render / Railway

1. Connect your Git repository.
2. Configure settings:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt && alembic upgrade head`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 4`
3. Add all environment variables from Section 2.

### Option B: Frontend on Vercel

1. Connect your Git repository.
2. Configure settings:
   - **Framework**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
3. Set environment variable:
   - `NEXT_PUBLIC_API_URL=https://api.ventureai.yourdomain.com/api`
4. Deploy.

### Option C: Containerized Deployment (Docker)

```dockerfile
# Backend Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN alembic upgrade head
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

---

## 5. Security & Verification Checklist

- [x] Legacy production demo account (`demo@venture.ai` / `demo123`) removed.
- [x] Unauthenticated dashboard access prohibited.
- [x] Magic link tokens stored as SHA-256 hashes with 10-minute expiry and single-use invalidation.
- [x] Google OAuth validation of issuer, audience, signature, and state nonce.
- [x] WebAuthn Passkeys registered with challenge-response verification.
- [x] Cashfree penny-drop verification implements deterministic name matching (mismatches require review).
- [x] Account Aggregator queries guarded by `FIUComplianceGuard` pending confirmed RBI FIU registration.
- [x] Bank statement imports validate file types, size limits (<10MB), and normalize transaction schemas.
- [x] Webhook endpoints verify cryptographic signatures (Cashfree HMAC-SHA256).
- [x] Multi-tenant organization queries enforce strict tenant boundary isolation.
- [x] Sensitive account numbers and tax IDs are masked across all logs and interfaces.
- [x] 53/53 pytest tests pass; 18/18 health checks pass.
