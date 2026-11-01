import os

from dotenv import load_dotenv

load_dotenv()

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


def get_api_key() -> str:
    key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if not key:
        raise RuntimeError("OPENROUTER_API_KEY is missing in .env")
    return key


def get_model_chain() -> list[str]:
    """Primary model first, then fallbacks, without duplicates."""
    primary = os.getenv("OPENROUTER_VISION_MODEL", "").strip()
    fallbacks = [
        m.strip()
        for m in os.getenv("OPENROUTER_FALLBACK_MODELS", "").split(",")
        if m.strip()
    ]
    chain: list[str] = []
    for m in [primary, *fallbacks]:
        if m and m not in chain:
            chain.append(m)
    if not chain:
        raise RuntimeError("No vision model configured in .env")
    return chain


# Short on purpose: a slow or rate-limited model should fall through to the next
# one rather than hold a report for a minute. The fallback chain is the safety net.
REQUEST_TIMEOUT_SECONDS = float(os.getenv("OPENROUTER_TIMEOUT_SECONDS", "20"))

MAX_OUTPUT_TOKENS = int(os.getenv("OPENROUTER_MAX_OUTPUT_TOKENS", "3000"))
