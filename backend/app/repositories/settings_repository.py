from abc import ABC, abstractmethod
from typing import Optional
from sqlalchemy.orm import Session
from models.settings import Settings

class ISettingsRepository(ABC):
    @abstractmethod
    def get_by_key(self, key: str) -> Optional[Settings]:
        pass

    @abstractmethod
    def set_key_value(self, key: str, value: str) -> Settings:
        pass

    @abstractmethod
    def commit(self) -> None:
        pass


class SQLAlchemySettingsRepository(ISettingsRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_key(self, key: str) -> Optional[Settings]:
        return self.db.query(Settings).filter(Settings.key == key).first()

    def set_key_value(self, key: str, value: str) -> Settings:
        setting = self.get_by_key(key)
        if setting:
            setting.value = value
        else:
            setting = Settings(key=key, value=value)
            self.db.add(setting)
        self.db.commit()
        return setting

    def commit(self) -> None:
        self.db.commit()
