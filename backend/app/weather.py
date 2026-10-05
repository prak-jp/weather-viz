import asyncio
import datetime
import logging
import math
import time
from collections import defaultdict
import httpx

logger = logging.getLogger("weather_viz.weather")

OPEN_METEO = "https://api.open-meteo.com/v1/forecast"
GEOCODING = "https://geocoding-api.open-meteo.com/v1/search"
YR_MET_NO = "https://api.met.no/weatherapi/locationforecast/2.0/compact"
YR_USER_AGENT = "WeatherViz-App/1.0 (github.com/prak-jp/weather-viz)"

# In-memory TTL cache for MET Norway (respecting their rate-limiting and cache guidelines)
YR_CACHE: dict[str, tuple[float, dict]] = {}
YR_CACHE_TTL = 300  # 5 minutes

WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Thunderstorm with heavy hail",
}

YR_SYMBOL_TO_WMO = {
    "clearsky_day": (0, "Clear sky"),
    "clearsky_night": (0, "Clear sky"),
    "fair_day": (1, "Mainly clear"),
    "fair_night": (1, "Mainly clear"),
    "partlycloudy_day": (2, "Partly cloudy"),
    "partlycloudy_night": (2, "Partly cloudy"),
    "cloudy": (3, "Overcast"),
    "fog": (45, "Fog"),
    "lightrainshowers_day": (80, "Slight rain showers"),
    "lightrainshowers_night": (80, "Slight rain showers"),
    "rainshowers_day": (81, "Moderate rain showers"),
    "rainshowers_night": (81, "Moderate rain showers"),
    "heavyrainshowers_day": (82, "Violent rain showers"),
    "heavyrainshowers_night": (82, "Violent rain showers"),
    "lightrain": (61, "Slight rain"),
    "rain": (63, "Moderate rain"),
    "heavyrain": (65, "Heavy rain"),
    "lightsleet": (66, "Light sleet"),
    "sleet": (67, "Sleet"),
    "lightsnow": (71, "Slight snow"),
    "snow": (73, "Moderate snow"),
    "heavysnow": (75, "Heavy snow"),
    "lightrainandthunder": (95, "Slight thunderstorm"),
    "rainandthunder": (95, "Thunderstorm"),
    "heavyrainandthunder": (99, "Heavy thunderstorm with hail"),
}


def parse_yr_symbol(sym: str | None) -> tuple[int, str]:
    if not sym:
        return 0, "Clear sky"
    clean = sym.split("_polartwilight")[0]
    if clean in YR_SYMBOL_TO_WMO:
        return YR_SYMBOL_TO_WMO[clean]
    base = clean.split("_")[0]
    for k, v in YR_SYMBOL_TO_WMO.items():
        if k.startswith(base):
            return v
    return 2, "Partly cloudy"


def is_himalayan_or_nepal(lat: float, lon: float) -> bool:
    """Checks whether the coordinate falls in Nepal or the greater Himalayan region where MET Norway (ECMWF) excels."""
    return 26.0 <= lat <= 31.5 and 79.5 <= lon <= 89.0


def calculate_sun_times(lat: float, lon: float, date_str: str) -> tuple[str, str]:
    """Calculates approximate local sunrise and sunset times using standard solar equations."""
    try:
        d = datetime.date.fromisoformat(date_str)
        day_of_year = d.timetuple().tm_yday
        rad = math.pi / 180.0
        gamma = 2 * math.pi / 365.0 * (day_of_year - 1)
        decl = (
            0.006918
            - 0.399912 * math.cos(gamma)
            + 0.070257 * math.sin(gamma)
            - 0.006758 * math.cos(2 * gamma)
            + 0.000907 * math.sin(2 * gamma)
        )
        eqtime = 229.18 * (
            0.000075
            + 0.001868 * math.cos(gamma)
            - 0.032077 * math.sin(gamma)
            - 0.014615 * math.cos(2 * gamma)
            - 0.040849 * math.sin(2 * gamma)
        )
        zenith = 90.833 * rad
        cos_omega = (math.cos(zenith) - math.sin(lat * rad) * math.sin(decl)) / (
            math.cos(lat * rad) * math.cos(decl)
        )
        if cos_omega > 1 or cos_omega < -1:
            return f"{date_str}T06:00", f"{date_str}T18:00"
        omega = math.acos(cos_omega) / rad
        sr_min = 720 - 4 * lon - eqtime - omega * 4
        ss_min = 720 - 4 * lon - eqtime + omega * 4
        tz_offset_hours = round(lon / 15.0)
        sr = datetime.datetime.combine(d, datetime.time()) + datetime.timedelta(
            minutes=sr_min + tz_offset_hours * 60
        )
        ss = datetime.datetime.combine(d, datetime.time()) + datetime.timedelta(
            minutes=ss_min + tz_offset_hours * 60
        )
        return sr.strftime("%Y-%m-%dT%H:%M"), ss.strftime("%Y-%m-%dT%H:%M")
    except Exception:
        return f"{date_str}T06:00", f"{date_str}T18:00"


