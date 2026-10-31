"""Build the complaint text from stored facts only. No LLM, so nothing can be invented."""
from datetime import timezone, timedelta

from routing.departments import BODIES, OFFICIAL_CHANNEL, PILOT_CITY

IST = timezone(timedelta(hours=5, minutes=30))


def _fmt(dt):
    return dt.astimezone(IST).strftime("%d %b %Y, %H:%M IST") if dt else "not set"


def build_complaint(r, photo_attached):
    label, issue_name = BODIES[r["issue_type"]]
    vision = (r.get("ai_result") or {}).get("vision", {})
    lat, lng = r["lat"], r["lng"]
    map_link = f"https://www.openstreetmap.org/?mlat={lat}&mlon={lng}#map=18/{lat}/{lng}"
    n = r.get("confirmations") or 1

    lines = [
        "[TEST ROUTING] This email went to the FixIt Bharat team's test inbox. "
        "It was NOT sent to any government department.",
        "",
        f"To: The concerned authority, {label}, {PILOT_CITY}",
        "(Responsible body not yet confirmed from an official source.)",
        f"Date: {_fmt(r['created_at'])}",
        f"Reference: FixIt Bharat report {r['id']}",
        "",
        f"Issue: {issue_name}, reported by a citizen through FixIt Bharat.",
        f"Location: {r.get('address') or 'address not available'}",
        f"Coordinates: {lat:.5f}, {lng:.5f}",
        f"Map: {map_link}",
        "Photo evidence: attached." if photo_attached else "Photo evidence: not attached (file not found).",
    ]
    if vision.get("summary"):
        lines.append(f"What the photo shows (AI-assisted, may contain errors): {vision['summary']}")
    lines += [
        f"Severity: {r['severity_level']} ({r['severity_score']}/100). {r['severity_reason']}",
        f"Citizens who have reported or confirmed this issue: {n}",
        f"Proposed response time: by {_fmt(r['deadline_at'])} "
        "(a FixIt Bharat proposed service level, not an official commitment).",
        "",
        "Request: please inspect the location and take corrective action, "
        "and update the status of this complaint.",
        "",
        f"Citizens can also register this through {OFFICIAL_CHANNEL['name']}: "
        f"{OFFICIAL_CHANNEL['portal']} or by calling {OFFICIAL_CHANNEL['helpline']}.",
    ]
    subject = f"[FixIt Bharat TEST] {issue_name} - {r['severity_level']} severity - report {str(r['id'])[:8]}"
    return subject, "\n".join(lines)
