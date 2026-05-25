from abc import ABC, abstractmethod
from typing import List, Optional
from repositories.user_repository import IUserRepository
from models.user import User
from auth import get_password_hash, verify_password

class IUserService(ABC):
    @abstractmethod
    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        pass

    @abstractmethod
    def list_users(self) -> List[User]:
        pass

    @abstractmethod
    def create_user(self, username: str, password: str) -> User:
        pass

    @abstractmethod
    def reset_password(self, username: str, new_password: str) -> None:
        pass

    @abstractmethod
    def delete_user(self, username: str) -> None:
        pass


class UserService(IUserService):
    def __init__(self, user_repo: IUserRepository):
        self.user_repo = user_repo

    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        user = self.user_repo.get_by_username(username)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    def list_users(self) -> List[User]:
        return self.user_repo.get_all()

    def create_user(self, username: str, password: str) -> User:
        # Check if already exists in repository
        existing = self.user_repo.get_by_username(username)
        if existing:
            raise ValueError(f"User '{username}' already exists")

        # Basic validations
        if not username or len(username) < 3:
            raise ValueError("Username must be at least 3 characters long")
        if not password or len(password) < 6:
            raise ValueError("Password must be at least 6 characters long")

        password_hash = get_password_hash(password)
        new_user = User(username=username, password_hash=password_hash)
        return self.user_repo.create(new_user)

    def reset_password(self, username: str, new_password: str) -> None:
        if not new_password or len(new_password) < 6:
            raise ValueError("Password must be at least 6 characters long")

        user = self.user_repo.get_by_username(username)
        if not user:
            raise KeyError(f"User '{username}' not found")

        user.password_hash = get_password_hash(new_password)
        self.user_repo.commit()

    def delete_user(self, username: str) -> None:
        if username == 'admin':
            raise ValueError("Cannot delete the admin account")

        user = self.user_repo.get_by_username(username)
        if not user:
            raise KeyError(f"User '{username}' not found")

        self.user_repo.delete(user)
