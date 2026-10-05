import httpx

OPEN_METEO = "https://api.open-meteo.com/v1/forecast"
GEOCODING = "https://geocoding-api.open-meteo.com/v1/search"

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


async def fetch_weather(latitude: float, longitude: float) -> dict:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure",
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
    code = current.get("weather_code", 0)

    return {
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
