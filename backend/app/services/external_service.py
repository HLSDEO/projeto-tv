from abc import ABC, abstractmethod
import httpx
import xml.etree.ElementTree as ET
import logging

logger = logging.getLogger(__name__)

class IExternalService(ABC):
    @abstractmethod
    async def get_weather(self, city: str, enabled: bool) -> dict:
        pass

    @abstractmethod
    async def get_news(self) -> dict:
        pass


class ExternalService(IExternalService):
    def __init__(self, rss_url: str = "https://g1.globo.com/rss/g1/"):
        self.rss_url = rss_url

    async def get_weather(self, city: str, enabled: bool) -> dict:
        if not enabled:
            return {"enabled": False, "weather": ""}

        city_name = city if city else "Brasília"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"https://wttr.in/{city_name}?lang=pt&format=%c+%t+%C", timeout=3.0)
                if response.status_code == 200:
                    text = response.text.strip()
                    if "Unknown location" in text or "Sorry" in text or len(text) > 50:
                        return {"enabled": True, "weather": f"📍 {city_name}: clima indisponível"}
                    return {"enabled": True, "weather": f"📍 {city_name}: {text}"}
        except Exception as e:
            logger.error(f"Error fetching weather: {e}")
        
        return {"enabled": True, "weather": f"📍 {city_name}: clima indisponível"}

    async def get_news(self) -> dict:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.rss_url)
                response.raise_for_status()
                
                root = ET.fromstring(response.text)
                news_items = []
                
                # Extract first 5 items
                for item in root.findall('./channel/item')[:5]:
                    title = item.find('title').text if item.find('title') is not None else ""
                    news_items.append(title)
                    
                return {"news": news_items}
        except Exception as e:
            logger.error(f"Error fetching news: {e}")
            return {"news": ["Falha ao carregar as notícias mais recentes."]}
