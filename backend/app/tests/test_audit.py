import unittest
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Adjust path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database import Base
from models.user import User
from models.media import Media
from models.settings import Settings
from models.audit_log import AuditLog
from core.context import set_request_context, clear_request_context, get_request_context
from core.audit_listeners import setup_audit_listeners

class TestAuditListeners(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create an in-memory SQLite engine for testing listeners
        cls.engine = create_engine("sqlite:///:memory:")
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)
        
        # Register listeners
        setup_audit_listeners()
        
        # Create tables
        Base.metadata.create_all(bind=cls.engine)

    def setUp(self):
        self.db = self.SessionLocal()
        clear_request_context()

    def tearDown(self):
        self.db.close()
        clear_request_context()

    def test_audit_mixin_timestamps(self):
        # Test that user creation sets created_at/updated_at
        user = User(username="test_user", password_hash="secret")
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        self.assertIsNotNone(user.created_at)
        self.assertIsNotNone(user.updated_at)
        # Difference should be negligible (less than 1 second)
        self.assertLess(abs((user.created_at - user.updated_at).total_seconds()), 1.0)


    def test_automatic_audit_log_on_insert(self):
        # Set request context
        set_request_context(user_id=42, username="operator", ip_address="127.0.0.1")

        # Create media
        media = Media(
            filename="test.png",
            original_name="original.png",
            type="image",
            duration=10,
            active=True,
            order=1,
            url="/uploads/test.png"
        )
        self.db.add(media)
        self.db.commit()
        self.db.refresh(media)

        # Check that audit log was automatically created
        logs = self.db.query(AuditLog).filter(AuditLog.entity_type == "Media", AuditLog.entity_id == media.id).all()
        self.assertEqual(len(logs), 1)
        log = logs[0]
        self.assertEqual(log.action, "UPLOAD_MEDIA")
        self.assertEqual(log.user_id, 42)
        self.assertEqual(log.username, "operator")
        self.assertEqual(log.ip_address, "127.0.0.1")
        self.assertIn("original.png", log.details)

    def test_automatic_audit_log_on_update(self):
        # Set request context
        set_request_context(user_id=1, username="admin", ip_address="192.168.1.100")

        # Create setting
        setting = Settings(key="test_key", value="test_value")
        self.db.add(setting)
        self.db.commit()

        # Update setting
        setting.value = "new_value"
        self.db.commit()
        self.db.refresh(setting)

        # Check logs
        logs = self.db.query(AuditLog).filter(AuditLog.entity_type == "Settings", AuditLog.entity_id == setting.id).all()
        # Should have 2 logs: one for CREATE_SETTING, one for UPDATE_SETTING
        self.assertEqual(len(logs), 2)
        self.assertEqual(logs[0].action, "CREATE_SETTING")
        self.assertEqual(logs[1].action, "UPDATE_SETTING")
        self.assertEqual(logs[1].user_id, 1)
        self.assertEqual(logs[1].username, "admin")
        self.assertEqual(logs[1].ip_address, "192.168.1.100")
        self.assertIn("alterada para 'new_value'", logs[1].details)

    def test_automatic_audit_log_on_delete(self):
        # Set request context
        set_request_context(user_id=99, username="sysadmin", ip_address="10.0.0.1")

        # Create user
        user = User(username="temp_user", password_hash="pass")
        self.db.add(user)
        self.db.commit()
        user_id = user.id

        # Delete user
        self.db.delete(user)
        self.db.commit()

        # Check logs
        logs = self.db.query(AuditLog).filter(AuditLog.entity_type == "User", AuditLog.entity_id == user_id).all()
        self.assertEqual(len(logs), 2)
        self.assertEqual(logs[0].action, "CREATE_USER")
        self.assertEqual(logs[1].action, "DELETE_USER")
        self.assertEqual(logs[1].user_id, 99)
        self.assertEqual(logs[1].username, "sysadmin")
        self.assertEqual(logs[1].ip_address, "10.0.0.1")
        self.assertIn("excluído", logs[1].details)

if __name__ == "__main__":
    unittest.main()
