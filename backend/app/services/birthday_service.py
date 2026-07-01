from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from repositories.birthday_repository import IBirthdayRepository

class IBirthdayService(ABC):
    @abstractmethod
    def get_birthdays(
        self,
        month: Optional[int] = None,
        start_month: Optional[int] = None,
        end_month: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        pass

class BirthdayService(IBirthdayService):
    def __init__(self, repo: IBirthdayRepository):
        self.repo = repo

    def get_birthdays(
        self,
        month: Optional[int] = None,
        start_month: Optional[int] = None,
        end_month: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        return self.repo.get_birthdays(
            month=month,
            start_month=start_month,
            end_month=end_month
        )
