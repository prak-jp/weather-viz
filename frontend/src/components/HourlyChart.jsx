import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, ComposedChart,
} from "recharts";
import { formatTime } from "../utils";

export default function HourlyChart({ hourly, timezone }) {
  const data = hourly.time.map((t, i) => ({
    time: formatTime(t, timezone),
    fullTime: t,
    temp: hourly.temperature_2m[i],
    humidity: hourly.relative_humidity_2m[i],
  }));

  return (
    <div className="chart-card">
      <p className="card-title">48-Hour Forecast</p>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f8ef7" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#4f8ef7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="time"
            tick={{ fill: "#7b8fa6", fontSize: 11 }}
            interval={5}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="temp"
            tick={{ fill: "#7b8fa6", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            unit="°"
          />
          <YAxis
            yAxisId="hum"
            orientation="right"
            tick={{ fill: "#7b8fa6", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            unit="%"
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(8,13,26,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: "#eef2ff",
              fontSize: 13,
            }}
            labelFormatter={(_, p) => p?.[0]?.payload?.fullTime
              ? formatTime(p[0].payload.fullTime, timezone) : ""}
          />
          <Area yAxisId="temp" type="monotone" dataKey="temp" fill="url(#tGrad)" stroke="none" />
          <Line yAxisId="temp" type="monotone" dataKey="temp" stroke="#4f8ef7" strokeWidth={2} dot={false} name="Temp (°C)" />
          <Line yAxisId="hum" type="monotone" dataKey="humidity" stroke="#06d6a0" strokeWidth={2} strokeDasharray="4 3" dot={false} name="Humidity (%)" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
