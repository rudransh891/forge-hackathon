import httpx

data = httpx.get("https://openrouter.ai/api/v1/models", timeout=30).json()["data"]

for m in data:
    price = m.get("pricing", {})
    is_free = price.get("prompt") == "0" and price.get("completion") == "0"
    inputs = m.get("architecture", {}).get("input_modalities", [])
    if is_free and "image" in inputs:
        print(m["id"])
