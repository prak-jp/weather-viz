// Risk level colors
export const RISK_COLORS = {
  flood:   "#ef4444",   // red
  danger:  "#f97316",   // orange
  watch:   "#eab308",   // yellow
  low:     "#22c55e",   // green
  unknown: "#64748b",   // slate
};

// Risk level human-readable labels
export const RISK_LABELS = {
  flood:   "⚠️ Flood risk",
  danger:  "🔶 Dangerous level",
  watch:   "🟡 Watch",
  low:     "✅ Typical flow",
  unknown: "❓ Unknown",
};

// For sorting: higher rank = more dangerous (shown first)
export function riskRank(risk) {
  const order = { flood: 0, danger: 1, watch: 2, low: 3, unknown: 4 };
  return order[risk] ?? 4;
}

// Color based on temperature value
export function tempColor(temp) {
  if (temp >= 35) return "#ef4444";
  if (temp >= 28) return "#f97316";
  if (temp >= 20) return "#eab308";
  if (temp >= 10) return "#22c55e";
  if (temp >= 0)  return "#38bdf8";
  return "#818cf8";
}
