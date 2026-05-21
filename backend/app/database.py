import os
from sqlalchemy import create_engine, Column, String, Boolean, Integer, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://tvdlog:tvdlog123@localhost:5432/tv_dlog_db")

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)


class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # "image" or "video"
    duration = Column(Integer, default=10)  # seconds
    active = Column(Boolean, default=True)
    order = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    url = Column(String, nullable=False)


class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(String, nullable=False)


def init_db():
    """Initialize database and create tables"""
    try:
        logger.info("✅ Connecting to PostgreSQL...")
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created/verified")

        # Create default admin user
        db = SessionLocal()
        try:
            admin_user = db.query(User).filter(User.username == "admin").first()
            if not admin_user:
                from auth import get_password_hash
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
