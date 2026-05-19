# TV DLOG - Digital Signage & TV Display System

A full-stack web application for managing and displaying media content on TV screens with integrated news ticker functionality. Perfect for digital signage, information displays, and media showcases in offices, airports, and public spaces.

## ✨ Features

- **📺 Media Carousel**: Display images and videos in automatic rotation on full-screen TV interface
- **🎛️ Admin Dashboard**: User-friendly interface to upload media, manage display order, and set display durations
- **📰 News Ticker**: Real-time news ticker displaying headlines from G1 Globo RSS feed
- **🔐 Authentication**: Secure login system protecting admin features with JWT tokens
- **⏱️ Dynamic Scheduling**: Configurable display time for each media item
- **🕐 Live Clock**: Real-time clock display in the top-right corner of TV view
- **📱 Responsive Design**: Full-screen optimized interface for TV displays
- **🎨 Modern UI**: Clean, intuitive interface built with React and Tailwind CSS

## 🏗️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework for building APIs
- **ArangoDB** - NoSQL database for flexible data management
- **Uvicorn** - ASGI server for running the FastAPI application
- **JWT** - JSON Web Tokens for secure authentication

### Frontend
- **React 19** - Modern JavaScript library for building user interfaces
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for styling
- **React Router** - Client-side routing and navigation
- **Axios** - HTTP client for API communication

