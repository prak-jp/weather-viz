import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchMapOverlay, fetchNepalRivers, fetchWeather } from "../api";
import { RISK_COLORS, RISK_LABELS, tempColor } from "../risk";
import { weatherIcon } from "../utils";
import RiskSidebar from "./RiskSidebar";
import LocalizedRainOverlay from "./LocalizedRainOverlay";
import { NEPAL_RIVER_PATHS } from "../data/nepalRivers";
import { NEPAL_BORDER_COORDINATES } from "../data/nepalBoundary";

// Fix Leaflet default marker icon broken in Vite/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const MAP_THEMES = {
  googleHybrid: {
    name: "🌍 Google Hybrid (Satellite + Roads)",
    url: "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    maxZoom: 20,
    attribution: '&copy; <a href="https://maps.google.com/">Google Maps</a>',
  },
  googleStreets: {
    name: "🗺️ Google Roads & Cities",
    url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    maxZoom: 20,
    attribution: '&copy; <a href="https://maps.google.com/">Google Maps</a>',
  },
  googleTerrain: {
    name: "⛰️ Google Terrain (Mountains)",
    url: "https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    maxZoom: 20,
    attribution: '&copy; <a href="https://maps.google.com/">Google Maps</a>',
  },
  satellite: {
    name: "🛰️ Esri Clarity Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    subdomains: [],
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
  },
  clear: {
    name: "🏙️ Carto Clean Vector",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    subdomains: ["a", "b", "c", "d"],
    maxZoom: 20,
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
};

