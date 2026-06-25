# 🐳 TV-DLOG - Docker & Infrastructure Engineering

Esta pasta centraliza a documentação, políticas e configurações de infraestrutura conteinerizada do **TV-DLOG**.

---

## 🛠️ Stack de Contêineres

O projeto utiliza **dois arquivos do Docker Compose** para separar o ciclo de vida do banco de dados das aplicações, garantindo que o banco de dados permaneça online e que comandos comuns como `docker compose down` não removam o banco acidentalmente:

1. **`postgres` (Banco de Dados - `docker-compose.db.yml`):**
   * Imagem: `postgres:15-alpine` (leve, rápida e segura).
   * Nome do Contêiner: `tv-dlog-bd` (estático).
   * Porta Interna: `5432` (comunicação restrita à rede virtual por segurança).
   * Nome do Banco / Usuário: `tvdlog`.
   * Volume Persistente: `postgres_data` (armazenado com segurança pelo Docker engine).
   
2. **`backend` (FastAPI API - `docker-compose.yml`):**
   * Build local baseado no `backend/Dockerfile` (`python:3.11-slim`).
   * Porta Mapeada: `8200:8000`.
   * Pasta de Uploads: Mapeada através de *bind-mount* de `./uploads:/app/uploads` para sincronizar as mídias com o host.
   
3. **`frontend` (React + Vite Client - `docker-compose.yml`):**
   * Build local baseado no `frontend/Dockerfile` (`node:20-alpine`).
   * Porta Mapeada: `3100:3100`.

Ambas as stacks se comunicam através da rede externa compartilhada **`tvdlog-network`**.

---

## 🔒 Variáveis de Ambiente (.env)

Todas as credenciais críticas e parâmetros de infraestrutura foram desacoplados do código de produção e do `docker-compose.yml` para o arquivo **`.env`** localizado na raiz do projeto.

### Parâmetros Suportados:
* `POSTGRES_USER`: Usuário de conexão do banco (Padrão: `tvdlog`).
* `POSTGRES_PASSWORD`: Senha de conexão do banco (Padrão: `tvdlog123`).
* `POSTGRES_DB`: Nome do banco de dados unificado (Padrão: `tvdlog`).
* `POSTGRES_PORT`: Porta de comunicação no host (Padrão: `5432`).
* `SECRET_KEY`: Chave criptográfica para geração de tokens JWT.
* `UPLOAD_DIR`: Pasta relativa de arquivos de uploads (Padrão: `uploads`).

---

## 🚀 Comandos Úteis de Operação

### 1. Inicializar o Banco de Dados (Executar primeiro)
A rede virtual `tvdlog-network` e o banco serão criados e mantidos online:
```bash
docker compose -f docker/docker-compose.db.yml up -d
```

### 2. Inicializar a Aplicação (Backend e Frontend)
Compila e inicia as aplicações na mesma rede:
```bash
docker compose up -d --build
```

### 3. Parar e Remover os Contêineres da Aplicação (Sem parar o banco)
Derruba apenas as aplicações (backend e frontend), deixando o banco intacto:
```bash
docker compose down
```

### 4. Parar e Remover o Banco de Dados (Uso Opcional)
```bash
docker compose -f docker/docker-compose.db.yml down
```
> [!WARNING]
> Nunca execute `docker compose -f docker/docker-compose.db.yml down -v` a menos que queira **apagar deliberadamente** todo o banco de dados e registros do sistema (Reset Completo). Para restaurar após isso, você precisará do script de restore (`docker/db-restore.bat`).

### 5. Inspecionar Logs em Tempo Real
```bash
docker logs -f tv-dlog-bd       # Logs do Postgres
docker compose logs -f backend  # Logs do FastAPI
```

---

## ⚙️ Diretrizes de Healthcheck

Para evitar problemas de conexões recusadas em tempo de inicialização, o contêiner do `backend` inicializará e tentará se conectar com o banco. O banco possui um mecanismo reativo de verificação no Postgres em `docker-compose.db.yml`:
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
```
Isso garante que o container esteja saudável no Docker e que o backend possa rodar a inicialização do banco (`init_db`) sem falhas silenciosas.
