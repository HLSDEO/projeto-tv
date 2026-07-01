import os
import time
import requests
import urllib3
from dotenv import load_dotenv

# Desabilita os avisos de requisições HTTPS não verificadas
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# LOCAL
import logging
logger = logging.getLogger(__name__)

# Garante o carregamento das variáveis de ambiente
load_dotenv()

DELAY_INICIAL = os.getenv("TEMPO_ESPERA", 5)


def _executar_com_retry(metodo_request, url, local_logger, max_retries, delay_inicial, backoff_factor, **kwargs):
    """
    Função centralizadora (wrapper) para executar requisições HTTP com lógica de retry e backoff.
    Recebe a função do método HTTP (ex: requests.get) e repassa os argumentos adicionais via **kwargs.
    """
    retries = 0
    
    # Garante que o delay seja um número real (float) para evitar erro no time.sleep()
    try:
        delay = float(delay_inicial)
    except (ValueError, TypeError):
        delay = 5.0 

    while True:
        try:
            # O **kwargs desempacota parâmetros como params, data, headers, proxies, etc.
            response = metodo_request(url, **kwargs)
            
            if response.status_code == 429 and retries < max_retries:
                retries += 1
                local_logger.warning(
                    f"HTTP: 429 "
                    f"Aguardando {delay}s antes de tentar novamente (Tentativa {retries}/{max_retries})..."
                )
                time.sleep(delay)
                delay *= backoff_factor
                continue
                
            return response
            
        except Exception as e:
            # Captura o nome do método (GET, POST, PUT) para o log de erro
            metodo_nome = metodo_request.__name__.upper()
            local_logger.error(f"Falha ao consumir API {metodo_nome} - URL: {url} - erro: {e}")
            return False


def api_post(url: str, parametros=None, conteudo=None, cabecalho=None, route=None, timeout=60, max_retries=4, backoff_factor=2):
    local_logger = logger
    return _executar_com_retry(
        metodo_request=requests.post, 
        url=url, 
        local_logger=local_logger, 
        max_retries=max_retries, 
        delay_inicial=DELAY_INICIAL, 
        backoff_factor=backoff_factor,
        params=parametros, data=conteudo, headers=cabecalho, verify=False, timeout=timeout
    )


def api_get(url: str, parametros=None, cabecalho=None, route=None, timeout=60, max_retries=3, backoff_factor=2):
    local_logger = logger
    return _executar_com_retry(
        metodo_request=requests.get, 
        url=url, 
        local_logger=local_logger, 
        max_retries=max_retries, 
        delay_inicial=DELAY_INICIAL, 
        backoff_factor=backoff_factor,
        params=parametros, headers=cabecalho, verify=False, timeout=timeout
    )


def api_put(url: str, parametros=None, conteudo=None, cabecalho=None, route=None, timeout=60, max_retries=3, backoff_factor=2):
    local_logger = logger
    return _executar_com_retry(
        metodo_request=requests.put, 
        url=url, 
        local_logger=local_logger, 
        max_retries=max_retries, 
        delay_inicial=DELAY_INICIAL, 
        backoff_factor=backoff_factor,
        params=parametros, data=conteudo, headers=cabecalho, verify=False, timeout=timeout
    )