async def search_cities(query: str, limit: int = 8) -> list[dict]:
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            GEOCODING,
            params={"name": query, "count": limit, "language": "en", "format": "json"},
        )
        response.raise_for_status()
        results = response.json().get("results") or []
        return [
            {
                "name": r["name"],
                "country": r.get("country", ""),
                "latitude": r["latitude"],
                "longitude": r["longitude"],
                "admin1": r.get("admin1", ""),
            }
            for r in results
        ]


async def fetch_open_meteo(latitude: float, longitude: float) -> dict:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure",
        "minutely_15": "precipitation,weather_code",
        "hourly": "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,sunrise,sunset",
        "timezone": "auto",
        "forecast_days": 7,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(OPEN_METEO, params=params)
        response.raise_for_status()
        data = response.json()

    current = data["current"]

    # Incorporate 15-minute high-resolution nowcast for immediate local rain detection
    minutely = data.get("minutely_15", {})
    if minutely.get("precipitation") and len(minutely["precipitation"]) > 0:
        latest_precip = minutely["precipitation"][0]
        latest_code = minutely.get("weather_code", [None])[0]
        if latest_precip > current.get("precipitation", 0):
            current["precipitation"] = latest_precip
        if latest_code is not None and latest_code > 50 and current.get("weather_code", 0) < 50:
            current["weather_code"] = latest_code

    code = current.get("weather_code", 0)

    return {
        "provider": "open_meteo",
        "provider_name": "Open-Meteo",
        "model": "Multi-Model Ensemble (15m Nowcast)",
        "location": {
            "latitude": data["latitude"],
            "longitude": data["longitude"],
            "timezone": data.get("timezone", "UTC"),
        },
        "current": {
            **current,
            "weather_description": WEATHER_CODES.get(code, "Unknown"),
        },
        "hourly": {
            "time": data["hourly"]["time"][:48],
            "temperature_2m": data["hourly"]["temperature_2m"][:48],
            "relative_humidity_2m": data["hourly"]["relative_humidity_2m"][:48],
            "precipitation": data["hourly"]["precipitation"][:48],
            "weather_code": data["hourly"]["weather_code"][:48],
            "wind_speed_10m": data["hourly"]["wind_speed_10m"][:48],
        },
        "daily": {
            "time": data["daily"]["time"],
            "temperature_2m_max": data["daily"]["temperature_2m_max"],
            "temperature_2m_min": data["daily"]["temperature_2m_min"],
            "precipitation_sum": data["daily"]["precipitation_sum"],
            "weather_code": data["daily"]["weather_code"],
            "sunrise": data["daily"]["sunrise"],
            "sunset": data["daily"]["sunset"],
        },
    }


