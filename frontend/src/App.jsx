import { useState, useEffect, useCallback } from "react";
import {
  searchCities,
  fetchWeather,
  fetchFavorites,
  addFavorite,
  removeFavorite,
  fetchDbStats,
} from "./api";
import SearchBar from "./components/SearchBar";
import CurrentWeather from "./components/CurrentWeather";
import HourlyChart from "./components/HourlyChart";
import DailyForecast from "./components/DailyForecast";
import LiveMap from "./components/LiveMap";

const DEFAULT_CITY = {
  name: "Kathmandu",
  country: "Nepal",
  latitude: 27.7172,
  longitude: 85.324,
};

const REFRESH_MS = 30_000;

export default function App() {
  const [city, setCity] = useState(DEFAULT_CITY);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [dbStatus, setDbStatus] = useState(null);

  const loadFavorites = useCallback(async () => {
    try {
      const data = await fetchFavorites();
      setFavorites(data);
    } catch {
      // Backend or DB not available
    }
  }, []);

  const loadDbStatus = useCallback(async () => {
    try {
      const data = await fetchDbStats();
      setDbStatus(data);
    } catch {
      setDbStatus(null);
    }
  }, []);

  const loadWeather = useCallback(async (c) => {
    setError(null);
    try {
      const data = await fetchWeather(c.latitude, c.longitude, c.name);
      setWeather(data);
      setLastUpdated(new Date());
    } catch {
      setError("Could not fetch weather data. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
    loadDbStatus();
  }, [loadFavorites, loadDbStatus]);

  useEffect(() => {
    setLoading(true);
    loadWeather(city);
  }, [city, loadWeather]);

  useEffect(() => {
    const id = setInterval(() => loadWeather(city), REFRESH_MS);
    return () => clearInterval(id);
  }, [city, loadWeather]);

  const handleSearch = (q) => searchCities(q);
  const handleSelectCity = (c) => setCity(c);

  const isFavorite = favorites.some(
    (f) =>
      Math.abs(f.latitude - city.latitude) < 0.05 &&
      Math.abs(f.longitude - city.longitude) < 0.05
  );

  const handleToggleFavorite = async () => {
    try {
      const existing = favorites.find(
        (f) =>
          Math.abs(f.latitude - city.latitude) < 0.05 &&
          Math.abs(f.longitude - city.longitude) < 0.05
      );
      if (existing) {
        await removeFavorite(existing.id);
        setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
      } else {
        const created = await addFavorite(city);
        setFavorites((prev) => [created, ...prev]);
      }
    } catch (e) {
      console.error("Failed to toggle favorite:", e);
    }
  };

  const handleRemoveFavorite = async (e, favId) => {
    e.stopPropagation();
    try {
      await removeFavorite(favId);
      setFavorites((prev) => prev.filter((f) => f.id !== favId));
    } catch (e) {
      console.error("Failed to delete favorite:", e);
    }
  };

  const tz = weather?.location?.timezone ?? "UTC";

  return (
    <div className="app">
      <div className="gradient-bg" />

      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-icon">🌦</span>
            <h1>Weather Viz</h1>
            {dbStatus && (
              <span
                className={`db-badge ${dbStatus.status.startsWith("connected") ? "connected" : ""}`}
                title={`Database dialect: ${dbStatus.dialect}, DB: ${dbStatus.database}`}
              >
                🐘 {dbStatus.status.startsWith("connected") ? "PostgreSQL" : "DB Offline"}
              </span>
            )}
          </div>
          <SearchBar onSearch={handleSearch} onSelect={handleSelectCity} currentCity={city} />
        </div>
      </header>

      <main className="main">
        {favorites.length > 0 && (
          <div className="favorites-bar">
            <span className="favorites-label">⭐ Favorites:</span>
            {favorites.map((fav) => {
              const isActive =
                Math.abs(fav.latitude - city.latitude) < 0.05 &&
                Math.abs(fav.longitude - city.longitude) < 0.05;
              return (
                <div
                  key={fav.id}
                  className={`fav-chip ${isActive ? "active" : ""}`}
                  onClick={() => setCity(fav)}
                >
                  <span>{fav.name}</span>
                  <button
                    className="fav-chip-del"
                    title="Remove favorite"
                    onClick={(e) => handleRemoveFavorite(e, fav.id)}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {loading && !weather && (
          <div className="loading">
            <div className="spinner" />
            <p>Loading weather…</p>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={() => loadWeather(city)}>Retry</button>
          </div>
        )}

        {weather && (
          <>
            <div className="location-bar">
              <div>
                <h2>
                  {city.name}
                  {city.admin1 ? `, ${city.admin1}` : ""}
                  {city.country ? ` · ${city.country}` : ""}
                </h2>
                {lastUpdated && (
                  <span className="updated">
                    Updated {lastUpdated.toLocaleTimeString()}
                    <button
                      type="button"
                      className={`refresh-weather-btn ${isRefreshing ? "spinning" : ""}`}
                      onClick={async () => {
                        setIsRefreshing(true);
                        await loadWeather(city);
                        setIsRefreshing(false);
                      }}
                      title="Force refresh live weather data now"
                    >
                      <span className="refresh-icon">🔄</span> Refresh
                    </button>
                  </span>
                )}

              </div>
              <button
                className={`fav-toggle-btn ${isFavorite ? "is-fav" : ""}`}
                onClick={handleToggleFavorite}
                title={isFavorite ? "Remove from favorites" : "Save to favorites"}
              >
                {isFavorite ? "★ Saved in Favorites" : "☆ Add to Favorites"}
              </button>
            </div>

            <CurrentWeather current={weather.current} />
            <LiveMap city={city} weather={weather} onSelectCity={handleSelectCity} />
            <HourlyChart hourly={weather.hourly} timezone={tz} />
            <DailyForecast daily={weather.daily} timezone={tz} />
          </>
        )}
      </main>
    </div>
  );
}
