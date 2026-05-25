import unittest
from unittest.mock import MagicMock
import sys
import os

# Adjust path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.user_service import UserService
from repositories.user_repository import IUserRepository
from models.user import User

class TestUserService(unittest.TestCase):
    def setUp(self):
        # Create a mock repository
        self.mock_user_repo = MagicMock(spec=IUserRepository)
        self.mock_user_repo.get_by_username.return_value = None
        self.user_service = UserService(self.mock_user_repo)

    def test_create_user_short_password(self):
        """Test that creating a user with a short password raises ValueError"""
        with self.assertRaises(ValueError) as context:
            self.user_service.create_user("valid_user", "123")
        self.assertEqual(str(context.exception), "Password must be at least 6 characters long")

    def test_create_user_short_username(self):
        """Test that creating a user with a short username raises ValueError"""
        with self.assertRaises(ValueError) as context:
            self.user_service.create_user("us", "valid_password123")
        self.assertEqual(str(context.exception), "Username must be at least 3 characters long")

    def test_create_user_already_exists(self):
        """Test that creating an already existing user raises ValueError"""
        # Mock repository to return an existing user
        self.mock_user_repo.get_by_username.return_value = User(username="existing_user")
        
        with self.assertRaises(ValueError) as context:
            self.user_service.create_user("existing_user", "valid_password123")
        self.assertIn("already exists", str(context.exception))

    def test_authenticate_user_success(self):
        """Test successful authentication"""
        from auth import get_password_hash
        hashed = get_password_hash("mysecretpassword")
        
        db_user = User(username="admin", password_hash=hashed)
        self.mock_user_repo.get_by_username.return_value = db_user

        authenticated = self.user_service.authenticate_user("admin", "mysecretpassword")
        self.assertIsNotNone(authenticated)
        self.assertEqual(authenticated.username, "admin")

    def test_authenticate_user_fail(self):
        """Test authentication failure with incorrect password"""
        from auth import get_password_hash
        hashed = get_password_hash("mysecretpassword")
        
        db_user = User(username="admin", password_hash=hashed)
        self.mock_user_repo.get_by_username.return_value = db_user

        authenticated = self.user_service.authenticate_user("admin", "wrong_password")
        self.assertIsNone(authenticated)

if __name__ == '__main__':
    unittest.main()
