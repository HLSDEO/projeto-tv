import os
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker, Session, declarative_base
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://tvdlog:tvdlog123@localhost:5432/tvdlog")


engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Naming convention for database constraints to ensure consistency across environments
naming_convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}
metadata = MetaData(naming_convention=naming_convention)
Base = declarative_base(metadata=metadata)


def init_db():
    """Initialize database and create tables"""
    from models.user import User
    from models.media import Media
    from models.settings import Settings
    from models.audit_log import AuditLog

    from core.audit_listeners import setup_audit_listeners
    setup_audit_listeners()


    try:
        logger.info("✅ Connecting to PostgreSQL...")
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created/verified")

        # Ensure must_change_password column exists on users table (for existing database schemas)
        db_ensure = SessionLocal()
        try:
            from sqlalchemy import text
            db_ensure.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT TRUE"))
            db_ensure.commit()
            logger.info("✅ Ensured must_change_password column exists on users table")
        except Exception as alter_err:
            logger.warning(f"Could not check/add must_change_password column: {alter_err}")
            db_ensure.rollback()
        finally:
            db_ensure.close()

        # Lightweight migrations for columns added after the initial release.
        # create_all() does not alter existing tables, so new columns are added idempotently here.
        from sqlalchemy import text
        with engine.begin() as conn:
            conn.execute(text(
                "ALTER TABLE media ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMP"
            ))
        logger.info("✅ Database migrations applied")

        # Create default admin user
        db = SessionLocal()
        try: 
            admin_user = db.query(User).filter(User.username == "admin").first()
            if not admin_user:
                from auth import get_password_hash
                admin_hash = get_password_hash("admin123")
                admin_user = User(username="admin", password_hash=admin_hash, must_change_password=False)
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

            blur_setting = db.query(Settings).filter(Settings.key == "logo_blur_enabled").first()
            if not blur_setting:
                blur_setting = Settings(key="logo_blur_enabled", value="true")
                db.add(blur_setting)
                db.commit()
                logger.info("⚙️ Global settings created (logo blur enabled by default)")

            logo_pos_setting = db.query(Settings).filter(Settings.key == "logo_position").first()
            if not logo_pos_setting:
                logo_pos_setting = Settings(key="logo_position", value="top-left")
                db.add(logo_pos_setting)
                db.commit()
                logger.info("⚙️ Global settings created (logo_position = top-left by default)")

            clock_pos_setting = db.query(Settings).filter(Settings.key == "clock_position").first()
            if not clock_pos_setting:
                clock_pos_setting = Settings(key="clock_position", value="top-right")
                db.add(clock_pos_setting)
                db.commit()
                logger.info("⚙️ Global settings created (clock_position = top-right by default)")

            news_pos_setting = db.query(Settings).filter(Settings.key == "news_position").first()
            if not news_pos_setting:
                news_pos_setting = Settings(key="news_position", value="bottom")
                db.add(news_pos_setting)
                db.commit()
                logger.info("⚙️ Global settings created (news_position = bottom by default)")
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
