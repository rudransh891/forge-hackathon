import logging
import time

import httpx

log = logging.getLogger("fixit.weather")

WEATHER_URL = "https://api.open-meteo.com/v1/forecast"
AIR_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
TIMEOUT_SECONDS = 10.0
CACHE_TTL_SECONDS = 600  # 10 minutes: weather changes, so do not cache for long
_cache: dict[tuple, tuple[float, dict]] = {}


def _get(url: str, params: dict) -> tuple[dict | None, str | None]:
    try:
        resp = httpx.get(url, params=params, timeout=TIMEOUT_SECONDS,
                         headers={"User-Agent": "FixItBharat/0.1 (civic grievance hackathon)"})
        resp.raise_for_status()
        data = resp.json()
        if not isinstance(data, dict):
            return None, "unexpected response"
        return data, None
    except httpx.TimeoutException:
        return None, "timed out"
    except httpx.HTTPStatusError as e:
        return None, f"HTTP {e.response.status_code}"
    except (httpx.HTTPError, ValueError) as e:
        return None, f"unreachable: {type(e).__name__}"


def _aqi_band(aqi: float | None) -> str | None:
    if aqi is None:
        return None
    for limit, label in ((50, "good"), (100, "moderate"), (150, "unhealthy for sensitive groups"),
                         (200, "unhealthy"), (300, "very unhealthy")):
        if aqi <= limit:
            return label
    return "hazardous"


def live_conditions(lat: float, lng: float) -> dict:
    """Current weather, last-24h rainfall and air quality. Never raises.

    Each part is independent: {"weather": {...} or {"ok": False, "error": ...},
                               "air_quality": {...} or {"ok": False, "error": ...}}
    """
    key = (round(lat, 2), round(lng, 2))
    now = time.monotonic()
    hit = _cache.get(key)
    if hit and now - hit[0] < CACHE_TTL_SECONDS:
        return {**hit[1], "cached": True}

    # ---- weather ----
    data, err = _get(WEATHER_URL, {
        "latitude": lat, "longitude": lng, "timezone": "auto",
        "current": "temperature_2m,precipitation,rain,weather_code",
        "hourly": "precipitation", "past_hours": 24, "forecast_hours": 1,
    })
    if data is None or "current" not in data:
        weather = {"ok": False, "error": err or "no current weather in response"}
    else:
        cur = data["current"]
        hourly = (data.get("hourly") or {}).get("precipitation") or []
        rain_24h = round(sum(v for v in hourly if isinstance(v, (int, float))), 1) if hourly else None
        weather = {
            "ok": True,
            "observed_at": cur.get("time"),
            "temperature_c": cur.get("temperature_2m"),
            "precipitation_mm_now": cur.get("precipitation"),
            "rain_last_24h_mm": rain_24h,
            "weather_code": cur.get("weather_code"),
            "source": "Open-Meteo (live weather model)",
        }

    # ---- air quality ----
    data, err = _get(AIR_URL, {
        "latitude": lat, "longitude": lng, "timezone": "auto",
        "current": "pm10,pm2_5,us_aqi",
    })
    if data is None or "current" not in data:
        air = {"ok": False, "error": err or "no air quality in response"}
    else:
        cur = data["current"]
        air = {
            "ok": True,
            "observed_at": cur.get("time"),
            "pm2_5": cur.get("pm2_5"),
            "pm10": cur.get("pm10"),
            "us_aqi": cur.get("us_aqi"),
            "band": _aqi_band(cur.get("us_aqi")),
            "source": "Open-Meteo air quality (modelled, not a CPCB station reading)",
        }

    result = {"weather": weather, "air_quality": air}
    if weather["ok"] or air["ok"]:  # never cache a total failure
        _cache[key] = (now, result)
    return result
