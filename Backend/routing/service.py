"""Route one report: pilot-area check, complaint, delivery, honest record. Never raises."""
import json

from sqlalchemy import text

from api.database import engine
from routing.area import in_pilot_area
from routing.complaint import build_complaint
from routing.deliver import find_photo, send_email
from routing.departments import BODIES, BODY_CONFIRMED, OFFICIAL_CHANNEL, PILOT_CITY

SKIP_STATUSES = {"received", "needs_review", "needs_better_photo", "merged"}


def _save(report_id, status, record, note, set_routed=False):
    with engine.begin() as c:
        c.execute(text(
            "UPDATE reports SET department = COALESCE(:dept, department), "
            "ai_result = COALESCE(ai_result, '{}'::jsonb) "
            "|| jsonb_build_object('routing', CAST(:rec AS jsonb)) WHERE id = :i"
        ), {"rec": json.dumps(record), "dept": record.get("body"), "i": report_id})
        if set_routed:
            c.execute(text("UPDATE reports SET status = 'routed' WHERE id = :i AND status = 'analysed'"),
                      {"i": report_id})
        c.execute(text("INSERT INTO status_events (report_id, status, note) VALUES (:i, :s, :n)"),
                  {"i": report_id, "s": status, "n": note})


def route_report(report_id, force=False):
    try:
        with engine.connect() as c:
            row = c.execute(text(
                "SELECT id, created_at, issue_type, status, lat, lng, address, photo_path, "
                "severity_score, severity_level, severity_reason, deadline_at, confirmations, ai_result "
                "FROM reports WHERE id = :i"), {"i": report_id}).mappings().first()
        if row is None:
            return {"ok": False, "reason": "report not found"}
        r = dict(row)
        if r["issue_type"] not in BODIES:
            return {"ok": False, "reason": "issue type has no routing"}
        if r["status"] in SKIP_STATUSES:
            return {"ok": False, "reason": f"not routed: status is {r['status']}"}
        if r["severity_level"] is None:
            return {"ok": False, "reason": "not routed: severity not scored yet"}
        if ((r["ai_result"] or {}).get("severity") or {}).get("provisional") and not force:
            return {"ok": False, "reason": "not routed: severity is provisional (some context data is missing)"}
        sug = (r["ai_result"] or {}).get("duplicate_suggestion")
        if sug and sug.get("response") is None and not force:
            return {"ok": False, "reason": "waiting for the citizen to answer the duplicate question"}
        prev = (r["ai_result"] or {}).get("routing") or {}
        if prev.get("delivery", {}).get("ok") and not force:
            return {"ok": False, "reason": "already routed"}

        area = in_pilot_area(r["lat"], r["lng"])
        if area["inside"] is None:
            return {"ok": False, "reason": "could not check pilot area: " + str(area.get("reason"))}
        if area["inside"] is False:
            rec = {"inside_pilot_area": False, "delivered": False,
                   "note": f"Outside the {PILOT_CITY} pilot area. No complaint was sent.",
                   "citizen_option": OFFICIAL_CHANNEL}
            _save(report_id, r["status"], rec, f"Outside the {PILOT_CITY} pilot area; no complaint sent.")
            return {"ok": True, "routed": False, "reason": "outside pilot area"}

        photo = find_photo(r["photo_path"])
        subject, body = build_complaint(r, photo_attached=photo is not None)
        delivery = send_email(subject, body, photo)
        rec = {
            "inside_pilot_area": True,
            "body": BODIES[r["issue_type"]][0],
            "body_confirmed": BODY_CONFIRMED,
            "complaint_subject": subject,
            "complaint_text": body,
            "delivery": delivery,
            "citizen_option": OFFICIAL_CHANNEL,
        }
        if delivery["ok"]:
            note = "Complaint prepared and emailed to the FixIt Bharat team test inbox (not a government department)."
        else:
            note = (f"Complaint prepared; email delivery failed ({delivery['error']}). "
                    f"Citizen can register it via {OFFICIAL_CHANNEL['name']} ({OFFICIAL_CHANNEL['helpline']}).")
        _save(report_id, "routed" if (delivery["ok"] and r["status"] == "analysed") else r["status"], rec, note, set_routed=bool(delivery["ok"]))
        return {"ok": delivery["ok"], "routed": delivery["ok"], "photo_attached": delivery["photo_attached"],
                "error": delivery["error"]}
    except Exception as e:
        return {"ok": False, "reason": f"{type(e).__name__}: {e}"}
