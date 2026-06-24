import unittest
import sys
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Adjust path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from database import Base, get_db
from models.user import User
from models.media import Media
from models.settings import Settings
from models.audit_log import AuditLog
from auth import get_password_hash, create_access_token

class TestAdminAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create engine and connect once to share the connection for in-memory SQLite
        cls.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        cls.connection = cls.engine.connect()
        
        # Bind SessionLocal to the active shared connection
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.connection)
        
        # Create all tables on the shared connection
        Base.metadata.create_all(bind=cls.connection)

        # Override get_db dependency to yield sessions from the shared connection sessionmaker
        def override_get_db():
            db = cls.SessionLocal()
            try:
                yield db
            finally:
                db.close()
        app.dependency_overrides[get_db] = override_get_db
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()
        cls.connection.close()
        cls.engine.dispose()

    def setUp(self):
        self.db = self.SessionLocal()
        # Clean tables
        self.db.query(AuditLog).delete()
        self.db.query(User).delete()
        self.db.commit()

        # Create test users
        hashed_admin = get_password_hash("admin123")
        self.admin_user = User(username="admin", password_hash=hashed_admin, must_change_password=False)
        
        hashed_operator = get_password_hash("operator123")
        self.operator_user = User(username="operator", password_hash=hashed_operator, must_change_password=False)
        
        self.db.add(self.admin_user)
        self.db.add(self.operator_user)
        self.db.commit()

        # Create tokens
        self.admin_token = create_access_token({"sub": "admin"})
        self.operator_token = create_access_token({"sub": "operator"})

    def tearDown(self):
        self.db.close()

    def test_login_success_audit_log(self):
        response = self.client.post(
            "/api/auth/login",
            data={"username": "admin", "password": "admin123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        self.assertEqual(response.status_code, 200)

        # Check that LOGIN_SUCCESS audit log was created
        logs = self.db.query(AuditLog).filter(AuditLog.action == "LOGIN_SUCCESS").all()
        self.assertEqual(len(logs), 1)
        self.assertEqual(logs[0].username, "admin")
        self.assertEqual(logs[0].entity_type, "User")
        self.assertIn("realizou login com sucesso", logs[0].details)

    def test_login_failed_audit_log(self):
        response = self.client.post(
            "/api/auth/login",
            data={"username": "admin", "password": "wrongpassword"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        self.assertEqual(response.status_code, 401)

        # Check that LOGIN_FAILED audit log was created
        logs = self.db.query(AuditLog).filter(AuditLog.action == "LOGIN_FAILED").all()
        self.assertEqual(len(logs), 1)
        self.assertEqual(logs[0].username, "admin")
        self.assertEqual(logs[0].entity_type, "User")
        self.assertIn("Tentativa de login falhou", logs[0].details)

    def test_get_audit_logs_unauthorized_for_operator(self):
        response = self.client.get(
            "/api/admin/audit-logs",
            headers={"Authorization": f"Bearer {self.operator_token}"}
        )
        self.assertEqual(response.status_code, 403)

    def test_get_audit_logs_authorized_for_admin(self):
        # Insert a dummy audit log first
        dummy_log = AuditLog(
            username="operator",
            action="UPLOAD_MEDIA",
            entity_type="Media",
            details="dummy detail"
        )
        self.db.add(dummy_log)
        self.db.commit()

        response = self.client.get(
            "/api/admin/audit-logs",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("logs", data)
        self.assertEqual(len(data["logs"]), 1)
        self.assertEqual(data["logs"][0]["action"], "UPLOAD_MEDIA")
        self.assertEqual(data["logs"][0]["username"], "operator")

if __name__ == '__main__':
    unittest.main()
