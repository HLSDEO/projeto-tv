from abc import ABC, abstractmethod
from typing import List, Optional
from sqlalchemy.orm import Session
from models.user import User

class IUserRepository(ABC):
    @abstractmethod
    def get_by_username(self, username: str) -> Optional[User]:
        pass

    @abstractmethod
    def get_all(self) -> List[User]:
        pass

    @abstractmethod
    def create(self, user: User) -> User:
        pass

    @abstractmethod
    def delete(self, user: User) -> None:
        pass

    @abstractmethod
    def commit(self) -> None:
        pass


class SQLAlchemyUserRepository(IUserRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username).first()

    def get_all(self) -> List[User]:
        return self.db.query(User).all()

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user: User) -> None:
        self.db.delete(user)
        self.db.commit()

    def commit(self) -> None:
        self.db.commit()
