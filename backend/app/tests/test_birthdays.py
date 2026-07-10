import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# Adjust path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.birthday_service import BirthdayService
from repositories.birthday_repository import IBirthdayRepository, APEXBirthdayRepository

class TestBirthdayService(unittest.TestCase):
    def setUp(self):
        self.mock_repo = MagicMock(spec=IBirthdayRepository)
        self.service = BirthdayService(self.mock_repo)

    def test_get_birthdays_calls_repo(self):
        """Test that birthday service correctly delegates calls to the repository"""
        expected = [{"NO_PESSOA": "TEST USER", "DT_NASCIMENTO": "01/01/2000"}]
        self.mock_repo.get_birthdays.return_value = expected
        
        result = self.service.get_birthdays(month=1)
        
        self.mock_repo.get_birthdays.assert_called_once_with(month=1, start_month=None, end_month=None)
        self.assertEqual(result, expected)

    def test_mock_fallback_logic_single_month(self):
        """Test that APEXBirthdayRepository falls back and sorts mock data correctly for a single month"""
        repo = APEXBirthdayRepository()
        birthdays = repo._get_mock_birthdays(month=1)
        
        # Verify count of January birthdays in mock data (Eliana, Ana, Bruno)
        self.assertEqual(len(birthdays), 3)
        
        # Verify sorting: Eliana (05/01) -> Ana (15/01) -> Bruno (22/01)
        self.assertEqual(birthdays[0]["NO_PESSOA"], "ELIANA MENDES SILVA")
        self.assertEqual(birthdays[0]["DT_NASCIMENTO"], "05/01/1995")

    def test_mock_fallback_logic_period(self):
        """Test that APEXBirthdayRepository correctly filters a period of months (ex: 1 to 2)"""
        repo = APEXBirthdayRepository()
        birthdays = repo._get_mock_birthdays(start_month=1, end_month=2)
        
        # January (3) + February (1) = 4 birthdays
        self.assertEqual(len(birthdays), 4)
        
        # Verify sorting by month first, then day: Eliana (05/01) -> Ana (15/01) -> Bruno (22/01) -> Carlos (14/02)
        self.assertEqual(birthdays[0]["NO_PESSOA"], "ELIANA MENDES SILVA")
        self.assertEqual(birthdays[3]["NO_PESSOA"], "CARLOS ANDRADE COSTA")
        self.assertEqual(birthdays[3]["DT_NASCIMENTO"], "14/02/1992")

    @patch("repositories.birthday_repository.api_get")
    @patch.object(APEXBirthdayRepository, 'base_url', 'http://mock-apex/birthdays')
    def test_apex_api_success(self, mock_get):
        """Test that APEXBirthdayRepository successfully makes HTTP request and parses ORDS JSON format"""
        # Mock Response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "items": [
                {"no_pessoa": "ELIANA MENDES SILVA", "dt_nascimento": "05/01/1995"},
                {"NO_PESSOA": "ANA SILVA OLIVEIRA", "DT_NASCIMENTO": "15/01/1990"}
            ]
        }
        mock_get.return_value = mock_response

        repo = APEXBirthdayRepository()
        result = repo.get_birthdays(month=1)

        mock_get.assert_called_once_with("http://mock-apex/birthdays", parametros={"month": 1}, timeout=10.0)
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["NO_PESSOA"], "ELIANA MENDES SILVA")
        self.assertEqual(result[1]["NO_PESSOA"], "ANA SILVA OLIVEIRA")

    @patch("repositories.birthday_repository.api_get")
    @patch.object(APEXBirthdayRepository, 'base_url', 'http://mock-apex/birthdays')
    def test_apex_api_failure_fallback(self, mock_get):
        """Test that APEXBirthdayRepository falls back to mock data when HTTP request fails"""
        mock_get.side_effect = Exception("Connection Refused")
        
        repo = APEXBirthdayRepository()
        result = repo.get_birthdays(month=1)
        self.assertEqual(len(result), 3)

if __name__ == '__main__':
    unittest.main()
