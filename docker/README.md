# 🐳 TV-DLOG - Docker & Infrastructure Engineering

Esta pasta centraliza a documentação, políticas e configurações de infraestrutura conteinerizada do **TV-DLOG**.

---

## 🛠️ Stack de Contêineres

O projeto utiliza o **Docker Compose** para orquestrar três serviços essenciais:
1. **`postgres` (Banco de Dados):**
   * Imagem: `postgres:15-alpine` (leve, rápida e segura).
   * Porta Mapeada: `5432:5432`.
   * Nome do Banco / Usuário: `tvdlog`.
   * Volume Persistente: `postgres_data` (armazenado com segurança pelo Docker engine).
2. **`backend` (FastAPI API):**
   * Build local baseado no `backend/Dockerfile` (`python:3.11-slim`).
   * Porta Mapeada: `8000:8000`.
   * Pasta de Uploads: Mapeada através de *bind-mount* de `./uploads:/app/uploads` para sincronizar os uploads de mídias com o host.
3. **`frontend` (React + Vite Client):**
   * Build local baseado no `frontend/Dockerfile` (`node:20-alpine`).
   * Porta Mapeada: `5173:5173`.

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
* `VITE_API_URL`: URL de acesso à API pelo cliente (Padrão: `http://localhost:8000`).

---

## 🚀 Comandos Úteis de Operação

### 1. Inicializar toda a Stack (Modo Background)
```bash
docker-compose up -d
```

### 2. Parar e Remover os Contêineres
```bash
docker-compose down
```

### 3. Reinicializar Limpando o Cache de Volumes (Reset Completo)
Se você precisar redefinir os bancos de dados do zero:
```bash
docker-compose down -v
docker-compose up --build -d
```

### 4. Inspecionar Logs em Tempo Real
```bash
docker-compose logs -f postgres   # Logs do Postgres
docker-compose logs -f backend    # Logs do FastAPI
```

---

## ⚙️ Diretrizes de Healthcheck

Para evitar problemas de conexões recusadas em tempo de inicialização, o contêiner do `backend` depende da integridade do banco de dados. Implementamos um mecanismo reativo de verificação no Postgres:
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U tvdlog -d tvdlog"]
```
Isso garante que o backend só inicie quando o Postgres estiver 100% pronto para aceitar conexões e queries, eliminando quaisquer avisos silenciosos de inicialização nos servidores.
