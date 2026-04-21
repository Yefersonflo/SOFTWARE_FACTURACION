from pydantic_settings import BaseSettings

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

    @property
    def DATABASE_URL(self):
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings()
