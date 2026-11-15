from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BACKEND_DIR / "venture_ai.db"


class Settings(BaseSettings):
    PROJECT_NAME: str = "Paytm VentureAI"
    API_V1_STR: str = "/api"
    APP_ENV: str = "development"

    # Security
    SECRET_KEY: str = "paytm-venture-ai-hackathon-secret-key-change-in-prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    ENCRYPTION_KEY: str = ""  # Fernet key for field-level encryption

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # URLs
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    # Database
    DATABASE_URL: str = f"sqlite:///{DEFAULT_DB_PATH.as_posix()}"

    # LLM
    ANTHROPIC_API_KEY: str = ""
    LLM_MODEL: str = "claude-3-5-sonnet-20241022"

    # Timezone
    MERCHANT_TIMEZONE: str = "Asia/Kolkata"

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/google/callback"

    # Email provider
    EMAIL_PROVIDER: str = "console"  # console | ses | resend
    EMAIL_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@ventureai.in"

    # Cashfree bank verification
    CASHFREE_CLIENT_ID: str = ""
    CASHFREE_CLIENT_SECRET: str = ""
    CASHFREE_ENVIRONMENT: str = "sandbox"  # sandbox | production

    # Account Aggregator
    ACCOUNT_AGGREGATOR_PROVIDER: str = ""
    AA_CLIENT_ID: str = ""
    AA_CLIENT_SECRET: str = ""
    AA_ENVIRONMENT: str = "sandbox"

    # Paytm integration
    PAYTM_API_BASE_URL: str = ""
    PAYTM_CLIENT_ID: str = ""
    PAYTM_CLIENT_SECRET: str = ""

    model_config = SettingsConfigDict(
        env_file=[str(BASE_DIR / ".env"), str(BACKEND_DIR / ".env"), ".env"],
        extra="ignore",
    )

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"

    @property
    def google_configured(self) -> bool:
        return bool(self.GOOGLE_CLIENT_ID and self.GOOGLE_CLIENT_SECRET)

    @property
    def cashfree_configured(self) -> bool:
        return bool(self.CASHFREE_CLIENT_ID and self.CASHFREE_CLIENT_SECRET)


settings = Settings()
