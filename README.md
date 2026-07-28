# TV DLOG - Sistema de Sinalização Digital (Digital Signage)

O **TV DLOG** é uma solução corporativa robusta de Sinalização Digital (*Digital Signage*) desenvolvida para gerenciamento e exibição contínua de conteúdos multimídia em telas e televisores. O sistema combina uma arquitetura moderna baseada em microserviços/containers, painel de controle administrativo intuitivo, sincronização via WebSockets em tempo real e integração com serviços de previsão do tempo e feeds de notícias.

---

## 📑 Sumário

- [Visão Geral e Funcionalidades](#-visão-geral-e-funcionalidades)
- [Arquitetura e Tecnologias](#-arquitetura-e-tecnologias)
- [Estrutura de Infraestrutura Kubernetes (k8s)](#-estrutura-de-infraestrutura-kubernetes-k8s)
- [Guias de Implantação e Execução](#-guias-de-implantação-e-execução)
  - [1. Implantação via Kubernetes (K3s / Cluster)](#1-implantação-via-kubernetes-k3s--cluster)
  - [2. Implantação via Docker Compose](#2-implantação-via-docker-compose)
  - [3. Execução em Ambiente de Desenvolvimento Local](#3-execução-em-ambiente-de-desenvolvimento-local)
- [Estrutura do Repositório](#-estrutura-do-repositório)
- [Procedimentos de Backup e Restauração](#-procedimentos-de-backup-e-restauração)
- [Credenciais Padrão e Acessos](#-credenciais-padrão-e-acessos)

---

## ✨ Visão Geral e Funcionalidades

- **📺 Carrossel de Mídias Inteligente**: Suporte à reprodução contínua de imagens e vídeos com suporte a duração configurável e controle automático de término (*onEnded*).
- **🎛️ Painel Administrativo Centralizado**: Gerenciamento de playlists, upload de arquivos, reordenação de conteúdos e alteração de parâmetros do sistema.
- **⚡ Sincronização em Tempo Real (WebSockets)**: Atualização instantânea dos displays de TV assim que alterações são efetuadas no painel de administração, sem necessidade de recarregar a página.
- **📰 Letreiro de Notícias Dinâmico (RSS Feed)**: Exibição de manchetes atualizadas em tempo real via integração com feed RSS.
- **🗓️ Agendamento Temporizado de Mídias**: Programação de data e hora para início de exibição de conteúdos na playlist.
- **🌤️ Informações de Clima e Relógio Integrados**: Exibição de relógio digital em tempo real e previsão do tempo configurável para a localidade.

---

## 🏗️ Arquitetura e Tecnologias

### Backend
- **FastAPI**: Framework assíncrono de alto desempenho em Python.
- **PostgreSQL 15**: Banco de dados relacional para persistência de dados.
- **SQLAlchemy & Pydantic**: ORM e validação de contratos de dados (DTOs).
- **WebSockets & Uvicorn**: Comunicação bidirecional em tempo real e servidor ASGI.

### Frontend
- **React 19 & Vite**: Interface de usuário reativa de alta performance.
- **Tailwind CSS**: Estilização moderna e responsiva.
- **Axios & React Router**: Consumo de API REST e roteamento de páginas.

### Infraestrutura e Orquestração
- **Kubernetes (K3s / Standard K8s)**: Manifestos YAML estruturados para alta disponibilidade e persistência.
- **Docker & Docker Compose**: Containerização e orquestração para ambientes locais e de desenvolvimento.

---

## 📦 Estrutura de Infraestrutura Kubernetes (k8s)

A aplicação conta com um conjunto completo de manifestos Kubernetes localizados no diretório [`k8s/`](file:///c:/Users/Admin/Documentos/TV-DLOG/projeto-tv/k8s), preparados para implantação em clusters Kubernetes (como K3s, MicroK8s ou ambientes de produção):

| Manifesto | Recurso Kubernetes | Descrição |
| :--- | :--- | :--- |
| [`configmap.yaml`](file:///c:/Users/Admin/Documentos/TV-DLOG/projeto-tv/k8s/configmap.yaml) | `ConfigMap` (`tvdlog-config`) | Armazena variáveis de ambiente não sensíveis (diretórios de uploads, URLs externas de APIs, nível de log e portas do frontend/backend). |
| [`secret.yaml`](file:///c:/Users/Admin/Documentos/TV-DLOG/projeto-tv/k8s/secret.yaml) | `Secret` (`tvdlog-secret`) | Guarda credenciais do PostgreSQL, chaves de assinatura JWT e credenciais de integração OAuth. |
| [`persistentvolumeclaim.yaml`](file:///c:/Users/Admin/Documentos/TV-DLOG/projeto-tv/k8s/persistentvolumeclaim.yaml) | `PersistentVolumeClaim` | Provisiona volumes de armazenamento persistente via `storageClassName: local-path`:<br>• `tvdlog-uploads-pvc` (10Gi para arquivos de mídia)<br>• `tvdlog-postgres-pvc` (5Gi para dados do banco) |
| [`deployment.yaml`](file:///c:/Users/Admin/Documentos/TV-DLOG/projeto-tv/k8s/deployment.yaml) | `Deployment` | Define a implantação dos containers:<br>• `tvdlog-bd` (PostgreSQL 15 com *health checks* `pg_isready`)<br>• `tvdlog-backend` (API FastAPI com *liveness/readiness probes* via HTTP GET `/docs`)<br>• `tvdlog-frontend` (SPA React com *probes* via TCP) |
| [`service.yaml`](file:///c:/Users/Admin/Documentos/TV-DLOG/projeto-tv/k8s/service.yaml) | `Service` | Expõe as aplicações na rede:<br>• `tvdlog-bd-service` (`ClusterIP` interno na porta 5432)<br>• `tvdlog-backend-service` (`LoadBalancer` expondo a API na porta 8200)<br>• `tvdlog-frontend-service` (`LoadBalancer` expondo a Web na porta 3200) |

---

## 🚀 Guias de Implantação e Execução

### 1. Implantação via Kubernetes (K3s / Cluster)

Para implantar a aplicação em um cluster Kubernetes funcional (ex: K3s):

1. **Garantir acesso ao cluster e contexto configurado**:
   ```bash
   kubectl cluster-info
   ```

2. **Aplicar os manifestos da aplicação**:
   ```bash
   kubectl apply -f k8s/
   ```

3. **Verificar o status dos recursos implantados**:
   ```bash
   kubectl get pods,services,pvc -l app.kubernetes.io/name=tvdlog
   ```

4. **Acessar a aplicação**:
   - **Frontend (Web TV / Admin)**: `http://<IP-DO-NODE>:3200`
   - **Backend (Documentação Swagger)**: `http://<IP-DO-NODE>:8200/docs`

---

### 2. Implantação via Docker Compose

Para rápida inicialização em ambiente isolado utilizando Docker Compose:

1. **Inicializar o banco de dados PostgreSQL**:
   ```bash
   docker compose -f docker/docker-compose.db.yml up -d
   ```

2. **Construir e iniciar os serviços de Backend e Frontend**:
   ```bash
   docker compose up -d --build
   ```

3. **Verificar os containers em execução**:
   ```bash
   docker compose ps
   ```

---

### 3. Execução em Ambiente de Desenvolvimento Local

#### Configuração do Backend (Python / FastAPI)
```bash
# Navegar até o diretório backend
cd backend

# Criar e ativar o ambiente virtual
python -m venv .venv
source .venv/bin/activate  # No Windows: .venv\Scripts\Activate.ps1

# Instalar as dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente e iniciar a API
export DATABASE_URL=postgresql://tvdlog:tvdlog123@localhost:5432/tvdlog
uvicorn app.main:app --reload --port 8000
```

#### Configuração do Frontend (Node.js / React)
```bash
# Navegar até o diretório frontend
cd frontend

# Instalar dependências e iniciar o servidor de desenvolvimento
npm install
npm run dev
```

---

## 📁 Estrutura do Repositório

```text
projeto-tv/
├── backend/                      # Aplicação Backend FastAPI
│   ├── app/
│   │   ├── main.py              # Ponto de entrada e configuração do FastAPI
│   │   ├── auth.py              # Autenticação JWT e hash de senhas
│   │   ├── database.py          # Conexão e inicialização do PostgreSQL
│   │   ├── models/              # Modelos de dados SQLAlchemy
│   │   ├── schemas/             # Schemas de validação Pydantic (DTOs)
│   │   ├── repositories/        # Camada de Acesso a Dados (Repositories)
│   │   ├── services/            # Camada de Regras de Negócio (Services)
│   │   ├── core/                # Injeção de dependências e WebSockets
│   │   └── routers/             # Controladores de rotas REST (API)
│   ├── Dockerfile               # Imagem Docker do backend
│   └── requirements.txt         # Dependências Python
│
├── frontend/                     # Aplicação Frontend React (SPA)
│   ├── src/
│   │   ├── pages/               # Páginas (TVDisplay, AdminDashboard, Login)
│   │   ├── components/          # Componentes reutilizáveis do painel
│   │   ├── App.jsx              # Roteamento e proteção de rotas
│   │   └── index.css            # Estilos globais e sintaxe Tailwind
│   ├── Dockerfile               # Imagem Docker do frontend
│   └── vite.config.js           # Configuração do Vite
│
├── k8s/                          # Manifestos de Implantação Kubernetes
│   ├── configmap.yaml           # Configurações não sensíveis de ambiente
│   ├── secret.yaml              # Credenciais e segredos de autenticação
│   ├── persistentvolumeclaim.yaml # Provisionamento de volumes (Uploads e DB)
│   ├── deployment.yaml          # Deployments do Postgres, Backend e Frontend
│   └── service.yaml             # Serviços de rede (LoadBalancer e ClusterIP)
│
├── docker/                       # Scripts auxiliares e composições adicionais
│   ├── db-backup.bat / .sh      # Scripts de backup do banco de dados
│   ├── db-restore.bat / .sh     # Scripts de restauração de dump SQL
│   └── docker-compose.db.yml    # Composição exclusiva para banco local
│
├── docker-compose.yml           # Orquestração de desenvolvimento com Docker
├── uploads/                     # Armazenamento local de mídias enviadas
├── GEMINI.md                    # Guia de arquitetura e contexto para agentes IA
└── README.md                    # Documentação principal do projeto
```

---

## 💾 Procedimentos de Backup e Restauração

O repositório possui utilitários automatizados localizados na pasta `docker/` para garantir a integridade dos dados:

- **Backup Manual**:
  - *Windows*: Executar o arquivo `docker/db-backup.bat`.
  - *Linux/macOS*: Executar `./docker/db-backup.sh`.
  - *Resultado*: Gera o dump SQL em `docker/db_backup.sql`.

- **Restauração de Backup**:
  - *Windows*: Executar `docker/db-restore.bat`.
  - *Linux/macOS*: Executar `./docker/db-restore.sh`.

- **Agendamento Automático (Windows Task Scheduler)**:
  - Executar `docker/schedule-backup.bat` como Administrador para configurar rotina semanal de backup.

---

## 🔑 Credenciais Padrão e Acessos

| Recurso | URL / Acesso | Credenciais |
| :--- | :--- | :--- |
| **Interface da TV** | `http://localhost:3100` (ou IP K8s:3200) | Acesso Público |
| **Painel de Administração** | `http://localhost:3100/admin` (ou IP K8s:3200/admin) | Usuário: `admin` \| Senha: `admin123` |
| **Documentação da API (Swagger)** | `http://localhost:8000/docs` (ou IP K8s:8200/docs) | N/A |
