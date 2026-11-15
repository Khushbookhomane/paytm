from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings, BACKEND_DIR

# Determine robust database URL: resolve relative SQLite path to BACKEND_DIR if needed
db_url = settings.DATABASE_URL
if db_url.startswith("sqlite:///"):
    sqlite_path_str = db_url.replace("sqlite:///", "")
    p = Path(sqlite_path_str)
    if not p.is_absolute():
        # If relative, check if file exists in current directory first; if not or if in backend, anchor to BACKEND_DIR
        if (BACKEND_DIR / p.name).exists():
            db_url = f"sqlite:///{(BACKEND_DIR / p.name).resolve().as_posix()}"
        else:
            db_url = f"sqlite:///{(BACKEND_DIR / p.name).resolve().as_posix()}"

# SQLite configuration with thread-safe settings for FastAPI
engine = create_engine(
    db_url,
    connect_args={"check_same_thread": False} if db_url.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
