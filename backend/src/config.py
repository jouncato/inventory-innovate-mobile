from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    PROJECT_NAME: str = "Inventory Vision AI - Solgar Colombia"
    API_V1_STR: str = "/api/v1"
    
    # Base de Datos
    DATABASE_URL: str = "postgresql+asyncpg://inventory_user:inventory_password@localhost:5432/inventory_db"
    
    # MinIO / S3
    S3_ENDPOINT: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minio_admin"
    S3_SECRET_KEY: str = "minio_secret_password"
    S3_BUCKET_CAPTURES: str = "raw-captures"
    S3_BUCKET_CROPS: str = "crops"
    
    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Ollama Local
    OLLAMA_HOST: str = "http://localhost:11434"
    EMBEDDING_MODEL: str = "embeddinggemma:latest"
    VLM_MODEL: str = "qwen3-vl:2b"
    REASONING_MODEL: str = "gemma4:12b"


settings = Settings()
