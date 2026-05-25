import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://tvdlog:tvdlog123@localhost:5432/tvdlog")


engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db():
    """Initialize database and create tables"""
    # Import models locally to register them with Base.metadata and prevent circular imports
    from models.user import User
    from models.media import Media
    from models.settings import Settings

    try:
        logger.info("✅ Connecting to PostgreSQL...")
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created/verified")


        # Create default admin user
        db = SessionLocal()
        try:
            admin_user = db.query(User).filter(User.username == "admin").first()
            if not admin_user:
                from app.auth import get_password_hash
                admin_hash = get_password_hash("admin123")
                admin_user = User(username="admin", password_hash=admin_hash)
                db.add(admin_user)
                db.commit()
                logger.info("👤 Default admin user created (username: admin, password: admin123)")
            else:
                logger.info("👤 Admin user already exists")
        finally:
            db.close()

        # Create default settings
        db = SessionLocal()
        try:
            news_setting = db.query(Settings).filter(Settings.key == "news_enabled").first()
            if not news_setting:
                news_setting = Settings(key="news_enabled", value="true")
                db.add(news_setting)
                db.commit()
                logger.info("⚙️ Global settings created (news enabled by default)")
            else:
                logger.info("⚙️ Global settings already exist")
        finally:
            db.close()

    except Exception as e:
        logger.error(f"❌ Error initializing database: {e}")
        raise


def get_db() -> Session:
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
