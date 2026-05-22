from fastapi import APIRouter
import httpx
import xml.etree.ElementTree as ET
import logging

router = APIRouter(prefix="/api/news", tags=["news"])

RSS_URL = "https://g1.globo.com/rss/g1/"

@router.get("")
async def get_news():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(RSS_URL)
            response.raise_for_status()
            
            root = ET.fromstring(response.text)
            news_items = []
            
            # Extract first 5 items
            for item in root.findall('./channel/item')[:5]:
                title = item.find('title').text if item.find('title') is not None else ""
                news_items.append(title)
                
            return {"news": news_items}
    except Exception as e:
        logging.error(f"Error fetching news: {e}")
        return {"news": ["Falha ao carregar as notícias mais recentes."]}
