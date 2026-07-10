import os
import time
import requests
import urllib3
import threading
from dotenv import load_dotenv

# Desabilita os avisos de requisições HTTPS não verificadas
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# LOCAL
import logging
logger = logging.getLogger(__name__)

# Garante o carregamento das variáveis de ambiente
load_dotenv()

# Determinação do modo OAuth e resolução dinâmica de URLs com base no AMBIENTE
AMBIENTE = os.getenv("AMBIENTE", "dev").strip().lower()
OAUTH_ENABLED = AMBIENTE != "dev"

if AMBIENTE == "dev":
    base_url_apex = os.getenv("DEV_BASE_URL_APEX", "https://appsdev.pf.gov.br/ws_20260210101622/api").strip()
else:
    base_url_apex = os.getenv("PROD_BASE_URL_APEX", "https://appslite.pf.gov.br/dlog/api").strip()

base_url_apex = base_url_apex.rstrip("/")

# Define as URLs específicas caso não estejam no .env
if not os.getenv("APEX_REST_URL"):
    if AMBIENTE == "dev":
        os.environ["APEX_REST_URL"] = "https://appsdev.pf.gov.br/ws_20260210101622/servidor/aniversariante"
    else:
        os.environ["APEX_REST_URL"] = f"{base_url_apex}/aniversariante"

# Estado global do OAuth
_OAUTH_TOKEN = None
_OAUTH_CALLBACK = None
_OAUTH_CLIENT_ID = None
_OAUTH_CLIENT_SECRET = None
_OAUTH_TOKEN_URL = None
_oauth_lock = threading.Lock()

DELAY_INICIAL = os.getenv("TEMPO_ESPERA", 5)


def obter_token_oauth(client_id: str, client_secret: str, token_url: str) -> str:
    """
    Obtém o token de acesso (access_token) usando o fluxo Client Credentials Grant Type.
    Faz um POST com o Basic Auth nativo do requests.
    """
    try:
        payload = {"grant_type": "client_credentials"}
        response = requests.post(
            token_url,
            auth=(client_id, client_secret),
            data=payload,
            verify=False,
            timeout=30
        )
        response.raise_for_status()
        
        data = response.json()
        token = data.get("access_token")
        if not token:
            logger.error("OAuth: 'access_token' não encontrado no JSON de resposta.")
            return None
        return token
    except requests.exceptions.RequestException as e:
        logger.error(f"OAuth: Falha na conexão ou requisição HTTP ao obter token: {e}")
        return None
    except ValueError as e:
        logger.error(f"OAuth: Falha na decodificação do JSON de resposta do token: {e}")
        return None


def registrar_token_callback(callback):
    """
    Registra uma função callback que retorna um novo token de acesso.
    Esta função será chamada automaticamente em caso de erro 401 (Unauthorized).
    """
    global _OAUTH_CALLBACK
    _OAUTH_CALLBACK = callback


def configurar_oauth(client_id: str, client_secret: str, token_url: str, token_inicial: str = None):
    """
    Configura as credenciais de OAuth 2.0 e inicializa o callback padrão para renovação.
    """
    global _OAUTH_CLIENT_ID, _OAUTH_CLIENT_SECRET, _OAUTH_TOKEN_URL, _OAUTH_TOKEN
    _OAUTH_CLIENT_ID = client_id
    _OAUTH_CLIENT_SECRET = client_secret
    _OAUTH_TOKEN_URL = token_url
    if token_inicial:
        _OAUTH_TOKEN = token_inicial

    def callback_padrao():
        return obter_token_oauth(_OAUTH_CLIENT_ID, _OAUTH_CLIENT_SECRET, _OAUTH_TOKEN_URL)

    registrar_token_callback(callback_padrao)


def obter_token_atual() -> str:
    """
    Retorna o token OAuth 2.0 atualmente em cache na memória.
    """
    global _OAUTH_TOKEN
    return _OAUTH_TOKEN


# Auto-configure if variables are available
_env_client_id = os.getenv("OAUTH_CLIENT_ID")
_env_client_secret = os.getenv("OAUTH_CLIENT_SECRET")
_env_token_url = os.getenv("OAUTH_TOKEN_URL")
if OAUTH_ENABLED and _env_client_id and _env_client_secret and _env_token_url:
    logger.info("OAuth: Auto-configuring credentials from environment variables.")
    configurar_oauth(_env_client_id, _env_client_secret, _env_token_url)


def _executar_com_retry(metodo_request, url, local_logger, max_retries, delay_inicial, backoff_factor, **kwargs):
    """
    Função centralizadora (wrapper) para executar requisições HTTP com lógica de retry e backoff.
    Recebe a função do método HTTP (ex: requests.get) e repassa os argumentos adicionais via **kwargs.
    """
    global _OAUTH_TOKEN
    retries = 0
    token_refreshed = False
    
    # Garante que o delay seja um número real (float) para evitar erro no time.sleep()
    try:
        delay = float(delay_inicial)
    except (ValueError, TypeError):
        delay = 5.0 

    # Injeção automática do Bearer Token se OAuth estiver ativado e o token já estiver disponível
    if OAUTH_ENABLED:
        if "headers" not in kwargs or kwargs["headers"] is None:
            kwargs["headers"] = {}
        if _OAUTH_TOKEN and not kwargs["headers"].get("Authorization"):
            kwargs["headers"]["Authorization"] = f"Bearer {_OAUTH_TOKEN}"

    while True:
        try:
            # O **kwargs desempacota parâmetros como params, data, headers, proxies, etc.
            response = metodo_request(url, **kwargs)
            
            # Intercepção de HTTP 401 Unauthorized
            if response.status_code == 401 and OAUTH_ENABLED and not token_refreshed:
                token_refreshed = True
                local_logger.warning("HTTP: 401 Unauthorized detectado. Iniciando processo de atualização do token...")
                with _oauth_lock:
                    headers = kwargs.get("headers") or {}
                    current_auth = headers.get("Authorization", "")
                    
                    # Se _OAUTH_TOKEN já foi atualizado por outra thread, usamos o novo
                    if _OAUTH_TOKEN and f"Bearer {_OAUTH_TOKEN}" != current_auth:
                        local_logger.info("OAuth: Utilizando token já atualizado por outra thread.")
                        novo_token = _OAUTH_TOKEN
                    else:
                        if _OAUTH_CALLBACK:
                            local_logger.info("OAuth: Solicitando novo token de acesso via callback...")
                            novo_token = _OAUTH_CALLBACK()
                            if novo_token:
                                _OAUTH_TOKEN = novo_token
                            else:
                                local_logger.error("OAuth: Falha ao obter novo token via callback.")
                                novo_token = None
                        else:
                            local_logger.warning("OAuth: Nenhum callback de token registrado.")
                            novo_token = None
                            
                    if novo_token:
                        if "headers" not in kwargs or kwargs["headers"] is None:
                            kwargs["headers"] = {}
                        kwargs["headers"]["Authorization"] = f"Bearer {novo_token}"
                        
                        # Altera por referência o cabeçalho original passado (se for um dict) para propagação
                        if isinstance(headers, dict):
                            headers["Authorization"] = f"Bearer {novo_token}"
                            
                        local_logger.info("OAuth: Refazendo a requisição com o novo token...")
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

