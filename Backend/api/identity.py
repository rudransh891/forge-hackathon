"""Verify Firebase ID tokens through the Identity Toolkit REST API.

Deliberately no firebase-admin: one HTTPS call with the project's Web API key has
Google validate the signature, expiry and audience for us, and the backend gains
no new dependency (httpx is already used everywhere).
"""
import logging
import os

import httpx
from dotenv import load_dotenv

load_dotenv()
log = logging.getLogger("fixit.identity")

FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY", "").strip()
LOOKUP_URL = "https://identitytoolkit.googleapis.com/v1/accounts:lookup"
TIMEOUT_SECONDS = 10.0


def configured() -> bool:
    return bool(FIREBASE_API_KEY)


def verify_id_token(id_token: str | None) -> dict | None:
    """Return {uid, email, verified, name} for a valid token, else None."""
    if not FIREBASE_API_KEY or not id_token:
        return None
    try:
        response = httpx.post(
            f"{LOOKUP_URL}?key={FIREBASE_API_KEY}",
            json={"idToken": id_token},
            timeout=TIMEOUT_SECONDS,
        )
    except httpx.HTTPError as exc:
        log.warning("firebase token lookup failed: %s", type(exc).__name__)
        return None

    if response.status_code != 200:
        log.info("firebase token rejected: HTTP %s", response.status_code)
        return None

    try:
        users = (response.json() or {}).get("users") or []
    except ValueError:
        return None
    if not users:
        return None

    user = users[0]
    return {
        "uid": user.get("localId"),
        "email": user.get("email"),
        "verified": bool(user.get("emailVerified")),
        "name": user.get("displayName"),
    }
