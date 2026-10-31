from dotenv import load_dotenv
from sqlalchemy import text

load_dotenv()
from api.database import engine
from routing.area import in_pilot_area

with engine.connect() as c:
    r = c.execute(text(
        "SELECT id::text, status, severity_level, lat, lng, ai_result "
        "FROM reports WHERE id::text LIKE 'e73a7619%'")).mappings().one()

ai = r["ai_result"] or {}
sev = ai.get("severity") or {}
sug = ai.get("duplicate_suggestion")
print("status:", r["status"], "| severity level:", r["severity_level"])
print("provisional:", sev.get("provisional"), "| missing:", sev.get("missing"))
print("duplicate question:", None if not sug else ("answered" if sug.get("response") is not None else "UNANSWERED"))
print("routing record present:", "routing" in ai)
print("pilot area:", in_pilot_area(r["lat"], r["lng"]).get("inside"))