### Infrastructure
- **Docker** - Containerization for consistent environments
- **Docker Compose** - Orchestration for multi-container applications

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed on your system
  - [Install Docker](https://docs.docker.com/get-docker/)
  - [Install Docker Compose](https://docs.docker.com/compose/install/)

### Running with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd projeto-tv
   ```

2. **Start all services**
   ```bash
   docker-compose up
   ```

   This command will:
   - Build and start the FastAPI backend (http://localhost:8000)
   - Build and start the React frontend (http://localhost:5173)
   - Start the ArangoDB database (http://localhost:8529)
   - Create persistent volumes for uploads and database data

3. **Access the application**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:8000
   - **ArangoDB Console**: http://localhost:8529 (username: `root`, password: `rootpassword`)

4. **Login to the admin dashboard**
   - Username: `admin`
   - Password: `admin123`

5. **Start using the app**
   - Upload media files from the admin dashboard
   - Set display durations for each item
   - Toggle news display on/off
   - The TV Display screen will automatically rotate through your media with the news ticker at the bottom

## 📁 Project Structure

```
projeto-tv/
├── backend/                      # FastAPI backend application
│   ├── app/
│   │   ├── main.py              # Application entry point and authentication routes
│   │   ├── auth.py              # JWT authentication and password hashing
│   │   ├── database.py          # ArangoDB database connection
│   │   └── routers/
│   │       ├── media.py         # Media upload and management endpoints
│   │       ├── settings.py      # Application settings endpoints
│   │       └── news.py          # News fetching from RSS feed
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

## ⚙️ Configuration

### Environment Variables

The application uses the following environment variables (defined in `docker-compose.yml`):

| Variable | Default | Description |
|----------|---------|-------------|
| `ARANGO_URL` | `http://arangodb:8529` | ArangoDB connection URL |
| `ARANGO_ROOT_PASSWORD` | `rootpassword` | ArangoDB root password |
| `SECRET_KEY` | `minha_chave_secreta_jwt_super_segura` | JWT secret key for token signing |
| `VITE_API_URL` | `http://localhost:8000` | API URL for frontend |

### Customizing Configuration

To change these values, edit the `docker-compose.yml` file before running `docker-compose up`.

### Admin Dashboard Settings

Once logged in, you can configure:
- **News Display**: Toggle the news ticker on/off
- **Media Display Order**: Drag to reorder media items
- **Display Duration**: Set how long each media item displays (in seconds)
- **Activate/Deactivate**: Control which media items are shown

## 📡 API Reference

All API endpoints require authentication (except login endpoint).

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/x-www-form-urlencoded

username=admin&password=admin123
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

**Use this token in subsequent requests:**
```http
Authorization: Bearer <access_token>
```

### Media Management

#### Get All Media
```http
GET /api/media
```

**Response:**
```json
[
  {
    "_key": "12345",
    "filename": "a1b2c3d4.jpg",
    "original_name": "my-image.jpg",
    "type": "image",
    "duration": 10,
    "active": true,
    "order": 1,
    "uploaded_at": "2026-05-19T10:30:00",
    "url": "/uploads/a1b2c3d4.jpg"
  }
]
```

#### Upload Media
```http
POST /api/media
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <binary-file>
duration: 10
```

**Supported Formats:**
- **Images**: jpg, jpeg, png, gif, webp, bmp
- **Videos**: mp4, webm, ogg, mov, avi

**Response:**
```json
{
  "_key": "12345",
  "filename": "a1b2c3d4.jpg",
  "original_name": "my-image.jpg",
  "type": "image",
  "duration": 10,
  "active": true,
  "order": 1,
  "uploaded_at": "2026-05-19T10:30:00",
  "url": "/uploads/a1b2c3d4.jpg"
}
```

#### Update Media
```http
PUT /api/media/{media_id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "duration": 15,
  "active": true,
  "order": 2
}
```

#### Delete Media
```http
DELETE /api/media/{media_id}
Authorization: Bearer <token>
```

### Settings

#### Get Settings
```http
GET /api/settings
```

**Response:**
```json
{
  "news_enabled": true
}
```

#### Update Settings
```http
PUT /api/settings
Content-Type: application/json
Authorization: Bearer <token>

{
  "news_enabled": false
}
```

### News

#### Get Latest News
```http
GET /api/news
```

**Response:**
```json
{
  "news": [
    "Breaking: New Policy Announced",
    "Technology: AI Advances Rapidly",
    "Business: Market Updates",
    "Science: New Discovery",
    "Sports: Team Wins Championship"
  ]
}
```

## 👥 Usage Guide

### For Non-Technical Users

#### Accessing the Admin Dashboard
1. Open http://localhost:5173 in your web browser
2. Login with username `admin` and password `admin123`
3. You're now in the admin dashboard

#### Uploading Media
1. Click the **"Upload Media"** button in the admin dashboard
2. Select an image or video file from your computer
3. Set the **display duration** (how many seconds to show this item)
4. Click **"Upload"**
5. Your media will be added to the carousel

#### Managing Display Order
1. In the admin dashboard, you'll see all uploaded media
2. Drag media items to reorder them
3. The carousel will display items in this order

#### Setting Display Duration
1. For each media item, you can adjust the **duration** (in seconds)
2. Higher values mean the item displays longer
3. Typical range: 10-30 seconds per item

#### Toggling News Display
1. In the admin dashboard, find the **news toggle** switch
2. Turn it **on** to display news ticker
3. Turn it **off** to hide the news ticker

#### Viewing the TV Display
1. Click the **"TV Display"** link to see the full-screen carousel
2. Media items will rotate automatically based on their durations
3. The current time is shown in the top-right corner
4. News headlines appear at the bottom (if enabled)

### For Developers

#### Running Locally (Without Docker)

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
export ARANGO_URL=http://localhost:8529
export ARANGO_ROOT_PASSWORD=rootpassword
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
# Install and run ArangoDB locally, or use Docker:
docker run -d --name arangodb \
  -e ARANGO_ROOT_PASSWORD=rootpassword \
  -p 8529:8529 \
  arangodb:3.11
```

#### Modifying the TV Carousel Component

The carousel is located at `frontend/src/pages/TVDisplay.jsx`. To customize:

```jsx
// Adjust carousel animation duration
const carouselDuration = 5000; // milliseconds

// Modify styling
// The component uses Tailwind CSS classes

// Add custom effects
// (e.g., fade transitions, zoom effects, etc.)
```

#### Adding New API Endpoints

Create a new router file in `backend/app/routers/`:

```python
# backend/app/routers/myfeature.py
from fastapi import APIRouter, Depends
from app.auth import get_current_user

router = APIRouter(prefix="/api/myfeature", tags=["myfeature"])

@router.get("/")
def get_data(username: str = Depends(get_current_user)):
    # Your implementation here
    return {"data": "value"}
```

Then include it in `backend/app/main.py`:

```python
from app.routers import myfeature
app.include_router(myfeature.router)
```

#### Customizing Styling

The application uses Tailwind CSS. Customize styles by:

1. Modifying class names in component files
2. Adding custom CSS in `frontend/src/index.css`
3. Creating custom Tailwind components

#### Database Queries

Query the database using AQL (ArangoDB Query Language):

```python
from app.database import get_db

db = get_db()
cursor = db.aql.execute('FOR m IN media SORT m.order ASC RETURN m')
media_list = [doc for doc in cursor]
```

## 🔧 Troubleshooting

### Port Conflicts
If ports 5173, 8000, or 8529 are already in use:

**Option 1**: Change ports in `docker-compose.yml`
```yaml
ports:
  - "3001:5173"  # Changed from 5173 to 3001
```

**Option 2**: Stop conflicting services
```bash
# Find services using the port
lsof -i :8000

# Kill the service
kill -9 <PID>
```

### Database Connection Error
If you see "Cannot connect to ArangoDB":

1. Ensure ArangoDB is running: `docker-compose ps`
2. Check the connection URL matches `ARANGO_URL` setting
3. Verify the root password is correct

### CORS Errors
If the frontend can't reach the backend:

1. Verify `VITE_API_URL` environment variable is set correctly
2. Check that backend is running on the correct port
3. Ensure CORS middleware is enabled in `backend/app/main.py`

### Login Issues
If you can't login with default credentials:

1. Reset admin credentials by clearing the `users` collection in ArangoDB
2. Re-run the application to reinitialize with default credentials
3. Check browser console for error messages

### View Application Logs
```bash
# View logs from Docker containers
docker-compose logs backend    # Backend logs
docker-compose logs frontend   # Frontend logs
docker-compose logs arangodb   # Database logs

# Follow logs in real-time
docker-compose logs -f backend
```

### Viewing Network Requests
1. Open browser DevTools (F12)
2. Go to the Network tab
3. Check API calls and responses

## 🎯 How It Works

1. **User uploads media** → File is saved to `/uploads` directory and metadata stored in ArangoDB
2. **Admin sets duration** → Each media item has a configurable display time
3. **User reorders media** → Display order is updated in the database
4. **TV Display fetches media** → Requests all active media from the backend
5. **Carousel rotates** → Each item displays for its configured duration
6. **News ticker fetches** → Every 5 minutes, new headlines are fetched from G1 Globo
7. **Live updates** → Changes in admin dashboard are reflected on TV display in real-time

## 📝 License

This project is provided as-is for educational and commercial use.

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For issues, questions, or suggestions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review existing GitHub issues
3. Create a new issue with detailed information about your problem

## 🚀 Future Enhancements

Potential features for future versions:

- **Scheduling**: Schedule media playback for specific dates and times
- **Templates**: Pre-designed layouts and themes for different use cases
- **Analytics**: Track media views and user engagement
- **Multi-Display**: Support for managing multiple TV displays from one admin panel
- **Webhooks**: Integrate with external systems and APIs
- **Advanced Search**: Filter and search media by tags and metadata
- **Backup & Restore**: Automated backup of settings and media
- **API Keys**: Multiple admin accounts with different permissions
- **Mobile App**: Native mobile app for remote administration
- **Calendar Integration**: Display calendar events alongside media

---

**Built with ❤️ for digital signage and media displays**
