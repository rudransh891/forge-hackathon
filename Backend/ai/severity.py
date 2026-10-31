"""Explainable severity score. Pure code: no LLM, no database access."""
from ai import severity_config as C


def _factor(state, points, maximum, note):
    return {"state": state, "points": points, "max": maximum, "note": note}


def _damage(vision):
    size = (vision or {}).get("estimated_size")
    if size not in C.SIZE_POINTS:
        return _factor("missing", 0, C.WEIGHTS["damage"], "no usable size estimate from the photo")
    hazards = (vision or {}).get("hazard_indicators") or []
    haz = min(C.HAZARD_POINTS_MAX, C.HAZARD_POINTS_EACH * len(hazards))
    pts = min(C.WEIGHTS["damage"], C.SIZE_POINTS[size] + haz)
    return _factor("scored", pts, C.WEIGHTS["damage"], f"{size} damage, {len(hazards)} hazard indicator(s)")


def _road(ctx):
    road = (ctx or {}).get("road") or {}
    if not road.get("ok"):
        return _factor("missing", 0, C.WEIGHTS["road"], "road lookup failed")
    hw = road.get("highway")
    if not hw:
        return _factor("missing", 0, C.WEIGHTS["road"], "no mapped road within 40 m")
    pts = C.ROAD_POINTS.get(hw, C.ROAD_DEFAULT_POINTS)
    return _factor("scored", pts, C.WEIGHTS["road"], f"{hw} road")


def _places(ctx):
    pl = (ctx or {}).get("places") or {}
    if not pl.get("ok"):
        return _factor("missing", 0, C.WEIGHTS["places"], "nearby-places lookup failed")
    found = (pl.get("schools") or []) + (pl.get("hospitals") or [])
    pts, note = 0, "no school or hospital mapped within radius"
    if found:
        nearest = min(found, key=lambda p: p.get("distance_m", 10**9))
        d = nearest.get("distance_m", 10**9)
        pts = C.PLACE_POINTS_NEAR if d <= C.PLACE_NEAR_M else C.PLACE_POINTS_FAR
        note = f"nearest {nearest.get('type')}-tagged feature '{nearest.get('name')}' at {d} m"
    if (pl.get("bus_stops") or 0) > 0:
        pts += C.BUS_STOP_POINTS
        note += "; bus stop nearby"
    return _factor("scored", min(C.WEIGHTS["places"], pts), C.WEIGHTS["places"], note)


def _conditions(issue_type, ctx):
    mx = C.WEIGHTS["conditions"]
    signal = C.CONDITION_SIGNAL.get(issue_type)
    if signal is None:
        return _factor("not_applicable", 0, mx, "weather/air does not apply to this issue type")
    if signal == "rain":
        w = (ctx or {}).get("weather") or {}
        mm = w.get("rain_last_24h_mm")
        if not w.get("ok") or mm is None:
            return _factor("missing", 0, mx, "weather lookup failed")
        pts = next((p for t, p in C.RAIN_THRESHOLDS if mm >= t), 0)
        return _factor("scored", pts, mx, f"{mm} mm rain in last 24 h (live model)")
    a = (ctx or {}).get("air_quality") or {}
    aqi = a.get("us_aqi")
    if not a.get("ok") or aqi is None:
        return _factor("missing", 0, mx, "air-quality lookup failed")
    pts = next((p for t, p in C.AIR_THRESHOLDS if aqi >= t), 0)
    return _factor("scored", pts, mx, f"US AQI {aqi} (modelled, not a CPCB reading)")


def _confirmations(n):
    n = max(1, n or 1)
    pts = min(C.WEIGHTS["confirmations"], (n - 1) * C.CONFIRM_POINTS_EACH)
    return _factor("scored", pts, C.WEIGHTS["confirmations"], f"{n} confirmation(s)")


def score_report(issue_type, vision, context, confirmations):
    factors = {
        "damage": _damage(vision),
        "road": _road(context),
        "places": _places(context),
        "conditions": _conditions(issue_type, context),
        "confirmations": _confirmations(confirmations),
    }
    used = [f for f in factors.values() if f["state"] == "scored"]
    available = sum(f["max"] for f in used)
    earned = sum(f["points"] for f in used)
    score = round(100 * earned / available) if available else None
    level = next((lvl for floor, lvl in C.LEVELS if score is not None and score >= floor), None)
    uncapped = level
    provisional = any(f["state"] == "missing" for f in factors.values())
    order = ["low", "medium", "high", "critical"]
    if provisional and level in order and order.index(level) > order.index(C.PROVISIONAL_MAX_LEVEL):
        level = C.PROVISIONAL_MAX_LEVEL
    return {
        "score": score,
        "level": level,
        "deadline_hours": C.DEADLINE_HOURS.get(level),
        "provisional": provisional,
        "uncapped_level": uncapped,
        "coverage": f"{len(used)} of 5 factors",
        "missing": [k for k, f in factors.items() if f["state"] == "missing"],
        "not_applicable": [k for k, f in factors.items() if f["state"] == "not_applicable"],
        "factors": factors,
    }
