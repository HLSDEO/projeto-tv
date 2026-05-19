# Tarefas do Projeto: TV-DLOG

- [x] Estrutura inicial do projeto (Pastas backend, frontend, docker-compose).
- [/] Backend (FastAPI):
  - [x] Arquivo Dockerfile e `requirements.txt`.
  - [x] Conexão com ArangoDB (`database.py`).
  - [x] Sistema de Autenticação (Login com JWT).
  - [ ] Rotas CRUD para Mídias (Upload, Listar, Editar, Deletar).
  - [ ] Rotas para Configurações (Habilitar/Desabilitar Notícias).
  - [ ] Rota para extrair notícias (via RSS feed gratuito).
- [x] Frontend (React + Vite + Tailwind):
  - [x] Criação do projeto base com Vite e TailwindCSS.
  - [x] Arquivo Dockerfile.
  - [x] Componentes Base (Relógio, Logo).
  - [x] Tela de Login (Admin).
  - [x] Painel de Administração (Upload, Tabela de mídias, Configurações).
  - [x] Tela Principal da TV (Carrossel, Ticker de Notícias).
- [x] Configuração do `docker-compose.yml` unificando Banco, Backend e Frontend.
- [x] Testes e Validação do fluxo completo.
