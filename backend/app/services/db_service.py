from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, Session
from backend.app.config import settings
from backend.app.models import Base

# Database engine initialization (SQLite or PostgreSQL / Cloud SQL)
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Create tables and alter schema if columns are missing (safe migration)."""
    Base.metadata.create_all(bind=engine)
    
    # Check if we need to add new columns (safe migration)
    inspector = inspect(engine)
    try:
        # 1. Update analysis_results columns
        ar_columns = [col["name"] for col in inspector.get_columns("analysis_results")]
        new_ar_cols = {
            "observed_evidence": "JSON",
            "ai_inference": "JSON",
            "uncertainty": "JSON"
        }
        
        with engine.begin() as conn:
            for col_name, col_type in new_ar_cols.items():
                if col_name not in ar_columns:
                    try:
                        conn.execute(text(f"ALTER TABLE analysis_results ADD COLUMN {col_name} {col_type}"))
                        print(f"[db_service] Added missing column '{col_name}' to 'analysis_results' table.")
                    except Exception as col_err:
                        print(f"[db_service] Warning: Failed to add column '{col_name}' to analysis_results: {col_err}")
                        
        # 2. Update evidence columns
        ev_columns = [col["name"] for col in inspector.get_columns("evidence")]
        new_ev_cols = {
            "evidence_type": "VARCHAR",
            "mime_type": "VARCHAR"
        }
        
        with engine.begin() as conn:
            for col_name, col_type in new_ev_cols.items():
                if col_name not in ev_columns:
                    try:
                        conn.execute(text(f"ALTER TABLE evidence ADD COLUMN {col_name} {col_type}"))
                        print(f"[db_service] Added missing column '{col_name}' to 'evidence' table.")
                    except Exception as col_err:
                        print(f"[db_service] Warning: Failed to add column '{col_name}' to evidence: {col_err}")
    except Exception as inspect_err:
        print(f"[db_service] Warning: Migration inspection failed: {inspect_err}")

def get_db():
    """FastAPI dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
