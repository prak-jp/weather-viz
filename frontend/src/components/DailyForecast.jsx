import { weatherIcon, formatDay } from "../utils";

export default function DailyForecast({ daily, timezone }) {
  return (
    <div className="forecast-card">
      <p className="card-title">7-Day Forecast</p>
      <div className="forecast-row">
        {daily.time.map((day, i) => (
          <div className={`forecast-day${i === 0 ? " today" : ""}`} key={day}>
            <span className="forecast-date">{i === 0 ? "Today" : formatDay(day, timezone)}</span>
            <span className="forecast-icon">{weatherIcon(daily.weather_code[i])}</span>
            <div className="forecast-temps">
              <span className="hi">{Math.round(daily.temperature_2m_max[i])}°</span>
              <span className="lo">{Math.round(daily.temperature_2m_min[i])}°</span>
            </div>
            {daily.precipitation_sum[i] > 0 && (
              <span className="forecast-rain">{daily.precipitation_sum[i]} mm</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
