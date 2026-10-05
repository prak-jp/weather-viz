import httpx

OPEN_METEO = "https://api.open-meteo.com/v1/forecast"
GLOFAS_URL = "https://flood-api.open-meteo.com/v1/flood"

# Nepal major rivers with approximate gauge locations
NEPAL_RIVERS = [
    {"id": "koshi",      "name": "Koshi River",     "basin": "Koshi",    "region": "Province 1",   "latitude": 26.91, "longitude": 87.16},
    {"id": "gandaki",    "name": "Gandaki River",    "basin": "Gandaki",  "region": "Gandaki",      "latitude": 27.69, "longitude": 84.43},
    {"id": "karnali",    "name": "Karnali River",    "basin": "Karnali",  "region": "Karnali",      "latitude": 28.65, "longitude": 81.62},
    {"id": "bagmati",    "name": "Bagmati River",    "basin": "Bagmati",  "region": "Bagmati",      "latitude": 27.67, "longitude": 85.32},
    {"id": "rapti",      "name": "Rapti River",      "basin": "Karnali",  "region": "Lumbini",      "latitude": 27.87, "longitude": 82.59},
    {"id": "mechi",      "name": "Mechi River",      "basin": "Mechi",    "region": "Province 1",   "latitude": 26.65, "longitude": 88.15},
    {"id": "bheri",      "name": "Bheri River",      "basin": "Karnali",  "region": "Karnali",      "latitude": 28.47, "longitude": 82.35},
    {"id": "seti",       "name": "Seti River",       "basin": "Gandaki",  "region": "Gandaki",      "latitude": 28.21, "longitude": 83.97},
    {"id": "marsyangdi", "name": "Marsyangdi River", "basin": "Gandaki",  "region": "Gandaki",      "latitude": 28.33, "longitude": 84.55},
    {"id": "trisuli",    "name": "Trisuli River",    "basin": "Bagmati",  "region": "Bagmati",      "latitude": 27.87, "longitude": 85.03},
]


def _classify_risk(ratio: float) -> str:
    if ratio >= 2.5:
        return "flood"
    if ratio >= 1.8:
        return "danger"
    if ratio >= 1.3:
        return "watch"
    return "low"


async def fetch_glofas(lat: float, lon: float) -> dict:
    """Fetch GloFAS river discharge for a single point."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "river_discharge,river_discharge_max",
        "forecast_days": 7,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(GLOFAS_URL, params=params)
        resp.raise_for_status()
        return resp.json()


async def fetch_map_overlay(latitude: float, longitude: float) -> dict:
    """
    Returns a temperature grid (nearby points) and local GloFAS river risk
    for the selected location area.
    """
    # Build a small 3x3 grid around the selected point (±0.5° steps)
    offsets = [-0.5, 0.0, 0.5]
    grid_points = [
        {"lat": round(latitude + dy, 3), "lon": round(longitude + dx, 3)}
        for dy in offsets
        for dx in offsets
    ]

    lats = ",".join(str(p["lat"]) for p in grid_points)
    lons = ",".join(str(p["lon"]) for p in grid_points)

    grid_data = []
    rivers_data = []

    async with httpx.AsyncClient(timeout=15) as client:
        # Temperature grid via Open-Meteo (bulk)
        try:
            r = await client.get(OPEN_METEO, params={
                "latitude": lats,
                "longitude": lons,
                "current": "temperature_2m,precipitation",
                "timezone": "auto",
            })
            r.raise_for_status()
            results = r.json()
            # Open-Meteo returns list when multiple locations
            if isinstance(results, list):
                for i, res in enumerate(results):
                    grid_data.append({
                        "latitude": grid_points[i]["lat"],
                        "longitude": grid_points[i]["lon"],
                        "temp": res.get("current", {}).get("temperature_2m"),
                        "precip": res.get("current", {}).get("precipitation", 0),
                    })
        except Exception:
            pass

        # GloFAS river risk for the center point
        try:
            gf = await client.get(GLOFAS_URL, params={
                "latitude": latitude,
                "longitude": longitude,
                "daily": "river_discharge,river_discharge_max",
                "forecast_days": 7,
            })
            gf.raise_for_status()
            gd = gf.json()
            discharges = gd.get("daily", {}).get("river_discharge", [])
            max_discharges = gd.get("daily", {}).get("river_discharge_max", [])
            if discharges:
                current_q = discharges[0] or 0
                peak_7d = max(discharges) if discharges else current_q
                typical = max_discharges[0] if max_discharges else current_q
                ratio = round(current_q / typical, 2) if typical and typical > 0 else 1.0
                rivers_data.append({
                    "latitude": latitude,
                    "longitude": longitude,
                    "discharge": round(current_q, 1),
                    "peak_7d": round(peak_7d, 1),
                    "ratio": ratio,
                    "risk": _classify_risk(ratio),
                })
        except Exception:
            pass

    return {
        "grid": grid_data,
        "rivers": rivers_data,
        "disclaimer": "River data: GloFAS reanalysis via Open-Meteo. For reference only.",
    }


async def fetch_nepal_rivers() -> dict:
    """
    Fetch GloFAS discharge for key Nepal river gauges and classify risk.
    """
    results = []

    async with httpx.AsyncClient(timeout=20) as client:
        for river in NEPAL_RIVERS:
            try:
                r = await client.get(GLOFAS_URL, params={
                    "latitude": river["latitude"],
                    "longitude": river["longitude"],
                    "daily": "river_discharge,river_discharge_max",
                    "forecast_days": 7,
                })
                r.raise_for_status()
                data = r.json()
                discharges = data.get("daily", {}).get("river_discharge", [])
                max_discharges = data.get("daily", {}).get("river_discharge_max", [])

                current_q = discharges[0] if discharges else None
                peak_7d = max(discharges) if discharges else None
                typical = max_discharges[0] if max_discharges else None
                ratio = round(current_q / typical, 2) if (current_q and typical and typical > 0) else None

                results.append({
                    **river,
                    "discharge": round(current_q, 1) if current_q else None,
                    "peak_7d": round(peak_7d, 1) if peak_7d else None,
                    "ratio": ratio,
                    "risk": _classify_risk(ratio) if ratio else "unknown",
                })
            except Exception:
                results.append({**river, "discharge": None, "peak_7d": None, "ratio": None, "risk": "unknown"})

    return {
        "rivers": results,
        "disclaimer": "GloFAS discharge data via Open-Meteo Flood API. Reference only — not for emergency decisions.",
    }