async def fetch_yr_weather(latitude: float, longitude: float) -> dict:
    cache_key = f"{round(latitude, 3)},{round(longitude, 3)}"
    now_ts = time.time()
    if cache_key in YR_CACHE:
        cached_time, cached_data = YR_CACHE[cache_key]
        if now_ts - cached_time < YR_CACHE_TTL:
            return cached_data

    headers = {"User-Agent": YR_USER_AGENT}
    params = {"lat": round(latitude, 4), "lon": round(longitude, 4)}

    async with httpx.AsyncClient(headers=headers, timeout=12) as client:
        response = await client.get(YR_MET_NO, params=params)
        response.raise_for_status()
        data = response.json()

    ts = data["properties"]["timeseries"]
    if not ts:
        raise ValueError("MET Norway returned empty timeseries")

    # Current instant
    first = ts[0]
    inst = first["data"]["instant"]["details"]
    next1 = first["data"].get("next_1_hours") or first["data"].get("next_6_hours") or {}
    sym_code = next1.get("summary", {}).get("symbol_code")
    wmo_code, desc = parse_yr_symbol(sym_code)

    temp = inst.get("air_temperature", 0.0)
    humidity = inst.get("relative_humidity", 0.0)
    wind_ms = inst.get("wind_speed", 0.0)
    wind_kmh = round(wind_ms * 3.6, 1)

    # Compute apparent temperature
    e = (humidity / 100.0) * 6.105 * math.exp((17.27 * temp) / (237.7 + temp)) if temp else 0
    apparent_temp = round(temp + 0.33 * e - 0.70 * wind_ms - 4.00, 1)
    precip_1h = next1.get("details", {}).get("precipitation_amount", 0.0)

    # 48-hour hourly series
    h_time, h_temp, h_rh, h_precip, h_wmo, h_wind = [], [], [], [], [], []
    for item in ts[:48]:
        dt = item["time"].replace("Z", "")
        d_inst = item["data"]["instant"]["details"]
        d_next = item["data"].get("next_1_hours") or item["data"].get("next_6_hours") or {}
        d_sym = d_next.get("summary", {}).get("symbol_code")
        d_code, _ = parse_yr_symbol(d_sym)
        h_time.append(dt)
        h_temp.append(d_inst.get("air_temperature", 0.0))
        h_rh.append(d_inst.get("relative_humidity", 0.0))
        h_precip.append(d_next.get("details", {}).get("precipitation_amount", 0.0))
        h_wmo.append(d_code)
        h_wind.append(round(d_inst.get("wind_speed", 0.0) * 3.6, 1))

    # 7-day daily series
    by_day = defaultdict(list)
    for item in ts:
        by_day[item["time"][:10]].append(item)

    d_time, d_tmax, d_tmin, d_psum, d_wmo, d_sr, d_ss = [], [], [], [], [], [], []
    for day_str in list(by_day.keys())[:7]:
        day_items = by_day[day_str]
        day_temps = [
            x["data"]["instant"]["details"]["air_temperature"]
            for x in day_items
            if "air_temperature" in x["data"]["instant"]["details"]
        ]
        if not day_temps:
            continue
        day_precips = [
            (x["data"].get("next_1_hours") or x["data"].get("next_6_hours") or {})
            .get("details", {})
            .get("precipitation_amount", 0.0)
            or 0.0
            for x in day_items
        ]
        day_syms = [
            (x["data"].get("next_1_hours") or x["data"].get("next_6_hours") or {})
            .get("summary", {})
            .get("symbol_code")
            for x in day_items
        ]
        valid_syms = [s for s in day_syms if s]
        day_wmo_code, _ = parse_yr_symbol(valid_syms[len(valid_syms) // 2] if valid_syms else None)

        sr, ss = calculate_sun_times(latitude, longitude, day_str)
        d_time.append(day_str)
        d_tmax.append(round(max(day_temps), 1))
        d_tmin.append(round(min(day_temps), 1))
        d_psum.append(round(sum(day_precips), 1))
        d_wmo.append(day_wmo_code)
        d_sr.append(sr)
        d_ss.append(ss)

    result = {
        "provider": "yr_norway",
        "provider_name": "MET Norway (Yr.no)",
        "model": "ECMWF / MEPS (Himalayan Precision)",
        "location": {
            "latitude": latitude,
            "longitude": longitude,
            "timezone": "auto",
        },
        "current": {
            "temperature_2m": temp,
            "relative_humidity_2m": humidity,
            "apparent_temperature": apparent_temp,
            "precipitation": precip_1h,
            "rain": precip_1h,
            "showers": 0.0,
            "weather_code": wmo_code,
            "weather_description": desc,
            "wind_speed_10m": wind_kmh,
            "wind_direction_10m": inst.get("wind_from_direction", 0.0),
            "surface_pressure": inst.get("air_pressure_at_sea_level", 1013.25),
        },
        "hourly": {
            "time": h_time,
            "temperature_2m": h_temp,
            "relative_humidity_2m": h_rh,
            "precipitation": h_precip,
            "weather_code": h_wmo,
            "wind_speed_10m": h_wind,
        },
        "daily": {
            "time": d_time,
            "temperature_2m_max": d_tmax,
            "temperature_2m_min": d_tmin,
            "precipitation_sum": d_psum,
            "weather_code": d_wmo,
            "sunrise": d_sr,
            "sunset": d_ss,
        },
    }

    YR_CACHE[cache_key] = (now_ts, result)
    return result


async def fetch_weather(latitude: float, longitude: float, provider: str = "auto") -> dict:
    """Smart Hybrid Weather Fetcher:

    - 'yr': Uses MET Norway (Yr.no ECMWF) directly.
    - 'open_meteo': Uses Open-Meteo ensemble with 15-minute nowcasts.
    - 'auto' (default): Automatically selects MET Norway for Nepal / Himalayas (where ECMWF has highest accuracy for mountain valleys), and Open-Meteo globally, with automatic seamless fallback.
    """
    selected_provider = provider.lower() if provider else "auto"

    if selected_provider == "yr":
        try:
            res = await fetch_yr_weather(latitude, longitude)
            res["auto_selected"] = False
            return res
        except Exception as e:
            logger.warning(f"MET Norway fetch failed, falling back to Open-Meteo: {e}")
            fallback = await fetch_open_meteo(latitude, longitude)
            fallback["fallback_from"] = "yr_norway"
            return fallback

    elif selected_provider == "open_meteo":
        res = await fetch_open_meteo(latitude, longitude)
        res["auto_selected"] = False
        return res

    # Auto mode: Use MET Norway for Nepal & Himalayas, Open-Meteo for rest of the world
    if is_himalayan_or_nepal(latitude, longitude):
        try:
            res = await fetch_yr_weather(latitude, longitude)
            res["auto_selected"] = True
            return res
        except Exception as e:
            logger.warning(f"Auto-selected MET Norway failed, falling back to Open-Meteo: {e}")
            fallback = await fetch_open_meteo(latitude, longitude)
            fallback["auto_selected"] = True
            return fallback
    else:
        res = await fetch_open_meteo(latitude, longitude)
        res["auto_selected"] = True
        return res
