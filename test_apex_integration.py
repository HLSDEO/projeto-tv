#!/usr/bin/env python3
import os
import sys

# Adiciona o diretório backend/app ao sys.path para podermos importar o core.api
PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "backend", "app"))

from dotenv import load_dotenv
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))

import logging
# Configura o logger para printar de forma limpa no console/terminal
logging.basicConfig(level=logging.INFO, format="[%(asctime)s] [%(levelname)s] - %(message)s")

try:
    from backend.app.core.api import api_get, OAUTH_ENABLED, obter_token_atual, AMBIENTE
except ImportError as e:
    print(f"Erro ao importar o core.api do backend: {e}")
    print("Verifique se o script está sendo executado na raiz do projeto.")
    sys.exit(1)

def testar_conexao(url):
    print("=" * 70)
    print(f"Iniciando teste de integração com APEX")
    print(f"Ambiente configurado: {AMBIENTE.upper()}")
    print(f"Autenticação OAuth 2.0 ativa: {OAUTH_ENABLED}")
    print(f"URL de teste: {url}")
    print("=" * 70)
    
    # Executa a chamada usando a função padrão do projeto (que possui retry, verify=False e OAuth)
    response = api_get(url, timeout=15)
    
    if response:
        print(f"\n✓ Requisição concluída com sucesso!")
        print(f"Status HTTP: {response.status_code}")
        print(f"Tempo total de resposta: {response.elapsed.total_seconds():.3f}s")
        print(f"Tamanho do corpo retornado: {len(response.content)} bytes")
        
        # Mostra se o token foi usado/gerado
        token = obter_token_atual()
        if token:
            print(f"Token OAuth ativo em cache: {token[:15]}...{token[-10:]}")
        else:
            print("Nenhum token OAuth em cache (ou OAuth desativado para o ambiente).")
            
        try:
            dados = response.json()
            print("\nEstrutura JSON válida recebida:")
            if isinstance(dados, list):
                print(f"-> Retornou uma lista com {len(dados)} registros.")
                if len(dados) > 0:
                    print(f"-> Amostra do primeiro registro: {dados[0]}")
            elif isinstance(dados, dict):
                print(f"-> Chaves do dicionário retornado: {list(dados.keys())}")
                if "items" in dados:
                    items = dados["items"]
                    print(f"-> Campo 'items' possui {len(items)} registros.")
        except Exception:
            print("\nA resposta não está em formato JSON.")
            print(f"Primeiros 250 caracteres do corpo:")
            print("-" * 50)
            print(response.text[:250])
            print("-" * 50)
    else:
        print("\n✗ A requisição falhou (retornou False ou ocorreu um erro de conexão/timeout).")

if __name__ == "__main__":
    # URL padrão de aniversariantes resolvido pela biblioteca
    url_padrao = os.getenv("APEX_REST_URL")
    
    # Se o usuário passar um parâmetro, podemos usar como endpoint relativo ou absoluto
    if len(sys.argv) > 1:
        param = sys.argv[1]
        if param.startswith("http://") or param.startswith("https://"):
            url_alvo = param
        else:
            # Se for apenas um endpoint relativo, ex: "/teste"
            # Importa base_url_apex para construir a URL dinâmica baseada no ambiente
            from backend.app.core.api import base_url_apex
            url_alvo = f"{base_url_apex}/{param.lstrip('/')}"
    else:
        url_alvo = url_padrao

    if not url_alvo:
        print("Erro: Nenhuma URL configurada no APEX_REST_URL ou fornecida como argumento.")
        sys.exit(1)
        
    testar_conexao(url_alvo)
