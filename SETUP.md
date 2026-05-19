# 🚀 Setup & First Run Guide

Quick start guide for the TV DLOG application with user management.

## Prerequisites

- Docker and Docker Compose installed
- Git (to clone the repository)

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd projeto-tv
```

## Step 2: Start the Application

```bash
docker-compose up
```

This command will:
1. Build the Docker images
2. Start ArangoDB database with memory limit configuration
3. Start FastAPI backend (automatically initializes database and creates default admin user)
4. Build and start React frontend

**Expected output in backend logs (wait ~30 seconds):**
```
✅ Connected to ArangoDB
📁 Database 'tv_dlog_db' created
📋 Collection 'media' created
📋 Collection 'settings' created
📋 Collection 'users' created
👤 Default admin user created (username: admin, password: admin123)
⚙️ Global settings created
Uvicorn running on http://0.0.0.0:8000
```

## Step 3: Access the Application

Once you see the initialization messages, you can access:

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | - |
| Backend API | http://localhost:8000 | - |
| API Docs | http://localhost:8000/docs | - |
| Database | http://localhost:8529 | root / rootpassword |

## Step 4: Login

1. Go to http://localhost:5173
2. Login with default credentials:
   - **Username**: `admin`
   - **Password**: `admin123`

3. You should see the admin dashboard

## Step 5: Test Upload Media

1. Click "Upload Media" button
2. Select an image or video file
3. Set display duration (e.g., 10 seconds)
4. Click "Upload"
5. Your media should appear in the list

## Step 6: View TV Display

1. Click "TV Display" to view the carousel
2. Media should rotate automatically
3. News ticker should display at the bottom (if enabled)

## Verification

### Check Backend Logs

```bash
docker-compose logs backend
```

Look for these success indicators:
- ✅ Connected to ArangoDB
- 👤 Default admin user created
- ✅ Database initialization complete

### Test Login via API

```bash
# On Linux/Mac
bash test_auth.sh

# On Windows (requires bash)
bash test_auth.sh http://localhost:8000
```

This script will test:
- Admin login
- List users
- Create new user
- Test new user login
- API access

### Access API Documentation

Go to http://localhost:8000/docs to see interactive Swagger documentation of all API endpoints.

## Troubleshooting

### Backend fails to start

Check the logs:
```bash
docker-compose logs backend
```

**Common issues:**
- Port 8000 already in use
- ArangoDB not starting properly
- Docker build failed

### Database initialization fails

Restart the backend container:
```bash
docker-compose restart backend
```

Or check the backend logs:
```bash
docker-compose logs backend
```

### Login doesn't work

Restart the backend to trigger database initialization:
```bash
docker-compose restart backend
```

### Reset everything

```bash
# Stop containers
docker-compose down

# Remove volumes
docker volume rm projeto-tv_arango_data
docker volume rm projeto-tv_upload_data

# Start fresh
docker-compose up
```

## Creating Additional Users

Once logged in as admin, you can create more users:

```bash
# Get admin token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123" \
  | jq -r '.access_token')

# Create new user
curl -X POST http://localhost:8000/api/admin/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "operator1",
    "password": "operator123"
  }'
```

See [USERS.md](USERS.md) for detailed user management guide.

## Next Steps

1. Change the default admin password:
   - See [USERS.md](USERS.md) for instructions

2. Create additional user accounts for operators

3. Read the full [README.md](README.md) for:
   - Complete API reference
   - Advanced configuration
   - Development setup
   - Deployment options

4. Check [USERS.md](USERS.md) for:
   - User management
   - Security best practices
   - Database structure

## Default Ports

| Service | Port | Environment Variable |
|---------|------|----------------------|
| Frontend | 5173 | - |
| Backend | 8000 | - |
| ArangoDB | 8529 | - |

To use different ports, edit `docker-compose.yml` before running `docker-compose up`.

## File Structure

```
projeto-tv/
├── README.md           # Main documentation
├── USERS.md           # User management guide
├── SETUP.md           # This file
├── test_auth.sh       # Authentication test script
├── init_db.py         # Database initialization script
├── docker-compose.yml # Container orchestration
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── main.py
│   │   ├── auth.py
│   │   ├── database.py
│   │   └── routers/
│   ├── requirements.txt
│   └── Dockerfile
└── frontend/          # React frontend
    ├── src/
    ├── package.json
    ├── vite.config.js
    └── Dockerfile
```

## Support

For detailed information, see:
- **Getting Started**: [SETUP.md](SETUP.md) (this file)
- **User Management**: [USERS.md](USERS.md)
- **General Documentation**: [README.md](README.md)

## Quick Commands

```bash
# Start application
docker-compose up

# View logs
docker-compose logs -f backend

# Stop application
docker-compose down

# Reset database
docker-compose down -v && docker-compose up

# Restart backend (triggers database initialization)
docker-compose restart backend

# Test authentication
bash test_auth.sh

# Execute shell in container
docker-compose exec backend bash

# View running containers
docker-compose ps
```

---

**Ready to start?** Run `docker-compose up` and go to http://localhost:5173!
