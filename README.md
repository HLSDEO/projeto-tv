# PROJETO TV - Sistema de Sinalização Digital e Exibição de TV

Uma aplicação web completa para gerenciar e exibir conteúdo de mídia em telas de TV com funcionalidade integrada de notícias em tempo real. Perfeita para sinalização digital, painéis informativos e vitrines de mídia em escritórios, aeroportos e espaços públicos.

## ✨ Features

- **📺 Media Carousel**: Exiba imagens e vídeos em rotação automática na interface de TV em tela cheia.
- **🎛️ Admin Dashboard**: Interface amigável para carregar mídias, gerenciar a ordem de exibição e definir a duração das exibições.
- **📰 News Ticker**: Notícias em tempo real exibindo manchetes do feed RSS da G1 Globo.
- **⏱️ Dynamic Scheduling**: Tempo de exibição configurável para cada item de mídia.
- **🗓️ Scheduled Start**: Defina uma data e hora de início futuras para cada item de mídia — ele permanece na lista de reprodução, mas só aparece na TV quando esse momento chegar (vazio = exibido imediatamente).
- **🕐 Live Clock**: Exibição do relógio em tempo real no canto superior direito da tela da TV.
- **📱 Responsive Design**: Interface otimizada para tela cheia em televisores.

## 🏗️ Infraestrutura / Stack

### Backend
- **FastAPI**
- **PostgreSQL**
- **SQLAlchemy**
- **Uvicorn**

### Frontend
- **React 19**
- **Vite**
- **Tailwind CSS**
- **React Router**
- **Axios**

## 🚀 Início rápido

### Pré-requisitos
- Docker instalados em seu sistema (se windows Docker Desktop).

1. **Clona ou baixa o repositório**
   ```bash
   git clone <repository-url>
   cd projeto-tv
   ```

2. **Inicio dos serviços**
   
   Primeiro, inicie a rede e o banco de dados (que rodará continuamente):
   ```bash
   docker compose -f docker/docker-compose.db.yml up -d
   ```

   Em seguida, inicie o backend e o frontend:
   ```bash
   docker compose up -d --build
   ```


3. **Acesso a aplicação**
   - **Frontend**: http://localhost:3100
   - **Painel de administração**: http://localhost:3100/admin
   - **Backend API**: http://localhost:8000/docs (Swagger UI)
   - **Backend**: http://localhost:8000

4. **Usuário e senha do painel de ADMIN**
   - Username: `admin`
   - Password: `admin123`

## 📁 Estrutura do Projeto

```text
projeto-tv/
├── backend/                      # FastAPI backend application
│   ├── app/
│   │   ├── main.py              # Application entry point and configuration
│   │   ├── auth.py              # JWT authentication and password hashing
│   │   ├── database.py          # PostgreSQL session setup & DB init logic
│   │   ├── models/              # SQLAlchemy Database Models
│   │   │   ├── user.py
│   │   │   ├── media.py
│   │   │   └── settings.py
│   │   ├── schemas/             # Pydantic validation schemas (DTOs)
│   │   │   ├── user.py
│   │   │   ├── media.py
│   │   │   └── settings.py
│   │   ├── repositories/        # Data Access Layer (Concrete & Contracts)
│   │   │   ├── base.py
│   │   │   ├── user_repository.py
│   │   │   ├── media_repository.py
│   │   │   └── settings_repository.py
│   │   ├── services/            # Business Logic Layer (Concrete & Contracts)
│   │   │   ├── user_service.py
│   │   │   ├── media_service.py
│   │   │   ├── settings_service.py
│   │   │   └── external_service.py
│   │   ├── core/                # Global utilities and dependencies injection
│   │   │   ├── dependencies.py
│   │   │   └── websocket.py
│   │   └── routers/             # API Controllers (FastAPI Routes)
│   │       ├── admin.py
│   │       ├── media.py
│   │       ├── news.py
│   │       └── settings.py
│   ├── Dockerfile               # Docker image for backend
│   └── requirements.txt         # Python dependencies
│
├── frontend/                     # React frontend application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── TVDisplay.jsx    # Main TV display carousel component
│   │   │   ├── AdminDashboard.jsx # Admin control panel
│   │   │   └── Login.jsx        # Login page
│   │   ├── App.jsx              # Main application component
│   │   ├── main.jsx             # React entry point
│   │   └── index.css            # Global styles
│   ├── Dockerfile               # Docker image for frontend
│   ├── package.json             # Node.js dependencies
│   └── vite.config.js           # Vite configuration
│
├── docker-compose.yml           # Container orchestration configuration
├── uploads/                     # Persistent storage for uploaded media (created at runtime)
└── README.md                    # This file
```

