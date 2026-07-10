from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import os
import logging
from core.api import api_get

logger = logging.getLogger(__name__)

class IBirthdayRepository(ABC):
    @abstractmethod
    def get_birthdays(
        self,
        month: Optional[int] = None,
        start_month: Optional[int] = None,
        end_month: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        pass

# Hardcoded mock data to fallback on during local development/testing
MOCK_DATA = [
    {"NO_PESSOA": "ELIANA MENDES SILVA", "DT_NASCIMENTO": "05/01/1995", "MONTH": 1, "DAY": 5},
    {"NO_PESSOA": "ANA SILVA OLIVEIRA", "DT_NASCIMENTO": "15/01/1990", "MONTH": 1, "DAY": 15},
    {"NO_PESSOA": "BRUNO SOUZA SANTOS", "DT_NASCIMENTO": "22/01/1985", "MONTH": 1, "DAY": 22},
    {"NO_PESSOA": "CARLOS ANDRADE COSTA", "DT_NASCIMENTO": "14/02/1992", "MONTH": 2, "DAY": 14},
    {"NO_PESSOA": "FABIANA ARAUJO LIMA", "DT_NASCIMENTO": "12/03/1993", "MONTH": 3, "DAY": 12},
    {"NO_PESSOA": "DANIEL ROCHA GOMES", "DT_NASCIMENTO": "30/06/1988", "MONTH": 6, "DAY": 30},
    {"NO_PESSOA": "GABRIEL NUNES REIS", "DT_NASCIMENTO": "18/07/1991", "MONTH": 7, "DAY": 18},
    {"NO_PESSOA": "HELENA CARDOSO DIAS", "DT_NASCIMENTO": "25/08/1987", "MONTH": 8, "DAY": 25},
    {"NO_PESSOA": "IGOR PINTO SOUZA", "DT_NASCIMENTO": "09/09/1994", "MONTH": 9, "DAY": 9},
    {"NO_PESSOA": "JULIANA ALVES COELHO", "DT_NASCIMENTO": "03/10/1989", "MONTH": 10, "DAY": 3},
    {"NO_PESSOA": "KLEBER MACEDO LIMA", "DT_NASCIMENTO": "17/11/1986", "MONTH": 11, "DAY": 17},
    {"NO_PESSOA": "LUANA FERREIRA ROCHA", "DT_NASCIMENTO": "29/12/1992", "MONTH": 12, "DAY": 29},
]

class APEXBirthdayRepository(IBirthdayRepository):
    base_url: Optional[str] = None

    def get_birthdays(
        self,
        month: Optional[int] = None,
        start_month: Optional[int] = None,
        end_month: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        url = self.base_url or os.getenv("APEX_REST_URL")
        if not url:
            logger.warning("⚠️ APEX_REST_URL is not configured. Falling back to local mock data.")
            return self._get_mock_birthdays(month, start_month, end_month)

        try:
            params = {}
            if month is not None:
                params["month"] = month
            if start_month is not None:
                params["start_month"] = start_month
            if end_month is not None:
                params["end_month"] = end_month

            logger.info(f"Connecting to APEX REST API at {url} with params {params}")
            
            # Using verify=False to bypass SSL validation errors on corporate/internal gov.br URLs

            response = api_get(url, parametros=params, timeout=10.0)

            if not response:
                raise Exception("Failed to fetch birthdays via api_get")
            response.raise_for_status()
            
            data = response.json()
            
            # ORDS usually returns list under 'items' key, but handle list responses as well
            items = data.get("items", []) if isinstance(data, dict) else data
            
            if not isinstance(items, list):
                logger.warning(f"Unexpected response format from APEX REST: {data}. Expected list or object with 'items'.")
                return self._get_mock_birthdays(month, start_month, end_month)
                
            birthdays = []
            for item in items:
                # Normalize keys (handle both upper and lower case from SQL query aliases)
                name = item.get("NO_PESSOA") or item.get("no_pessoa")
                birthday = item.get("DT_NASCIMENTO") or item.get("dt_nascimento")
                if name and birthday:
                    birthdays.append({
                        "NO_PESSOA": name,
                        "DT_NASCIMENTO": birthday
                    })
            
            logger.info(f"✅ Successfully retrieved {len(birthdays)} birthdays from APEX REST API.")
            return birthdays

        except Exception as e:
            logger.error(f"❌ Error calling APEX REST API: {e}. Falling back to mock data.")
            return self._get_mock_birthdays(month, start_month, end_month)

    def _get_mock_birthdays(
        self,
        month: Optional[int] = None,
        start_month: Optional[int] = None,
        end_month: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Filter and sort local mock data to simulate APEX REST query results"""
        if month is not None:
            filtered = [item for item in MOCK_DATA if item["MONTH"] == month]
        elif start_month is not None and end_month is not None:
            filtered = [item for item in MOCK_DATA if start_month <= item["MONTH"] <= end_month]
        else:
            filtered = MOCK_DATA

        # Sort by month, then by day, then by name
        sorted_data = sorted(filtered, key=lambda x: (x["MONTH"], x["DAY"], x["NO_PESSOA"]))
        return [{"NO_PESSOA": item["NO_PESSOA"], "DT_NASCIMENTO": item["DT_NASCIMENTO"]} for item in sorted_data]
