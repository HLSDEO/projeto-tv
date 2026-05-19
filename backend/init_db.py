#!/usr/bin/env python3
"""
Database initialization script
Creates the database, collections, and default admin user
Run this script if the automatic initialization fails
"""

import os
import sys
from arango import ArangoClient
from passlib.context import CryptContext

ARANGO_URL = os.getenv("ARANGO_URL", "http://localhost:8529")
ARANGO_ROOT_PASSWORD = os.getenv("ARANGO_ROOT_PASSWORD", "rootpassword")
DB_NAME = "tv_dlog_db"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init_database():
    print("🔄 Connecting to ArangoDB...")

    try:
        client = ArangoClient(hosts=ARANGO_URL)
        sys_db = client.db('_system', username='root', password=ARANGO_ROOT_PASSWORD)
        sys_db.ping()
        print("✅ Connected to ArangoDB")
    except Exception as e:
        print(f"❌ Failed to connect to ArangoDB: {e}")
        sys.exit(1)

    # Create database if not exists
    print(f"📁 Creating database '{DB_NAME}' if not exists...")
    if not sys_db.has_database(DB_NAME):
        sys_db.create_database(DB_NAME)
        print(f"✅ Database '{DB_NAME}' created")
    else:
        print(f"✅ Database '{DB_NAME}' already exists")

    # Connect to the application database
    db = client.db(DB_NAME, username='root', password=ARANGO_ROOT_PASSWORD)

    # Create collections
    collections = ['media', 'settings', 'users']
    for col_name in collections:
        print(f"📋 Creating collection '{col_name}' if not exists...")
        if not db.has_collection(col_name):
            db.create_collection(col_name)
            print(f"✅ Collection '{col_name}' created")
        else:
            print(f"✅ Collection '{col_name}' already exists")

    # Create or reset admin user
    users_col = db.collection('users')
    print(f"\n👤 Managing admin user...")

    admin_user = next(users_col.find({'username': 'admin'}), None)

    if admin_user:
        print("✅ Admin user exists")
        print(f"   Username: admin")
    else:
        print("➕ Creating admin user...")
        admin_hash = pwd_context.hash('admin123')
        users_col.insert({
            'username': 'admin',
            'password_hash': admin_hash
        })
        print("✅ Admin user created")
        print("   Username: admin")
        print("   Password: admin123")

    # Create default settings
    settings_col = db.collection('settings')
    print(f"\n⚙️  Managing settings...")

    global_settings = settings_col.get('global')
    if global_settings:
        print("✅ Global settings exist")
    else:
        print("➕ Creating global settings...")
        settings_col.insert({
            '_key': 'global',
            'news_enabled': True
        })
        print("✅ Global settings created (news enabled by default)")

    print("\n" + "="*50)
    print("✅ Database initialization complete!")
    print("="*50)
    print("\n📺 Access the application:")
    print("   Frontend: http://localhost:5173")
    print("   Backend:  http://localhost:8000")
    print("\n🔐 Login credentials:")
    print("   Username: admin")
    print("   Password: admin123")

if __name__ == "__main__":
    init_database()
