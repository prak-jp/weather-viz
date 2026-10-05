import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
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
import RainEffect from "./RainEffect";
import { NEPAL_RIVER_PATHS } from "../data/nepalRivers";

// Fix Leaflet default marker icon broken in Vite/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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

export default function LiveMap({ city, weather, onSelectCity }) {
  const lat = city.latitude;
  const lon = city.longitude;
  const current = weather?.current;
  const inNepal =
    city.country === "Nepal" ||
    (lat >= 26.3 && lat <= 30.55 && lon >= 80 && lon <= 88.35);

  const [overlay, setOverlay] = useState(null);
  const [nepal, setNepal] = useState(null);
  const [error, setError] = useState(null);
  const [radarUrl, setRadarUrl] = useState(null);
  const [focus, setFocus] = useState(null);

  // Map Click Inspection State
  const [inspectPoint, setInspectPoint] = useState(null);

  // Check if current location or inspected point has active rain
  const currentHasRain =
    current?.precipitation > 0 ||
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(
      current?.weather_code
    );
  const inspectHasRain =
    inspectPoint?.weather?.current?.precipitation > 0 ||
    [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(
      inspectPoint?.weather?.current?.weather_code
    );
  const isRaining = currentHasRain || inspectHasRain;

  const [layers, setLayers] = useState({
    temp: true,
    radar: true,
    rainEffect: true, // auto or user toggle
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

  useEffect(() => {
    let cancelled = false;
    const loadRadar = async () => {
      try {
        const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
        if (!res.ok) return;
        const data = await res.json();
        const frames = data.radar?.past || [];
        const latest = frames[frames.length - 1];
        if (!cancelled && latest && data.host) {
          setRadarUrl(`${data.host}${latest.path}/256/{z}/{x}/{y}/2/1_1.png`);
        }
      } catch {
        /* radar is optional */
      }
    };
    loadRadar();
    const id = setInterval(loadRadar, 180_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

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

  return (
    <section className="map-section">
      <div className="map-card">
        <div className="map-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <p className="map-title">🗺 Live Weather & Nepal Rivers Map</p>
            {isRaining && (
              <span className="rain-live-badge">🌧️ Rain Active</span>
            )}
          </div>
          <div className="layer-pills">
            <button
              className={`layer-pill${layers.temp ? " active" : ""}`}
              onClick={() => setLayers((s) => ({ ...s, temp: !s.temp }))}
            >
              🌡 Temp
            </button>
            <button
              className={`layer-pill${layers.radar ? " active" : ""}`}
              onClick={() => setLayers((s) => ({ ...s, radar: !s.radar }))}
            >
              🌧 Radar
            </button>
            <button
              className={`layer-pill${layers.rainEffect ? " active" : ""}`}
              onClick={() => setLayers((s) => ({ ...s, rainEffect: !s.rainEffect }))}
              title="Toggle falling rain particle effect"
            >
              {layers.rainEffect ? "💧 Rain Effect: ON" : "💧 Rain Effect: OFF"}
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
            {/* 🌧️ Realistic Falling Rain Overlay */}
            <RainEffect
              active={layers.rainEffect && (isRaining || layers.rainEffect)}
              intensity={
                (current?.precipitation ?? 0) > 3 || (inspectPoint?.weather?.current?.precipitation ?? 0) > 3
                  ? "heavy"
                  : isRaining
                  ? "moderate"
                  : "light"
              }
            />

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

              <TileLayer
                attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                minNativeZoom={0}
                maxNativeZoom={20}
                maxZoom={20}
              />

              {layers.radar && radarUrl && (
                <TileLayer
                  url={radarUrl}
                  opacity={0.55}
                  zIndex={400}
                  attribution="RainViewer"
                  minNativeZoom={0}
                  maxNativeZoom={15}
                  maxZoom={20}
                />
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
