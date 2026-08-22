import os
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

def _get_gemini_model() -> str:
    val = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip()
    if val in ["gemini-2.0-flash", "models/gemini-2.0-flash", "gemini-2.0-flash-exp", "gemini-1.5-flash"]:
        return "gemini-3.6-flash"
    return val or "gemini-3.6-flash"

class Settings:
    PROJECT_NAME: str = "SafeGuard AI Analysis Engine"
    VERSION: str = "2.4.0"
    GEMINI_MODEL: str = _get_gemini_model()
    
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./safeguard.db")
    
    GOOGLE_CLOUD_PROJECT: str = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    GOOGLE_CLOUD_STORAGE_BUCKET: str = os.getenv("GOOGLE_CLOUD_STORAGE_BUCKET", "safeguard-evidence-bucket")
    BIGQUERY_DATASET: str = os.getenv("BIGQUERY_DATASET", "safeguard_analytics")
    GOOGLE_APPLICATION_CREDENTIALS: str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
    
    LOCAL_UPLOAD_DIR: str = os.getenv("LOCAL_UPLOAD_DIR", "./storage/uploads")
    MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10MB

settings = Settings()
