import logging
import os
import time
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models.db_models import Base

logger = logging.getLogger("stormshield.db")

db_url = settings.DATABASE_URL
connect_args = {}

# Ensure SQLite database path is always absolute relative to the backend directory
if db_url.startswith("sqlite:///./") or db_url == "sqlite:///stormshield.db":
    backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    db_file = os.path.join(backend_root, "stormshield.db")
    db_url = f"sqlite:///{db_file}"

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = None

def create_app_engine():
    global db_url, connect_args
    target_url = db_url
    max_retries = 5 if not target_url.startswith("sqlite") else 1
    
    for attempt in range(1, max_retries + 1):
        try:
            eng = create_engine(target_url, connect_args=connect_args)
            with eng.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info(f"Database connected successfully to {target_url.split('@')[-1] if '@' in target_url else target_url}")
            return eng
        except Exception as e:
            if attempt < max_retries:
                logger.warning(f"Database connection attempt {attempt}/{max_retries} failed: {e}. Retrying in 1s...")
                time.sleep(1)
            else:
                logger.warning(f"Could not connect to configured DATABASE_URL ({target_url}): {e}. Falling back to SQLite.")
                backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                db_file = os.path.join(backend_root, "stormshield.db")
                db_url = f"sqlite:///{db_file}"
                return create_engine(db_url, connect_args={"check_same_thread": False})

engine = create_app_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def is_db_connected() -> bool:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False

def init_db():

    if not str(engine.url).startswith("sqlite"):
        try:
            with engine.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                conn.commit()
                logger.info("PostGIS extension verified on PostgreSQL.")
        except Exception as e:
            logger.warning(f"Note on PostGIS extension creation: {e}")

    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully.")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

