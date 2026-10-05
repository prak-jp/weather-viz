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

  const [provider, setProvider] = useState("auto");

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

  const loadWeather = useCallback(async (c, p = provider) => {
    setError(null);
    try {
      const data = await fetchWeather(c.latitude, c.longitude, c.name, p);
      setWeather(data);
      setLastUpdated(new Date());
    } catch {
      setError("Could not fetch weather data. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [provider]);

  const handleSelectProvider = (newProvider) => {
    setProvider(newProvider);
    setLoading(true);
    loadWeather(city, newProvider);
  };

  useEffect(() => {
    loadFavorites();
    loadDbStatus();
  }, [loadFavorites, loadDbStatus]);

  useEffect(() => {
    setLoading(true);
    loadWeather(city, provider);
  }, [city, provider, loadWeather]);

  useEffect(() => {
    const id = setInterval(() => loadWeather(city, provider), REFRESH_MS);
    return () => clearInterval(id);
  }, [city, provider, loadWeather]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadWeather(city, provider);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [city, provider, loadWeather]);

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
          <div className="header-controls">
            <SearchBar onSearch={handleSearch} onSelect={handleSelectCity} currentCity={city} />
            <button
              type="button"
              className={`header-refresh-btn ${isRefreshing ? "spinning" : ""}`}
              onClick={handleRefresh}
              title="Force refresh live weather data now"
            >
              <span className="refresh-icon">🔄</span>
              <span className="refresh-btn-text">
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </span>
            </button>
          </div>
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
                <div className="location-meta-row">
                  {lastUpdated && (
                    <span className="updated-badge">
                      🕒 Live: {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                  {weather?.provider_name && (
                    <span
                      className="active-provider-badge"
                      title={`Model: ${weather.model || "Standard"}`}
                    >
                      {weather.provider === "yr_norway" ? "🇳🇴" : "🌐"} {weather.provider_name}
                      {weather.auto_selected && <span className="auto-pill"> · Smart Auto</span>}
                    </span>
                  )}
                </div>
              </div>
              <div className="location-actions">
                {/* 📡 Dual-Source Provider Switcher */}
                <div className="provider-switch-group">
                  <span className="provider-group-label">Source:</span>
                  <button
                    type="button"
                    className={`provider-pill ${provider === "auto" ? "active" : ""}`}
                    onClick={() => handleSelectProvider("auto")}
                    title="Intelligent Auto-Select: Uses MET Norway (Yr) for Nepal & Himalayas, Open-Meteo worldwide"
                  >
                    ⚡ Auto (Smart)
                  </button>
                  <button
                    type="button"
                    className={`provider-pill ${provider === "yr" ? "active" : ""}`}
                    onClick={() => handleSelectProvider("yr")}
                    title="Force Yr (MET Norway) European ECMWF model"
                  >
                    🇳🇴 Yr (MET Norway)
                  </button>
                  <button
                    type="button"
                    className={`provider-pill ${provider === "open_meteo" ? "active" : ""}`}
                    onClick={() => handleSelectProvider("open_meteo")}
                    title="Force Open-Meteo Ensemble with 15-min nowcast"
                  >
                    🌐 Open-Meteo
                  </button>
                </div>

                <button
                  type="button"
                  className={`primary-refresh-btn ${isRefreshing ? "spinning" : ""}`}
                  onClick={handleRefresh}
                  title="Force refresh live weather data now"
                >
                  <span className="refresh-icon">🔄</span>
                  <span>{isRefreshing ? "Refreshing..." : "Refresh Weather"}</span>
                </button>
                <button
                  className={`fav-toggle-btn ${isFavorite ? "is-fav" : ""}`}
                  onClick={handleToggleFavorite}
                  title={isFavorite ? "Remove from favorites" : "Save to favorites"}
                >
                  {isFavorite ? "★ Saved in Favorites" : "☆ Add to Favorites"}
                </button>
              </div>
            </div>

            <CurrentWeather current={weather.current} />
            <LiveMap
              city={city}
              weather={weather}
              onSelectCity={handleSelectCity}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
            <HourlyChart hourly={weather.hourly} timezone={tz} />
            <DailyForecast daily={weather.daily} timezone={tz} />

            {/* 🔄 Floating Quick Refresh Pill (always accessible when scrolling) */}
            <div className="floating-refresh-container">
              <button
                type="button"
                className={`floating-refresh-btn ${isRefreshing ? "spinning" : ""}`}
                onClick={handleRefresh}
                title="Click to force refresh live weather data"
              >
                <span className="refresh-icon">🔄</span>
                <span className="floating-btn-text">
                  {isRefreshing ? "Refreshing..." : "Refresh Live"}
                </span>
                {lastUpdated && (
                  <span className="floating-btn-time">
                    {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
