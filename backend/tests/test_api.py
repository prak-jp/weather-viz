import os
import pytest
from fastapi.testclient import TestClient

# Use SQLite by default for quick local tests if no custom DATABASE_URL is set
if "DATABASE_URL" not in os.environ:
    os.environ["DATABASE_URL"] = "sqlite:///./test_weather.db"

from app.main import app
from app.database import Base, engine


@pytest.fixture(autouse=True)
def setup_and_teardown_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if engine.url.drivername.startswith("sqlite") and os.path.exists("./test_weather.db"):
        try:
            os.remove("./test_weather.db")
        except OSError:
            pass


def test_health_check():
    with TestClient(app) as client:
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"


def test_db_stats():
    with TestClient(app) as client:
        response = client.get("/api/db/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "connected"
        assert "favorite_cities" in data["tables"]


def test_favorites_crud():
    with TestClient(app) as client:
        # 1. Create favorite
        fav_data = {
            "name": "Pokhara",
            "admin1": "Gandaki",
            "country": "Nepal",
            "latitude": 28.2096,
            "longitude": 83.9856,
        }
        create_res = client.post("/api/favorites", json=fav_data)
        assert create_res.status_code == 200
        fav = create_res.json()
        assert fav["name"] == "Pokhara"
        fav_id = fav["id"]

        # 2. List favorites
        list_res = client.get("/api/favorites")
        assert list_res.status_code == 200
        items = list_res.json()
        assert len(items) == 1
        assert items[0]["id"] == fav_id

        # 3. Delete favorite
        del_res = client.delete(f"/api/favorites/{fav_id}")
        assert del_res.status_code == 200
        assert del_res.json()["deleted"] is True

        # 4. Verify list is empty
        list_res2 = client.get("/api/favorites")
        assert list_res2.status_code == 200
        assert len(list_res2.json()) == 0