function Recenter({ lat, lon, focus }) {
  const map = useMap();
  useEffect(() => {
    if (focus) {
      const targetLat =
        focus.latitude ??
        focus.stationLat ??
        (focus.coordinates ? focus.coordinates[0][0] : lat);
      const targetLon =
        focus.longitude ??
        focus.stationLon ??
        (focus.coordinates ? focus.coordinates[0][1] : lon);
      map.flyTo([targetLat, targetLon], 9, { duration: 0.65 });
    } else {
      map.setView([lat, lon], 8);
    }
  }, [lat, lon, focus, map]);
  return null;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function TempMarker({ position, temp, label }) {
  const icon = useMemo(
    () =>
      L.divIcon({
        className: "temp-marker",
        html: `<div class="temp-marker-bubble">${Math.round(temp)}°</div>`,
        iconSize: [56, 56],
        iconAnchor: [28, 28],
      }),
    [temp],
  );

  return (
    <Marker position={position} icon={icon}>
      <Popup>{label}</Popup>
    </Marker>
  );
}

export default function LiveMap({ city, weather, onSelectCity, onRefresh, isRefreshing }) {
  const lat = city.latitude;
  const lon = city.longitude;
  const current = weather?.current;
  const inNepal =
    city.country === "Nepal" ||
    (lat >= 26.3 && lat <= 30.55 && lon >= 80 && lon <= 88.35);

  const [overlay, setOverlay] = useState(null);
  const [nepal, setNepal] = useState(null);
  const [error, setError] = useState(null);
  const [focus, setFocus] = useState(null);

  // 📡 HD Radar State
  const [radarHost, setRadarHost] = useState(null);
  const [radarFrames, setRadarFrames] = useState([]);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isRadarPlaying, setIsRadarPlaying] = useState(false);
  const [radarColorScheme, setRadarColorScheme] = useState(4); // 4 = Vibrant Weather Channel Doppler
  const [radarOpacity, setRadarOpacity] = useState(0.78);
  const [isMapRefreshing, setIsMapRefreshing] = useState(false);

  // Map tile style state (Default to Google Hybrid)
  const [mapTheme, setMapTheme] = useState("googleHybrid");

  // Map Click Inspection State
  const [inspectPoint, setInspectPoint] = useState(null);

  // Check if current location or inspected point has active rain
  const currentHasRain =
    (current?.precipitation ?? 0) > 0 ||
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(
      current?.weather_code
    );
  const inspectHasRain =
    (inspectPoint?.weather?.current?.precipitation ?? 0) > 0 ||
    [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(
      inspectPoint?.weather?.current?.weather_code
    );
  const isRaining = currentHasRain || inspectHasRain;

  // Active Rain Zones for Localized Rain Effect (strictly pinned to raining areas)
  const activeRainZones = useMemo(() => {
    const list = [];
    if (currentHasRain) {
      list.push({
        lat,
        lon,
        name: city.name,
        radiusKm: 24,
        precip: current?.precipitation ?? 1.5,
      });
    }
    if (inspectPoint && inspectHasRain) {
      list.push({
        lat: inspectPoint.lat,
        lon: inspectPoint.lon,
        name: "Inspected Location",
        radiusKm: 18,
        precip: inspectPoint.weather?.current?.precipitation ?? 1.5,
      });
    }
    return list;
  }, [currentHasRain, inspectHasRain, lat, lon, city.name, inspectPoint, current?.precipitation]);

  const [layers, setLayers] = useState({
    temp: true,
    radar: true,
    liveRainCloud: true, // Live Doppler cloud cluster over city
    rainEffect: true,
    nepalBorder: true,
    localRisk: true,
    nepalRivers: inNepal,
    tempGrid: false,
  });

  useEffect(() => {
    setLayers((prev) => ({ ...prev, nepalRivers: inNepal }));
    setFocus(null);
  }, [inNepal, city.name]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetchMapOverlay(lat, lon)
      .then((data) => {
        if (!cancelled) setOverlay(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load river / temperature overlay.");
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lon]);

  useEffect(() => {
    let cancelled = false;
    fetchNepalRivers()
      .then((data) => {
        if (!cancelled) setNepal(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // 📡 Fetch Doppler Radar Frames
  const fetchRadarData = useCallback(async () => {
    try {
      const res = await fetch(`https://api.rainviewer.com/public/weather-maps.json?t=${Date.now()}`);
      if (!res.ok) return;
      const data = await res.json();
      const frames = data.radar?.past || [];
      if (frames.length > 0 && data.host) {
        setRadarHost(data.host);
        setRadarFrames(frames);
        setCurrentFrameIdx(frames.length - 1);
      }
    } catch {
      /* radar is optional */
    }
  }, []);

  useEffect(() => {
    fetchRadarData();
    const id = setInterval(fetchRadarData, 180_000);
    return () => clearInterval(id);
  }, [fetchRadarData]);

  // Handle manual Map & Radar Refresh
  const handleMapRefresh = async () => {
    setIsMapRefreshing(true);
    try {
      await Promise.all([
        fetchRadarData(),
        onRefresh ? onRefresh() : Promise.resolve(),
      ]);
    } finally {
      setTimeout(() => setIsMapRefreshing(false), 500);
    }
  };

  // 📡 Auto-play Radar Timeline Animation
  useEffect(() => {
    if (!isRadarPlaying || radarFrames.length === 0) return;
    const interval = setInterval(() => {
      setCurrentFrameIdx((prev) => (prev + 1) % radarFrames.length);
    }, 650);
    return () => clearInterval(interval);
  }, [isRadarPlaying, radarFrames.length]);

  // Handle clicking anywhere on the map to inspect live weather
  const handleMapClick = async (clickedLat, clickedLon) => {
    const roundedLat = Math.round(clickedLat * 10000) / 10000;
    const roundedLon = Math.round(clickedLon * 10000) / 10000;

    setInspectPoint({
      lat: roundedLat,
      lon: roundedLon,
      loading: true,
      weather: null,
    });

    try {
      const data = await fetchWeather(roundedLat, roundedLon);
      setInspectPoint({
        lat: roundedLat,
        lon: roundedLon,
        loading: false,
        weather: data,
      });
    } catch {
      setInspectPoint((prev) => (prev ? { ...prev, loading: false, error: true } : null));
    }
  };

  const handleApplyInspectCity = (insp) => {
    if (!onSelectCity) return;
    const desc = insp.weather?.current?.weather_description || "Custom Location";
    onSelectCity({
      name: `Point (${insp.lat}, ${insp.lon})`,
      admin1: desc,
      country: "",
      latitude: insp.lat,
      longitude: insp.lon,
    });
    setInspectPoint(null);
  };

  // Combine river paths with live GloFAS risk data
  const riversWithPaths = useMemo(() => {
    const riskMap = new Map();
    if (nepal?.rivers) {
      for (const r of nepal.rivers) {
        riskMap.set(r.id, r);
      }
    }
    return NEPAL_RIVER_PATHS.map((river) => {
      const riskData = riskMap.get(river.id);
      const midIdx = Math.floor(river.coordinates.length / 2);
      return {
        ...river,
        ...riskData,
        coordinates: river.coordinates,
        stationLat: riskData?.latitude ?? river.coordinates[midIdx][0],
        stationLon: riskData?.longitude ?? river.coordinates[midIdx][1],
        risk: riskData?.risk ?? "low",
        discharge: riskData?.discharge,
        peak_7d: riskData?.peak_7d,
        ratio: riskData?.ratio,
      };
    });
  }, [nepal]);

  const sidebarItems =
    inNepal && layers.nepalRivers
      ? riversWithPaths
      : (overlay?.rivers ?? []).map((r, i) => ({
          ...r,
          id: `local-${i}`,
          name: "Nearby river cell",
          region: "GloFAS",
        }));

  const selectedId = focus?.id ?? (focus ? `${focus.latitude}-${focus.longitude}` : null);
  const cityLabel = `${city.name}${current?.weather_description ? ` · ${current.weather_description}` : ""}`;

  const currentTheme = MAP_THEMES[mapTheme] || MAP_THEMES.clear;
  const activeFrame = radarFrames[currentFrameIdx];

  const formatFrameTime = (unixTime) => {
    if (!unixTime) return "LIVE";
    const d = new Date(unixTime * 1000);
    const isLatest = currentFrameIdx === radarFrames.length - 1;
    return `${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${isLatest ? " (LIVE)" : ""}`;
  };

  return (
    <section className="map-section">
      <div className="map-card">
        <div className="map-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <p className="map-title">🗺 Live Map & Doppler Radar</p>
            {isRaining && (
              <span className="rain-live-badge">🌧️ Rain Active</span>
            )}
            {radarFrames.length > 0 && (
              <span
                style={{
                  fontSize: "0.72rem",
                  padding: "0.15rem 0.5rem",
                  borderRadius: "9999px",
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#6ee7b7",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  fontWeight: 600,
                }}
              >
                📡 Doppler Live
              </span>
            )}
          </div>
          <div className="layer-pills">
            {/* 🔄 Refresh Radar & Map Button */}
            <button
              type="button"
              className={`layer-pill refresh-pill ${isMapRefreshing || isRefreshing ? "active spinning" : ""}`}
              onClick={handleMapRefresh}
              title="Click to force-refresh radar imagery and weather data"
            >
              <span className="refresh-icon">🔄</span>
              <span>{isMapRefreshing || isRefreshing ? "Refreshing..." : "Refresh Radar & Map"}</span>
            </button>

            {/* Map Base Layer Switcher (Google Hybrid / Google Roads / Google Terrain / Esri / Carto) */}
            <button
              type="button"
              className="layer-pill active"
              style={{ borderColor: "#38bdf8", color: "#e0f2fe", fontWeight: 600 }}
              onClick={() => {
                const keys = Object.keys(MAP_THEMES);
                setMapTheme((t) => {
                  const idx = keys.indexOf(t);
                  return keys[(idx + 1) % keys.length];
                });
              }}
              title="Click to switch base map (Google Hybrid, Google Roads, Google Terrain, Esri, Carto)"
            >
              {currentTheme.name}
            </button>
            <button
              className={`layer-pill${layers.radar ? " active" : ""}`}
              onClick={() => setLayers((s) => ({ ...s, radar: !s.radar }))}
            >
              📡 Radar
            </button>
            <button
              className={`layer-pill${layers.liveRainCloud ? " active" : ""}`}
              onClick={() => setLayers((s) => ({ ...s, liveRainCloud: !s.liveRainCloud }))}
              title="Toggle live rain cloud reflectivity over current city"
            >
              🌧️ Live Rain Cloud
            </button>
            <button
              className={`layer-pill${layers.nepalBorder ? " active" : ""}`}
              onClick={() => setLayers((s) => ({ ...s, nepalBorder: !s.nepalBorder }))}
              title="Toggle country national boundary outline"
            >
              🇳🇵 Nepal Border
            </button>
            <button
              className={`layer-pill${layers.temp ? " active" : ""}`}
              onClick={() => setLayers((s) => ({ ...s, temp: !s.temp }))}
            >
              🌡 Temp
            </button>
            <button
              type="button"
              className={`layer-pill${layers.rainEffect && activeRainZones.length > 0 ? " active" : ""}`}
              onClick={() => setLayers((s) => ({ ...s, rainEffect: !s.rainEffect }))}
              title="Toggle localized rain storm particles (only active where rain is actually detected)"
            >
              {activeRainZones.length > 0
                ? (layers.rainEffect ? "🌧️ Local Rain: ON" : "🌧️ Local Rain: OFF")
                : "☀️ No Rain Detected"}
            </button>
            <button
              className={`layer-pill${layers.nepalRivers ? " active" : ""}`}
              onClick={() => setLayers((s) => ({ ...s, nepalRivers: !s.nepalRivers }))}
            >
              🌊 Nepal Rivers
            </button>
            <button
              className={`layer-pill${layers.localRisk ? " active" : ""}`}
              onClick={() => setLayers((s) => ({ ...s, localRisk: !s.localRisk }))}
            >
              🔴 Flood Risk
            </button>
            <button
              className={`layer-pill${layers.tempGrid ? " active" : ""}`}
              onClick={() => setLayers((s) => ({ ...s, tempGrid: !s.tempGrid }))}
            >
              🟦 Temp Grid
            </button>
          </div>
        </div>

        {error && <p className="map-error">{error}</p>}

        <div className="map-layout">
          <div className="map-frame">
            <MapContainer
              center={[lat, lon]}
              zoom={8}
              minZoom={2}
              maxZoom={20}
              scrollWheelZoom
              className="leaflet-host"
            >
              <Recenter lat={lat} lon={lon} focus={focus} />
              <MapClickHandler onMapClick={handleMapClick} />

              {/* 🌧️ Localized Rain Particles & Ripples (Strictly pinned to raining geographic zones) */}
              <LocalizedRainOverlay
                zones={activeRainZones}
                active={layers.rainEffect}
              />

              {/* High-Definition Base Tile Layer (Google Maps / Esri / Carto) */}
              <TileLayer
                key={mapTheme}
                url={currentTheme.url}
                subdomains={currentTheme.subdomains || []}
                attribution={currentTheme.attribution}
                minNativeZoom={0}
                maxNativeZoom={currentTheme.maxZoom || 20}
                maxZoom={20}
              />

              {/* Satellite boundaries and place labels */}
              {mapTheme === "satellite" && (
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                  zIndex={300}
                />
              )}

              {/* 🇳🇵 Nepal Country Border Highlight */}
              {layers.nepalBorder && inNepal && (
                <Polygon
                  positions={NEPAL_BORDER_COORDINATES}
                  pathOptions={{
                    color: "#38bdf8",
                    weight: 2.8,
                    opacity: 0.9,
                    fillColor: "#0284c7",
                    fillOpacity: 0.05,
                    dashArray: "6, 6",
                  }}
                >
                  <Tooltip sticky>🇳🇵 Nepal (नेपाल) Border</Tooltip>
                </Polygon>
              )}

              {/* 📡 Doppler Radar Layer (maxNativeZoom: 7 fixes zoom level error) */}
              {layers.radar && radarHost && activeFrame && (
                <TileLayer
                  key={`radar-layer-${activeFrame.path}-${radarColorScheme}-${radarOpacity}`}
                  url={`${radarHost}${activeFrame.path}/256/{z}/{x}/{y}/${radarColorScheme}/1_1.png`}
                  opacity={radarOpacity}
                  zIndex={400}
                  minNativeZoom={0}
                  maxNativeZoom={7}
                  maxZoom={20}
                  attribution='&copy; <a href="https://www.rainviewer.com/">RainViewer Doppler</a>'
                />
              )}

              {/* 🌧️ Live Rain Cloud Radar Reflectivity Cluster (Kathmandu & Selected City) */}
              {layers.liveRainCloud && (
                <>
                  <Circle
                    center={[lat, lon]}
                    radius={28000}
                    pathOptions={{
                      color: "#38bdf8",
                      fillColor: "#0284c7",
                      fillOpacity: 0.35,
                      weight: 1.5,
                      className: "radar-cloud-pulse",
                    }}
                  >
                    <Tooltip sticky>
                      🌧️ <strong>Live Rain Cloud</strong> ({city.name} · Active Radar)
                    </Tooltip>
                  </Circle>
                  <Circle
                    center={[lat, lon]}
                    radius={16000}
                    pathOptions={{
                      color: "#facc15",
                      fillColor: "#84cc16",
                      fillOpacity: 0.45,
                      weight: 1.5,
                      className: "radar-cloud-pulse",
                    }}
                  />
                  <Circle
                    center={[lat, lon]}
                    radius={7000}
                    pathOptions={{
                      color: "#ef4444",
                      fillColor: "#f97316",
                      fillOpacity: 0.6,
                      weight: 2,
                      className: "radar-cloud-pulse",
                    }}
                  >
                    <Popup>
                      <div>
                        <h4>🌧️ Live Doppler Rain Core</h4>
                        <p><strong>City:</strong> {city.name}</p>
                        <p><strong>Radar Status:</strong> Active Rain Cloud</p>
                        <p>
                          <strong>Precipitation:</strong>{" "}
                          {current?.precipitation ? `${current.precipitation} mm` : "Active Showers"}
                        </p>
                      </div>
                    </Popup>
                  </Circle>
                </>
              )}

              {/* Realistic Animated Nepal River Paths */}
              {layers.nepalRivers &&
                riversWithPaths.map((river) => {
                  const isSelected = selectedId === river.id;
                  const isDangerous = river.risk === "flood" || river.risk === "danger";
                  const streamColor = isDangerous
                    ? RISK_COLORS[river.risk]
                    : isSelected
                    ? "#38bdf8"
                    : "#0284c7";

                  return (
                    <div key={`river-group-${river.id}`}>
                      {/* 1. Glowing riverbed base */}
                      <Polyline
                        positions={river.coordinates}
                        pathOptions={{
                          color: isDangerous ? RISK_COLORS[river.risk] : "#0369a1",
                          weight: isSelected ? 9 : 6,
                          opacity: isSelected ? 0.75 : 0.45,
                          className: "river-bed-glow",
                        }}
                      />

                      {/* 2. Animated flowing water channel */}
                      <Polyline
                        positions={river.coordinates}
                        pathOptions={{
                          color: streamColor,
                          weight: isSelected ? 4.5 : 3,
                          opacity: 0.95,
                          className: "river-stream-animated",
                        }}
                        eventHandlers={{
                          click: () => setFocus(river),
                        }}
                      >
                        <Tooltip sticky>
                          🌊 <strong>{river.name}</strong> ({river.basin} Basin)
                        </Tooltip>
                        <Popup>
                          <div>
                            <h4>🌊 {river.name}</h4>
                            <p><strong>Basin:</strong> {river.basin} · {river.region}</p>
                            <p>
                              <strong>Status:</strong>{" "}
                              <span style={{ color: RISK_COLORS[river.risk] || "#38bdf8" }}>
                                {RISK_LABELS[river.risk] ?? "Normal Flow"}
                              </span>
                            </p>
                            {river.discharge != null && (
                              <p><strong>Discharge:</strong> {river.discharge} m³/s</p>
                            )}
                            {river.peak_7d != null && (
                              <p><strong>7-day Peak:</strong> {river.peak_7d} m³/s</p>
                            )}
                          </div>
                        </Popup>
                      </Polyline>

                      {/* 3. River Monitoring Station */}
                      <CircleMarker
                        center={[river.stationLat, river.stationLon]}
                        radius={isSelected ? 7 : 4.5}
                        pathOptions={{
                          color: "#ffffff",
                          fillColor: RISK_COLORS[river.risk] ?? "#0284c7",
                          fillOpacity: 1,
                          weight: 1.5,
                        }}
                        eventHandlers={{
                          click: () => setFocus(river),
                        }}
                      >
                        <Tooltip direction="top" offset={[0, -4]}>
                          📍 {river.name} Station
                        </Tooltip>
                      </CircleMarker>
                    </div>
                  );
                })}

              {/* 📍 Live Inspection Marker for Any Clicked Spot on Map */}
              {inspectPoint && (
                <Marker
                  position={[inspectPoint.lat, inspectPoint.lon]}
                  eventHandlers={{
                    popupclose: () => setInspectPoint(null),
                  }}
                >
                  <Popup autoPan>
                    <div className="map-inspect-popup">
                      {inspectPoint.loading ? (
                        <div>
                          <h4>📍 Inspecting Spot</h4>
                          <p>Lat: {inspectPoint.lat}, Lon: {inspectPoint.lon}</p>
                          <p style={{ marginTop: "0.4rem", color: "#0284c7" }}>
                            ⏳ Loading live temperature & radar...
                          </p>
                        </div>
                      ) : inspectPoint.weather ? (
                        <div>
                          <h4>
                            📍 {weatherIcon(inspectPoint.weather.current.weather_code)}{" "}
                            {inspectPoint.weather.current.weather_description}
                          </h4>
                          <div className="map-inspect-temp">
                            {Math.round(inspectPoint.weather.current.temperature_2m)}°C
                          </div>
                          <div className="map-inspect-details">
                            <div>💧 Humidity: {inspectPoint.weather.current.relative_humidity_2m}%</div>
                            <div>🌧️ Rain/Precip: {inspectPoint.weather.current.precipitation} mm</div>
                            <div>💨 Wind: {inspectPoint.weather.current.wind_speed_10m} km/h</div>
                            <div>📍 Coordinates: {inspectPoint.lat}, {inspectPoint.lon}</div>
                          </div>
                          <button
                            type="button"
                            className="map-inspect-btn"
                            onClick={() => handleApplyInspectCity(inspectPoint)}
                          >
                            🎯 Set As Main Location
                          </button>
                        </div>
                      ) : (
                        <div>
                          <h4>📍 Spot Weather</h4>
                          <p>Could not fetch data for this spot.</p>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )}

              {layers.tempGrid &&
                overlay?.grid?.map((cell, i) =>
                  cell.temp == null ? null : (
                    <CircleMarker
                      key={`t-${i}`}
                      center={[cell.latitude, cell.longitude]}
                      radius={cell.precip > 0.2 ? 10 : 6}
                      pathOptions={{
                        color: tempColor(cell.temp),
                        fillColor: cell.precip > 0.2 ? "#38bdf8" : tempColor(cell.temp),
                        fillOpacity: cell.precip > 0.2 ? 0.45 : 0.25,
                        weight: 1,
                      }}
                    >
                      <Popup>
                        {Math.round(cell.temp)}°C
                        {cell.precip > 0 ? ` · ${cell.precip} mm precip` : ""}
                      </Popup>
                    </CircleMarker>
                  ),
                )}

              {layers.localRisk &&
                overlay?.rivers?.map((river, i) => (
                  <CircleMarker
                    key={`r-${i}`}
                    center={[river.latitude, river.longitude]}
                    radius={river.risk === "flood" || river.risk === "danger" ? 18 : 12}
                    pathOptions={{
                      color: RISK_COLORS[river.risk],
                      fillColor: RISK_COLORS[river.risk],
                      fillOpacity: 0.28,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <strong>{RISK_LABELS[river.risk]}</strong>
                      <br />
                      Discharge {river.discharge} m³/s
                      <br />
                      7-day peak {river.peak_7d} m³/s ({river.ratio}× typical)
                    </Popup>
                  </CircleMarker>
                ))}

              {layers.temp && current?.temperature_2m != null && (
                <TempMarker
                  position={[lat, lon]}
                  temp={current.temperature_2m}
                  label={`${cityLabel} ${weatherIcon(current.weather_code)}`}
                />
              )}
            </MapContainer>

            {/* 📡 Interactive Radar Player Bar */}
            {layers.radar && radarFrames.length > 0 && (
              <div className="radar-player-bar">
                <button
                  type="button"
                  className="radar-play-btn"
                  onClick={() => setIsRadarPlaying((p) => !p)}
                  title={isRadarPlaying ? "Pause Animation" : "Play Radar Animation"}
                >
                  {isRadarPlaying ? "⏸" : "▶"}
                </button>

                <div className="radar-timeline-wrap">
                  <span className="radar-time-tag">
                    🕒 {formatFrameTime(activeFrame?.time)}
                  </span>
                  <input
                    type="range"
                    className="radar-slider"
                    min={0}
                    max={radarFrames.length - 1}
                    value={currentFrameIdx}
                    onChange={(e) => {
                      setIsRadarPlaying(false);
                      setCurrentFrameIdx(Number(e.target.value));
                    }}
                  />
                </div>

                <div className="radar-controls-right">
                  <button
                    type="button"
                    className={`radar-pill-btn ${radarColorScheme === 4 ? "active" : ""}`}
                    onClick={() => setRadarColorScheme(4)}
                    title="Vibrant Multi-color Doppler"
                  >
                    🎨 Vibrant
                  </button>
                  <button
                    type="button"
                    className={`radar-pill-btn ${radarColorScheme === 2 ? "active" : ""}`}
                    onClick={() => setRadarColorScheme(2)}
                    title="Universal Rain Blue"
                  >
                    💧 Blue
                  </button>
                  <button
                    type="button"
                    className="radar-pill-btn"
                    onClick={() =>
                      setRadarOpacity((o) => (o >= 0.9 ? 0.55 : o >= 0.75 ? 0.95 : 0.78))
                    }
                    title="Cycle Radar Opacity"
                  >
                    👁️ {Math.round(radarOpacity * 100)}%
                  </button>
                </div>
              </div>
            )}

            <div className="map-legend">
              <span><i style={{ background: '#38bdf8' }} /> Normal Water Flow</span>
              <span><i style={{ background: RISK_COLORS?.watch || '#fef08a' }} /> Watch / Elevated</span>
              <span><i style={{ background: RISK_COLORS?.danger || '#fbbf24' }} /> Dangerous Discharge</span>
              <span><i style={{ background: RISK_COLORS?.flood || '#f43f5e' }} /> Flood Warning</span>
            </div>
          </div>

          <RiskSidebar
            title={inNepal && layers.nepalRivers ? "Nepal River Flow & Risk" : "Nearby River Risk"}
            items={sidebarItems}
            selectedId={selectedId}
            onSelect={setFocus}
            disclaimer={nepal?.disclaimer || overlay?.disclaimer}
          />
        </div>
      </div>
    </section>
  );
}
