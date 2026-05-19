import os
from arango import ArangoClient
import time

ARANGO_URL = os.getenv("ARANGO_URL", "http://localhost:8529")
ARANGO_ROOT_PASSWORD = os.getenv("ARANGO_ROOT_PASSWORD", "rootpassword")
DB_NAME = "tv_dlog_db"

def get_db():
    client = ArangoClient(hosts=ARANGO_URL)
    
    # Retry logic for waiting ArangoDB to start
    sys_db = None
    for _ in range(30):
        try:
            sys_db = client.db('_system', username='root', password=ARANGO_ROOT_PASSWORD)
            sys_db.ping()
            break
        except Exception:
            time.sleep(1)
            
    if sys_db is None:
        raise Exception("Could not connect to ArangoDB")

    if not sys_db.has_database(DB_NAME):
        sys_db.create_database(DB_NAME)
        
    db = client.db(DB_NAME, username='root', password=ARANGO_ROOT_PASSWORD)
    
    # Initialize collections
    collections = ['media', 'settings', 'users']
    for col in collections:
        if not db.has_collection(col):
            db.create_collection(col)
            
    # Initialize default admin user if empty
    users_col = db.collection('users')
    if users_col.count() == 0:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        users_col.insert({
            'username': 'admin',
            'password_hash': pwd_context.hash('admin123')
        })
        
    # Initialize default settings
    settings_col = db.collection('settings')
    if settings_col.count() == 0:
        settings_col.insert({
            '_key': 'global',
            'news_enabled': True
        })
        
    return db
