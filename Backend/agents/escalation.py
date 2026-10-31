"""Escalation agent. Code decides the level; the message is built from stored facts.
Dry-run by default: nothing is sent or written unless dry_run=False. Never raises."""
import json
from datetime import datetime, timedelta, timezone, timezone as tz

from sqlalchemy import text

from api.database import engine
from routing.deliver import send_email
from routing.departments import BODIES, OFFICIAL_CHANNEL, PILOT_CITY

OPEN = ("analysed", "routed", "acknowledged", "in_progress", "escalated")
LEVEL_NAMES = {1: "reminder", 2: "senior officer", 3: "public flag"}
IST = tz(timedelta(hours=5, minutes=30))


def level_for(late_h):
    if late_h <= 0:
        return 0
    if late_h >= 72:
        return 3
    if late_h >= 24:
        return 2
    return 1


def _fmt(dt):
    return dt.astimezone(IST).strftime("%d %b %Y, %H:%M IST") if dt else "not set"


def build_message(r, events, level, late_h):
    issue = BODIES[r["issue_type"]][1]
    intro = {
        1: "This is a reminder: the proposed response time for this complaint has passed.",
        2: "This complaint is now significantly overdue and is being raised to a senior officer.",
        3: "This complaint is seriously overdue and is now publicly flagged as delayed on the FixIt Bharat dashboard.",
    }[level]
    lines = [
        "[TEST ESCALATION] This email went to the FixIt Bharat team test inbox. "
        "It was NOT sent to any government department or officer.",
        "",
        f"Escalation level {level} ({LEVEL_NAMES[level]}). {intro}",
        f"Report: {r['id']}",
        f"Issue: {issue} in {PILOT_CITY}. Location: {r.get('address') or 'address not available'} "
        f"({r['lat']:.5f}, {r['lng']:.5f})",
        f"Severity: {r['severity_level']} ({r['severity_score']}/100)",
        f"Proposed response time was: {_fmt(r['deadline_at'])} (a FixIt Bharat proposed service level, "
        f"not an official commitment). Overdue by about {late_h:.0f} hours.",
        f"Citizens who have reported or confirmed this issue: {r.get('confirmations') or 1}",
        "",
        "History:",
    ]
    for e in [x for x in events if not any(k in (x["note"] or "") for k in ("AI unavailable", ":free", "RateLimit"))]:
        lines.append(f"- {_fmt(e['created_at'])}: {e['status']}. {e['note'] or ''}".rstrip())
    lines += ["", "Request: please act on this complaint and update its status.",
              f"Citizens can also use {OFFICIAL_CHANNEL['name']}: {OFFICIAL_CHANNEL['portal']} "
              f"or {OFFICIAL_CHANNEL['helpline']}."]
    subject = f"[FixIt Bharat TEST] ESCALATION level {level} - {issue} - report {str(r['id'])[:8]}"
    return subject, "\n".join(lines)


def _sent_level(ai):
    done = [a["level"] for a in ((ai or {}).get("escalation") or {}).get("actions", []) if a.get("ok")]
    return max(done) if done else 0


def run(dry_run=True, hours_ahead=0.0):
    try:
        if not dry_run and hours_ahead:
            return {"ok": False, "reason": "hours_ahead is only allowed in dry-run mode"}
        as_of = datetime.now(timezone.utc) + timedelta(hours=hours_ahead)
        decisions = []
        with engine.connect() as c:
            rows = c.execute(text(
                "SELECT id, created_at, issue_type, status, lat, lng, address, severity_level, "
                "severity_score, deadline_at, confirmations, ai_result FROM reports "
                "WHERE status = ANY(:o) AND deadline_at IS NOT NULL AND deadline_at < :t "
                "ORDER BY deadline_at"), {"o": list(OPEN), "t": as_of}).mappings().all()
            for row in rows:
                r = dict(row)
                ai = r["ai_result"] or {}
                late_h = (as_of - r["deadline_at"]).total_seconds() / 3600
                due = level_for(late_h)
                d = {"id": str(r["id"]), "issue": r["issue_type"], "late_h": round(late_h, 1),
                     "level_due": due, "action": None}
                if (ai.get("severity") or {}).get("provisional"):
                    d["action"] = "skip: severity is provisional"
                elif not ((ai.get("routing") or {}).get("delivery") or {}).get("ok"):
                    d["action"] = "skip: never routed, nothing to escalate yet"
                elif due <= _sent_level(ai):
                    d["action"] = f"skip: level {_sent_level(ai)} already done"
                else:
                    events = c.execute(text(
                        "SELECT created_at, status, note FROM status_events WHERE report_id = :i "
                        "ORDER BY created_at"), {"i": r["id"]}).mappings().all()
                    subject, body = build_message(r, events, due, late_h)
                    d.update(subject=subject, body=body)
                    d["action"] = f"would send level {due} ({LEVEL_NAMES[due]})"
                    if not dry_run:
                        delivery = send_email(subject, body)
                        d["delivered"] = delivery["ok"]
                        d["action"] = (f"sent level {due}" if delivery["ok"]
                                       else f"send failed ({delivery['error']}); will retry")
                        entry = {"level": due, "name": LEVEL_NAMES[due], "at": datetime.now(timezone.utc).isoformat(),
                                 "ok": delivery["ok"], "error": delivery["error"],
                                 "target": delivery["target"], "late_hours": round(late_h, 1)}
                        actions = list(((ai.get("escalation") or {}).get("actions")) or []) + [entry]
                        new_status = "escalated" if (due == 3 and delivery["ok"]) else r["status"]
                        note = (f"Escalation level {due} ({LEVEL_NAMES[due]}) "
                                + ("emailed to the team test inbox (not a government officer)." if delivery["ok"]
                                   else f"failed: {delivery['error']}. Will retry."))
                        with engine.begin() as w:
                            w.execute(text(
                                "UPDATE reports SET status = :s, ai_result = COALESCE(ai_result, '{}'::jsonb) "
                                "|| jsonb_build_object('escalation', CAST(:e AS jsonb)) WHERE id = :i"),
                                {"s": new_status, "e": json.dumps({"actions": actions}), "i": r["id"]})
                            w.execute(text("INSERT INTO status_events (report_id, status, note) VALUES (:i, :s, :n)"),
                                      {"i": r["id"], "s": new_status, "n": note})
                decisions.append(d)
        return {"ok": True, "dry_run": dry_run, "as_of": as_of.isoformat(timespec="minutes"),
                "decisions": decisions}
    except Exception as e:
        return {"ok": False, "reason": f"{type(e).__name__}: {e}"}
