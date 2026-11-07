from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "OmniCampus University Resource Hub API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Database Configuration (PostgreSQL)
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "omnicampus_db")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    @property
    def ASYNC_DATABASE_URI(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Institutional SSO / OAuth2 / OIDC Settings
    OIDC_ISSUER_URL: str = os.getenv("OIDC_ISSUER_URL", "https://sso.university.edu/auth/realms/campus")
    OIDC_CLIENT_ID: str = os.getenv("OIDC_CLIENT_ID", "omnicampus-web-hub")
    OIDC_CLIENT_SECRET: str = os.getenv("OIDC_CLIENT_SECRET", "change-me-in-production")
    OIDC_JWKS_URL: str = os.getenv("OIDC_JWKS_URL", "https://sso.university.edu/auth/realms/campus/protocol/openid-connect/certs")
    
    # Internal JWT Session tokens
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "super-secret-institution-master-key-xyz987")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12 # 12 hours
    
    # Storage settings for lecture notes & past exam papers
    STORAGE_LOCAL_DIR: str = os.getenv("STORAGE_LOCAL_DIR", "/var/omnicampus/uploads")
    MAX_UPLOAD_SIZE_BYTES: int = 50 * 1024 * 1024 # 50 MB
    
    # Allowed CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://univ.edu",
        "https://hub.univ.edu"
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
