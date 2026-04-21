from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sistema_Facturacion"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "Yeferson9610_Secret_Key_Super_Secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "Yeferson9610"
    POSTGRES_SERVER: str = "127.0.0.1"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "facturacion_db"

    # Optional override: set DATABASE_URL env var (recommended for local testing)
    DATABASE_URL_ENV: str | None = None

    @property
    def DATABASE_URL(self):
        # Priority: explicit DATABASE_URL env var -> DATABASE_URL_ENV -> constructed Postgres URL
        env_url = os.getenv("DATABASE_URL")
        if env_url:
            return env_url
        if self.DATABASE_URL_ENV:
            return self.DATABASE_URL_ENV
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings()
