from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/toyospot"

    # JWT
    JWT_SECRET_KEY: str = "dev-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "hello@toyospot.ng"
    SMTP_FROM_NAME: str = "Toyo's Pot"
    SMTP_USE_TLS: bool = True

    # Web push
    VAPID_PUBLIC_KEY: str = ""
    VAPID_PRIVATE_KEY: str = ""
    VAPID_CLAIM_EMAIL: str = "mailto:hello@toyospot.ng"

    # Supabase Storage (food images uploaded from the admin dashboard)
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_STORAGE_BUCKET: str = "food-images"

    # Paystack (online payments)
    PAYSTACK_SECRET_KEY: str = ""
    PAYSTACK_PUBLIC_KEY: str = ""

    # App
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:5173"
    ADMIN_NOTIFICATION_EMAIL: str = "admin@toyospot.ng"
    CORS_ORIGINS: str = "http://localhost:5173"

    OTP_LENGTH: int = 4
    OTP_EXPIRE_MINUTES: int = 10
    DELIVERY_FEE: int = 1000
    LOW_STOCK_THRESHOLD_PCT: float = 0.2

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
