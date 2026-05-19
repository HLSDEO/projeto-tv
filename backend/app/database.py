import os
from arango import ArangoClient
import time
import logging

ARANGO_URL = os.getenv("ARANGO_URL", "http://localhost:8529")
ARANGO_ROOT_PASSWORD = os.getenv("ARANGO_ROOT_PASSWORD", "rootpassword")
DB_NAME = "tv_dlog_db"

logger = logging.getLogger(__name__)

def get_db():
    client = ArangoClient(hosts=ARANGO_URL)

    # Retry logic for waiting ArangoDB to start
    sys_db = None
    for attempt in range(30):
        try:
            sys_db = client.db('_system', username='root', password=ARANGO_ROOT_PASSWORD)
            sys_db.ping()
            logger.info("✅ Connected to ArangoDB")
            break
        except Exception as e:
            logger.debug(f"Attempt {attempt + 1}/30: Waiting for ArangoDB... ({str(e)})")
            time.sleep(1)

    if sys_db is None:
        raise Exception("Could not connect to ArangoDB after 30 attempts")

    # Create database if not exists
    if not sys_db.has_database(DB_NAME):
        sys_db.create_database(DB_NAME)
        logger.info(f"📁 Database '{DB_NAME}' created")

    db = client.db(DB_NAME, username='root', password=ARANGO_ROOT_PASSWORD)

    # Initialize collections
    collections = ['media', 'settings', 'users']
    for col_name in collections:
        if not db.has_collection(col_name):
            db.create_collection(col_name)
            logger.info(f"📋 Collection '{col_name}' created")

    # Initialize default admin user
    try:
        users_col = db.collection('users')
        admin_user = next(users_col.find({'username': 'admin'}), None)

        if not admin_user:
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            users_col.insert({
                'username': 'admin',
                'password_hash': pwd_context.hash('admin123')
            })
            logger.info("👤 Default admin user created (username: admin, password: admin123)")
        else:
            logger.info("👤 Admin user already exists")
    except Exception as e:
        logger.error(f"❌ Error initializing admin user: {e}")
        raise

    # Initialize default settings
    try:
        settings_col = db.collection('settings')
        global_settings = settings_col.get('global')

        if not global_settings:
            settings_col.insert({
                '_key': 'global',
                'news_enabled': True
            })
            logger.info("⚙️ Global settings created")
        else:
            logger.info("⚙️ Global settings already exist")
    except Exception as e:
        logger.error(f"❌ Error initializing settings: {e}")
        raise

    return db
