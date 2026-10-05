import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchMapOverlay, fetchNepalRivers } from "../api";
import { RISK_COLORS, RISK_LABELS, tempColor } from "../risk";
import { weatherIcon } from "../utils";
import RiskSidebar from "./RiskSidebar";

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
      map.flyTo([focus.latitude, focus.longitude], 9, { duration: 0.65 });
    } else {
      map.setView([lat, lon], 8);
    }
  }, [lat, lon, focus, map]);
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

export default function LiveMap({ city, weather }) {
  const lat = city.latitude;
  const lon = city.longitude;
  const current = weather?.current;
  const inNepal = city.country === "Nepal" || (lat >= 26.3 && lat <= 30.55 && lon >= 80 && lon <= 88.35);

  const [overlay, setOverlay] = useState(null);
  const [nepal, setNepal] = useState(null);
  const [error, setError] = useState(null);
  const [radarUrl, setRadarUrl] = useState(null);
  const [focus, setFocus] = useState(null);
  const [layers, setLayers] = useState({
    temp: true,
    radar: true,
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

  const sidebarItems = inNepal && layers.nepalRivers
    ? nepal?.rivers ?? []
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
          <p className="map-title">🗺 Live Weather Map</p>
          <div className="layer-pills">
            <button className={`layer-pill${layers.temp ? ' active' : ''}`} onClick={() => setLayers(s => ({...s, temp: !s.temp}))}>🌡 Temp</button>
            <button className={`layer-pill${layers.radar ? ' active' : ''}`} onClick={() => setLayers(s => ({...s, radar: !s.radar}))}>🌧 Radar</button>
            <button className={`layer-pill${layers.localRisk ? ' active' : ''}`} onClick={() => setLayers(s => ({...s, localRisk: !s.localRisk}))}>🔴 River Risk</button>
            <button className={`layer-pill${layers.nepalRivers ? ' active' : ''}`} onClick={() => setLayers(s => ({...s, nepalRivers: !s.nepalRivers}))}>🏔 Nepal Rivers</button>
            <button className={`layer-pill${layers.tempGrid ? ' active' : ''}`} onClick={() => setLayers(s => ({...s, tempGrid: !s.tempGrid}))}>🟦 Temp Grid</button>
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
              {layers.nepalRivers &&
                nepal?.rivers?.map((river) => (
                  <CircleMarker
                    key={river.id}
                    center={[river.latitude, river.longitude]}
                    radius={9}
                    pathOptions={{
                      color: "#93c5fd",
                      fillColor: RISK_COLORS[river.risk] ?? RISK_COLORS.unknown,
                      fillOpacity: 0.9,
                      weight: 2,
                    }}
                    eventHandlers={{
                      click: () => setFocus(river),
                    }}
                  >
                    <Popup>
                      <strong>{river.name}</strong>
                      <br />
                      {river.basin} · {river.region}
                      <br />
                      {RISK_LABELS[river.risk] ?? "Unknown"}
                      {river.peak_7d != null && (
                        <>
                          <br />
                          Peak 7d {river.peak_7d} m³/s
                        </>
                      )}
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
              <span><i style={{ background: RISK_COLORS?.flood || '#f43f5e' }} /> Flood risk</span>
              <span><i style={{ background: RISK_COLORS?.danger || '#fbbf24' }} /> Dangerous river</span>
              <span><i style={{ background: RISK_COLORS?.watch || '#fef08a' }} /> Watch</span>
              <span><i style={{ background: RISK_COLORS?.low || '#38bdf8' }} /> Typical</span>
            </div>
          </div>

          <RiskSidebar
            title={inNepal && layers.nepalRivers ? "Nepal river risk" : "Nearby river risk"}
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
