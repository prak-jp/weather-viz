import { weatherIcon, windDirection } from "../utils";

export default function CurrentWeather({ current, providerInfo }) {
  const icon = weatherIcon(current.weather_code);

  return (
    <section className="current-weather card">
      <div className="cw-top-row">
        <span className="card-title">Live Weather Overview</span>
        {providerInfo?.provider_name && (
          <span className="cw-provider-badge" title={providerInfo.model}>
            Source: <strong>{providerInfo.provider === "yr_norway" ? "🇳🇴 MET Norway (Yr)" : "🌐 Open-Meteo"}</strong>
            {providerInfo.model ? ` (${providerInfo.model})` : ""}
          </span>
        )}
      </div>

      <div className="cw-main">
        <span className="cw-icon">{icon}</span>
        <div className="cw-temp">
          <span className="cw-temp-val">{Math.round(current.temperature_2m)}</span>
          <span className="cw-temp-unit">°C</span>
        </div>
        <div className="cw-desc">
          <p className="cw-condition">{current.weather_description}</p>
          <p className="cw-feels">Feels like {Math.round(current.apparent_temperature)}°C</p>
        </div>
      </div>

      <div className="cw-stats">
        <StatCard icon="💧" label="Humidity" value={`${current.relative_humidity_2m}%`} />
        <StatCard
          icon="💨"
          label="Wind"
          value={`${current.wind_speed_10m} km/h ${windDirection(current.wind_direction_10m)}`}
        />
        <StatCard icon="🔵" label="Pressure" value={`${Math.round(current.surface_pressure)} hPa`} />
        <StatCard
          icon="🌧"
          label="Precipitation"
          value={current.precipitation > 0 ? `${current.precipitation} mm` : "None"}
        />
      </div>
    </section>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="stat-card">
      <span className="stat-icon">{icon}</span>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}