### Para desenvolvedores

#### Executando localmente (sem Docker)

**Backend Setup:**
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL=postgresql://tvdlog:tvdlog123@localhost:5432/tv_dlog_db
export SECRET_KEY=your-secret-key

# Run the server
uvicorn app.main:app --reload --port 8000
```

**Frontend Setup:**
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Set environment variables
export VITE_API_URL=http://localhost:8000

# Run development server
npm run dev
```

**Database Setup:**
```bash
# Install and run PostgreSQL locally, or use Docker:
docker run -d --name postgres-db \
  -e POSTGRES_USER=tvdlog \
  -e POSTGRES_PASSWORD=tvdlog123 \
  -e POSTGRES_DB=tv_dlog_db \
  -p 5432:5432 \
  postgres:15
```


## 💾 Backup, Restauração e Agendamento Automático

Para evitar perda de dados em caso de queda de energia ou remoção acidental de volumes do Docker, o projeto conta com um sistema de backups integrados.

### 1. Como fazer backup manualmente
Para salvar o estado atual do banco (tabelas, configurações e cadastros de mídias), execute na pasta `docker/` do projeto:
* **No Windows:**
  Execute duas vezes ou execute no prompt o arquivo `docker/db-backup.bat`.
* **No Linux/macOS:**
  ```bash
  cd docker
  chmod +x db-backup.sh
  ./db-backup.sh
  ```
Isso gerará o arquivo `db_backup.sql` dentro da pasta `docker/`.

### 2. Como restaurar um backup
Para carregar o estado salvo no arquivo `docker/db_backup.sql` (útil após queda de energia ou inicialização limpa):
* **No Windows:**
  Execute o arquivo `docker/db-restore.bat` (será solicitado um `pause` no final para confirmar o sucesso).
* **No Linux/macOS:**
  ```bash
  cd docker
  chmod +x db-restore.sh
  ./db-restore.sh
  ```
*Nota: Este comando recriará o esquema `public` do Postgres e aplicará todas as criações de tabelas e inserções gravadas no dump.*

### 3. Agendamento Automático a cada 7 dias (Windows)
Para garantir que o banco esteja sempre sendo atualizado com novas mídias e modificações, você pode agendar o backup automático:
1. Abra um prompt de comando (CMD ou PowerShell) **como Administrador**.
2. Navegue até a pasta `docker/` do projeto:
   ```cmd
   cd docker
   ```
3. Execute o script de agendamento:
   ```cmd
   schedule-backup.bat
   ```
4. Pronto! O Agendador de Tarefas do Windows criará uma tarefa chamada `TV-DLOG-Backup-Semanal` para rodar o backup silenciosamente todo domingo às 03:00 da manhã.



## 🚀 Melhorias Futuras

- **Templates**: Layouts e temas pré-definidos para diferentes casos de uso.
- **Analytics**: Acompanhe as visualizações de mídia e o engajamento do usuário.
- **Multi-Display**: Suporte para gerenciar várias telas de TV a partir de um único painel de administração.
- **Calendar Integration**: Exibir eventos do calendário junto com a mídia

---
