from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .db import engine, Base
from .routers import (
    auth, dashboard, sales, inventory, customers,
    marketing, finance, recommendations, copilot, upload,
    organizations, business_verification, bank_verification, integrations,
    imports, webhooks,
    notifications, growth_score, intelligence, reports,
)

# Initialise all tables (SQLite dev / Alembic handles prod migrations)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
)

allowed_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# Auth & identity
app.include_router(auth.router, prefix=settings.API_V1_STR)

# Organisation & onboarding
app.include_router(organizations.router, prefix=settings.API_V1_STR)

# Verification
app.include_router(business_verification.router, prefix=settings.API_V1_STR)
app.include_router(bank_verification.router, prefix=settings.API_V1_STR)

# Integrations & statements
app.include_router(integrations.router, prefix=settings.API_V1_STR)
app.include_router(imports.router, prefix=settings.API_V1_STR)
app.include_router(webhooks.router, prefix=settings.API_V1_STR)

# Business operating modules
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(sales.router, prefix=settings.API_V1_STR)
app.include_router(inventory.router, prefix=settings.API_V1_STR)
app.include_router(customers.router, prefix=settings.API_V1_STR)
app.include_router(marketing.router, prefix=settings.API_V1_STR)
app.include_router(finance.router, prefix=settings.API_V1_STR)
app.include_router(recommendations.router, prefix=settings.API_V1_STR)
app.include_router(copilot.router, prefix=settings.API_V1_STR)
app.include_router(upload.router, prefix=settings.API_V1_STR)

# VentureAI AI Enterprise Modules
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(growth_score.router, prefix=settings.API_V1_STR)
app.include_router(intelligence.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)


@app.get("/health")
@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Paytm VentureAI Backend",
        "version": "2.5.0",
        "product": "VentureAI - Your AI Business Partner. Beyond Payments.",
        "llm_ready": bool(settings.ANTHROPIC_API_KEY.strip()),
        "google_auth": settings.google_configured,
        "bank_verification": settings.cashfree_configured,
    }
