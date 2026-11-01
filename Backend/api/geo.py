"""Geocoding for the report form.

Two read-only endpoints. Both sit on Nominatim, which asks for a contact string
and roughly one request per second; `enrichment.geocode` already serialises and
caches for that reason, so these handlers stay thin.
"""
import logging

from fastapi import APIRouter, HTTPException, Query

from enrichment.geocode import reverse_geocode, search_places

log = logging.getLogger("fixit.geo")

router = APIRouter(prefix="/geocode", tags=["geocode"])

FALLBACK_LABEL = "Reported location"


def _label(road: str | None, locality: str | None, fallback: str = FALLBACK_LABEL) -> str:
    if road and locality:
        return f"{road}, {locality}"
    return road or locality or fallback


@router.get("/reverse")
def reverse(lat: float, lng: float):
    """Block-level label for a point. Never exposes the exact address."""
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        raise HTTPException(status_code=422, detail="Coordinates are outside valid range.")

    result = reverse_geocode(lat, lng)
    if not result.get("ok"):
        # Still usable: the map has the point, only the label is missing.
        return {
            "blockLabel": FALLBACK_LABEL,
            "locality": None,
            "lat": lat,
            "lng": lng,
            "ok": False,
            "error": result.get("error"),
        }

    locality = result.get("locality") or result.get("city")
    return {
        "blockLabel": _label(result.get("road"), locality),
        "locality": locality,
        "lat": lat,
        "lng": lng,
        "ok": True,
        "source": result.get("source"),
    }


@router.get("/search")
def search(q: str = Query(min_length=2), limit: int = 6):
    """Forward geocode, biased to the pilot city. Coordinates included."""
    places = search_places(q, limit)
    return {
        "items": [
            {
                "blockLabel": _label(place.get("road"), place.get("locality"), place.get("display") or FALLBACK_LABEL),
                "locality": place.get("locality"),
                "lat": place["lat"],
                "lng": place["lng"],
            }
            for place in places
        ]
    }
