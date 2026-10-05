import math
import statistics
import time

import httpx

from app.rivers import NEPAL_RIVERS, is_nepal

FLOOD_API = "https://flood-api.open-meteo.com/v1/flood"
FORECAST_API = "https://api.open-meteo.com/v1/forecast"

_cache: dict[str, tuple[object, float]] = {}
MAP_TTL = 10 * 60
NEPAL_TTL = 30 * 60


def _cache_get(key: str, ttl: float):
    item = _cache.get(key)
    if not item:
        return None
    value, ts = item
    if time.time() - ts > ttl:
        return None
    return value


def _cache_set(key: str, value: object) -> None:
    _cache[key] = (value, time.time())


def _percentile(values: list[float], p: float) -> float:
    ordered = sorted(values)
    if not ordered:
        return 0.0
    k = (len(ordered) - 1) * p / 100
    lo = math.floor(k)
    hi = math.ceil(k)
    if lo == hi:
        return ordered[int(k)]
    return ordered[lo] * (hi - k) + ordered[hi] * (k - lo)


def _as_list(payload):
    if isinstance(payload, list):
        return payload
    return [payload]


def _grid(lat: float, lon: float, span: float, n: int) -> list[tuple[float, float]]:
    if n <= 1:
        return [(lat, lon)]
    step = (2 * span) / (n - 1)
    points = []
    for i in range(n):
        for j in range(n):
            points.append((round(lat - span + i * step, 4), round(lon - span + j * step, 4)))
    return points


def classify_discharge(daily: dict) -> dict | None:
    times = daily.get("time") or []
    series = daily.get("river_discharge") or []
    peaks = daily.get("river_discharge_max") or [None] * len(series)
    pairs = [(t, v, m) for t, v, m in zip(times, series, peaks) if v is not None]
    if len(pairs) < 14:
        return None

    history = [v for _, v, _ in pairs[:-7]]
    forecast = pairs[-7:]
    hist_pos = [v for v in history if v > 0]
    if len(hist_pos) < 7:
        return None

    baseline = statistics.median(hist_pos)
    peak = max((m if m is not None else v) for _, v, m in forecast)
    latest = forecast[-1][1]
    if peak <= 0 and latest <= 0:
        return None

    p90 = _percentile(hist_pos, 90)
    ratio = peak / baseline if baseline > 0 else 0.0
    rank = sum(1 for v in hist_pos if v <= peak) / len(hist_pos)

    # Tiny GloFAS cells can have huge ratios on trickle flow; require volume for alerts.
    if peak >= max(p90, baseline * 4) and peak >= 50:
        risk = "flood"
    elif (ratio >= 2.5 or peak >= p90) and peak >= 20:
        risk = "danger"
    elif ratio >= 1.5 and peak >= 8:
        risk = "watch"
    else:
        risk = "low"

    return {
        "discharge": round(latest, 2),
        "peak_7d": round(peak, 2),
        "baseline": round(baseline, 2),
        "percentile": round(rank * 100, 1),
        "ratio": round(ratio, 2),
        "risk": risk,
    }


async def _fetch_flood_points(client: httpx.AsyncClient, points: list[tuple[float, float]]) -> list[dict]:
    if not points:
        return []
    lats = ",".join(str(p[0]) for p in points)
    lons = ",".join(str(p[1]) for p in points)
    response = await client.get(
        FLOOD_API,
        params={
            "latitude": lats,
            "longitude": lons,
            "daily": "river_discharge,river_discharge_max",
            "past_days": 90,
            "forecast_days": 7,
        },
        timeout=45,
    )
    response.raise_for_status()
    rows = _as_list(response.json())
    results = []
    for point, row in zip(points, rows):
        daily = row.get("daily") or {}
        classified = classify_discharge(daily)
        if not classified:
            continue
        results.append(
            {
                "latitude": row.get("latitude", point[0]),
                "longitude": row.get("longitude", point[1]),
                **classified,
            }
        )
    return results


async def _fetch_weather_grid(client: httpx.AsyncClient, points: list[tuple[float, float]]) -> list[dict]:
    lats = ",".join(str(p[0]) for p in points)
    lons = ",".join(str(p[1]) for p in points)
    response = await client.get(
        FORECAST_API,
        params={
            "latitude": lats,
            "longitude": lons,
            "current": "temperature_2m,precipitation,weather_code",
        },
        timeout=30,
    )
    response.raise_for_status()
    rows = _as_list(response.json())
    grid = []
    for point, row in zip(points, rows):
        current = row.get("current") or {}
        grid.append(
            {
                "latitude": row.get("latitude", point[0]),
                "longitude": row.get("longitude", point[1]),
                "temp": current.get("temperature_2m"),
                "precip": current.get("precipitation") or 0,
                "weather_code": current.get("weather_code"),
            }
        )
    return grid


async def fetch_map_overlay(lat: float, lon: float, span: float = 1.2) -> dict:
    key = f"map:{round(lat, 3)}:{round(lon, 3)}:{round(span, 2)}"
    cached = _cache_get(key, MAP_TTL)
    if cached:
        return cached

    flood_pts = _grid(lat, lon, span=min(span, 1.4), n=3)
    weather_pts = _grid(lat, lon, span=min(span, 1.0), n=5)

    async with httpx.AsyncClient() as client:
        rivers = await _fetch_flood_points(client, flood_pts)
        grid = await _fetch_weather_grid(client, weather_pts)

    payload = {
        "center": {"latitude": lat, "longitude": lon},
        "in_nepal": is_nepal(lat, lon),
        "grid": grid,
        "rivers": rivers,
        "disclaimer": (
            "River risk is GloFAS modelled discharge versus the last 90 days — "
            "not an official flood warning."
        ),
    }
    _cache_set(key, payload)
    return payload


async def fetch_nepal_rivers() -> dict:
    cached = _cache_get("nepal-rivers", NEPAL_TTL)
    if cached:
        return cached

    points = [(r["latitude"], r["longitude"]) for r in NEPAL_RIVERS]
    async with httpx.AsyncClient() as client:
        classified = await _fetch_flood_points(client, points)

    rivers = []
    for station in NEPAL_RIVERS:
        match = None
        best = 99.0
        for row in classified:
            dist = abs(row["latitude"] - station["latitude"]) + abs(row["longitude"] - station["longitude"])
            if dist < best:
                best = dist
                match = row
        if not match or best > 0.35:
            rivers.append({**station, "risk": "unknown", "discharge": None, "peak_7d": None, "baseline": None, "percentile": None, "ratio": None})
            continue
        rivers.append({**station, **{k: match[k] for k in ("discharge", "peak_7d", "baseline", "percentile", "ratio", "risk")}})

    payload = {
        "rivers": rivers,
        "disclaimer": (
            "Nepal river markers use GloFAS cells near main stems. "
            "Risk is modelled discharge vs recent climatology, not an official alert."
        ),
    }
    _cache_set("nepal-rivers", payload)
    return payload
