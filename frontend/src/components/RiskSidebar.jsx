import { RISK_COLORS, RISK_LABELS, riskRank } from "../risk";
import { weatherIcon } from "../utils";

export default function RiskSidebar({
  title,
  items,
  selectedId,
  onSelect,
  onSelectCity,
  riverWeather,
  loadingRiverWeather,
  disclaimer,
}) {
  const sorted = [...items].sort((a, b) => {
    const rank = riskRank(a.risk) - riskRank(b.risk);
    if (rank !== 0) return rank;
    return (b.ratio ?? 0) - (a.ratio ?? 0);
  });

  return (
    <aside className="risk-sidebar">
      <div className="risk-sidebar-header">
        <h3>{title}</h3>
        <span className="risk-count-badge">{sorted.length} Rivers</span>
      </div>

      {sorted.length === 0 && <p className="risk-empty">No modelled rivers in this view.</p>}

      <ul className="risk-list">
        {sorted.map((item) => {
          const id = item.id ?? `${item.latitude}-${item.longitude}`;
          const isSelected = selectedId === id;

          return (
            <li key={id} className={`risk-item-wrap ${isSelected ? "selected-wrap" : ""}`}>
              <button
                type="button"
                className={`risk-item-btn ${isSelected ? "active" : ""}`}
                onClick={() => onSelect(item)}
              >
                <span
                  className="risk-dot"
                  style={{ background: RISK_COLORS[item.risk] ?? RISK_COLORS.unknown }}
                />
                <span className="risk-copy">
                  <div className="risk-title-row">
                    <strong>{item.name ?? "Modelled river cell"}</strong>
                    <span
                      className="risk-status-tag"
                      style={{
                        color: RISK_COLORS[item.risk] || "#38bdf8",
                        borderColor: `${RISK_COLORS[item.risk] || "#38bdf8"}40`,
                      }}
                    >
                      {RISK_LABELS[item.risk] ?? item.risk}
                    </span>
                  </div>

                  <span className="risk-meta">
                    {item.basin ? `${item.basin} Basin · ` : ""}
                    {item.region ?? ""}
                  </span>

                  {item.discharge != null && (
                    <span className="risk-stats">
                      🌊 Flow: <strong>{item.discharge} m³/s</strong>
                      {item.peak_7d != null ? ` · Peak 7d: ${item.peak_7d} m³/s` : ""}
                      {item.ratio != null ? ` (${item.ratio}× normal)` : ""}
                    </span>
                  )}
                </span>
              </button>

              {/* Expanded details when clicked */}
              {isSelected && (
                <div className="risk-expanded-details">
                  {loadingRiverWeather && (
                    <div className="risk-weather-loading">
                      <span className="spinning">⏳</span> Loading station weather...
                    </div>
                  )}

                  {!loadingRiverWeather && riverWeather?.current && (
                    <div className="risk-expanded-weather-grid">
                      <div className="rew-pill">
                        🌡️ <strong>{Math.round(riverWeather.current.temperature_2m)}°C</strong>
                      </div>
                      <div className="rew-pill">
                        {weatherIcon(riverWeather.current.weather_code)}{" "}
                        <span>{riverWeather.current.weather_description || "Fair"}</span>
                      </div>
                      <div className="rew-pill">
                        💧 <strong>{riverWeather.current.relative_humidity_2m}%</strong>
                      </div>
                      <div className="rew-pill">
                        🌧️ <strong>{riverWeather.current.precipitation ?? 0} mm</strong>
                      </div>
                      <div className="rew-pill">
                        💨 <strong>{riverWeather.current.wind_speed_10m} km/h</strong>
                      </div>
                    </div>
                  )}

                  {onSelectCity && (
                    <button
                      type="button"
                      className="risk-apply-city-btn"
                      onClick={() =>
                        onSelectCity({
                          name: (item.name || "").split(" (")[0],
                          country: "Nepal",
                          admin1: item.region || item.basin,
                          latitude: item.stationLat ?? item.latitude,
                          longitude: item.stationLon ?? item.longitude,
                        })
                      }
                    >
                      🎯 View Full Forecast for {item.name?.split(" (")[0]}
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {disclaimer && <p className="risk-disclaimer">{disclaimer}</p>}
    </aside>
  );
}
