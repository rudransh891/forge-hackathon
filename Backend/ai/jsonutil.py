import json
import re

_FENCE = re.compile(r"```(?:json)?\s*(.*?)```", re.DOTALL | re.IGNORECASE)


def extract_json_object(text: str) -> dict:
    """Return the first JSON object found in a model reply.

    Handles plain JSON, ```json fenced blocks, and JSON surrounded by
    extra text. Raises ValueError if no JSON object is found.
    """
    if not text or not text.strip():
        raise ValueError("empty model reply")

    candidates = [text.strip()]
    candidates += [m.strip() for m in _FENCE.findall(text)]

    decoder = json.JSONDecoder()
    for candidate in candidates:
        try:
            value = json.loads(candidate)
            if isinstance(value, dict):
                return value
        except json.JSONDecodeError:
            pass
        # Scan for any "{" that starts a valid JSON object.
        for i, ch in enumerate(candidate):
            if ch == "{":
                try:
                    value, _ = decoder.raw_decode(candidate[i:])
                    if isinstance(value, dict):
                        return value
                except json.JSONDecodeError:
                    continue
    raise ValueError("no JSON object found in model reply")
