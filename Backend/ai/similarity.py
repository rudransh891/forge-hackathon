import re

# Weights add up to 1.0. Tune these as you collect real duplicate pairs.
W_DISTANCE = 0.4
W_TEXT = 0.4
W_SIZE = 0.2
LIKELY_THRESHOLD = 0.65
POSSIBLE_THRESHOLD = 0.40

_STOP = {
    "the", "and", "with", "for", "from", "that", "this", "are", "has", "have", "into",
    "near", "along", "road", "street", "area", "visible", "appears", "which", "there",
    "its", "their", "over", "under", "around", "some", "very", "more", "also",
}
_SIZES = ["small", "medium", "large"]


def _tokens(vision: dict) -> set[str]:
    parts = list(vision.get("visible_damage") or []) + list(vision.get("hazard_indicators") or [])
    parts.append(vision.get("summary") or "")
    words = re.findall(r"[a-z]+", " ".join(str(p) for p in parts).lower())
    out = set()
    for w in words:
        if len(w) < 3 or w in _STOP:
            continue
        out.add(w[:-1] if w.endswith("s") and len(w) > 4 else w)
    return out


def _size_score(a: str, b: str) -> float:
    if a not in _SIZES or b not in _SIZES:
        return 0.5  # unknown on either side: neutral
    gap = abs(_SIZES.index(a) - _SIZES.index(b))
    return {0: 1.0, 1: 0.4}.get(gap, 0.0)


def compare(vision_a: dict, vision_b: dict, distance_m: float, radius_m: float) -> dict:
    """Explainable similarity between two analysed reports. Pure code, never raises."""
    try:
        d = max(0.0, min(1.0, 1.0 - distance_m / radius_m)) if radius_m > 0 else 0.0
        ta, tb = _tokens(vision_a), _tokens(vision_b)
        text_score = len(ta & tb) / len(ta | tb) if (ta | tb) else 0.0
        size = _size_score(str(vision_a.get("estimated_size")), str(vision_b.get("estimated_size")))
        score = W_DISTANCE * d + W_TEXT * text_score + W_SIZE * size
        label = ("likely_duplicate" if score >= LIKELY_THRESHOLD
                 else "possible_duplicate" if score >= POSSIBLE_THRESHOLD
                 else "different")
        return {
            "score": round(score, 2),
            "label": label,
            "parts": {"distance": round(d, 2), "text": round(text_score, 2), "size": round(size, 2)},
            "shared_terms": sorted(ta & tb)[:8],
        }
    except Exception as e:
        return {"score": 0.0, "label": "different", "error": type(e).__name__}
