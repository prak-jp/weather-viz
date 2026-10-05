# Weather Viz 🌦

Real-time weather data visualization with a **Python (FastAPI)** backend, **PostgreSQL** database, and **React** frontend.

## Stack

| Layer    | Tech                                                         |
|----------|--------------------------------------------------------------|
| Database | PostgreSQL 16, SQLAlchemy, Psycopg                           |
| Backend  | Python, FastAPI, Uvicorn, HTTPX                              |
| Frontend | React 19, Vite, Recharts, Leaflet                            |
| Container| Docker, Docker Compose, Nginx                                |
| Data     | [Open-Meteo API](https://open-meteo.com/) (free, no API key) |

## Features

- **PostgreSQL Database Storage**:
  - Saved Favorite Cities (quick bookmark & access)
  - Search Query History
  - Weather Observation Snapshots & Cache
- City search with geocoding
- Live current conditions (temp, humidity, wind, pressure)
- 48-hour temperature & humidity chart
- 7-day forecast
- Live map: city temperature marker, RainViewer radar, GloFAS river-risk circles
- Nepal main-river stations and a colour-coded risk sidebar
- Auto-refresh every 60 seconds

---

## 🚀 Quick Start with Docker (Recommended)

Make sure [Docker Desktop](https://www.docker.com/products/docker-desktop/) is running, then run:

```bash
docker compose up --build
```

That's it! Everything starts automatically:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **PostgreSQL**: Port `5432` (`user: weather_user`, `password: weather_password`, `db: weather_viz`)

To stop:
```bash
docker compose down
```

To remove all stored volumes as well:
```bash
docker compose down -v
```

---

## 🛠 Manual Local Development (Without Docker)

### 1. Backend

```bash
cd backend

# Windows
..\.venv\Scripts\activate

# macOS/Linux
source ../.venv/bin/activate

pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --port 8000
```

> **Note**: If PostgreSQL is running locally, set `DATABASE_URL=postgresql://user:password@localhost:5432/weather_viz`. If not running, the backend automatically provides a resilient fallback to local SQLite for development.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Project Structure

```
weather-viz/
├── docker-compose.yml       # PostgreSQL, Backend, Frontend orchestration
├── .dockerignore
├── .env.example
├── backend/
│   ├── Dockerfile           # FastAPI container image
│   ├── requirements.txt     # Python dependencies with SQLAlchemy & psycopg
│   └── app/
│       ├── main.py          # FastAPI routes & lifespan
│       ├── database.py      # SQLAlchemy connection & session manager
│       ├── models.py        # PostgreSQL tables (Favorites, History, WeatherLog)
│       ├── schemas.py       # Pydantic schemas
│       ├── crud.py          # Database operations
│       ├── weather.py       # Open-Meteo forecast/geocoding
│       ├── flood.py         # GloFAS river-discharge risk
│       └── rivers.py        # Nepal main-stem stations
└── frontend/
    ├── Dockerfile           # Multi-stage React + Nginx build
    ├── nginx.conf           # Reverse proxy configuration
    ├── package.json
    └── src/
        ├── App.jsx          # UI with Favorites & Database status
        ├── api.js           # API client with database endpoints
        └── components/
```
