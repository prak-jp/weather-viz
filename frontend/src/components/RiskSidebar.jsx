import { RISK_COLORS, RISK_LABELS, riskRank } from "../risk";

export default function RiskSidebar({
  title,
  items,
  selectedId,
  onSelect,
  disclaimer,
}) {
  const sorted = [...items].sort((a, b) => {
    const rank = riskRank(a.risk) - riskRank(b.risk);
    if (rank !== 0) return rank;
    return (b.ratio ?? 0) - (a.ratio ?? 0);
  });

  return (
    <aside className="risk-sidebar">
      <h3>{title}</h3>
      {sorted.length === 0 && <p className="risk-empty">No modelled rivers in this view.</p>}
      <ul className="risk-list">
        {sorted.map((item) => {
          const id = item.id ?? `${item.latitude}-${item.longitude}`;
          return (
            <li key={id}>
              <button
                type="button"
                className={selectedId === id ? "active" : ""}
                onClick={() => onSelect(item)}
              >
                <span className="risk-dot" style={{ background: RISK_COLORS[item.risk] ?? RISK_COLORS.unknown }} />
                <span className="risk-copy">
                  <strong>{item.name ?? "Modelled river cell"}</strong>
                  <span className="risk-meta">
                    {item.region ? `${item.region} · ` : ""}
                    {RISK_LABELS[item.risk] ?? item.risk}
                  </span>
                  {item.peak_7d != null && (
                    <span className="risk-stats">
                      Peak 7d {item.peak_7d} m³/s
                      {item.ratio != null ? ` · ${item.ratio}× typical` : ""}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {disclaimer && <p className="risk-disclaimer">{disclaimer}</p>}
    </aside>
  );
}
