import os
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "SafeGuard AI Analysis Engine"
    VERSION: str = "2.4.0"
    GEMINI_MODEL: str = "gemini-3.6-flash"
    
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./safeguard.db")
    
    GOOGLE_CLOUD_PROJECT: str = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    GOOGLE_CLOUD_STORAGE_BUCKET: str = os.getenv("GOOGLE_CLOUD_STORAGE_BUCKET", "safeguard-evidence-bucket")
    BIGQUERY_DATASET: str = os.getenv("BIGQUERY_DATASET", "safeguard_analytics")
    GOOGLE_APPLICATION_CREDENTIALS: str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
    
    LOCAL_UPLOAD_DIR: str = os.getenv("LOCAL_UPLOAD_DIR", "./storage/uploads")
    MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10MB

settings = Settings()
