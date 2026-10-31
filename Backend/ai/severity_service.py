"""Compute severity for a report and store it. Never raises."""
import json
from sqlalchemy import text
from api.database import engine
from ai.severity import score_report

SCORABLE = {"pothole", "garbage", "water_leak", "drain_overflow", "streetlight"}


def template_reason(res):
    parts = [f["note"] for f in res["factors"].values() if f["state"] == "scored" and f["points"] > 0]
    sentence = f"{res['level'].capitalize()} severity ({res['score']}/100, {res['coverage']}): " + "; ".join(parts)
    if res["missing"]:
        sentence += f". Not assessed (data unavailable): {', '.join(res['missing'])}"
    return sentence + "."


def score_and_store(report_id):
    try:
        with engine.connect() as c:
            r = c.execute(text(
                "SELECT issue_type, status, confirmations, context, ai_result FROM reports WHERE id = :i"
            ), {"i": report_id}).fetchone()
        if r is None or r.issue_type not in SCORABLE:
            return {"ok": False, "reason": "report missing or issue type not scorable"}
        vision = (r.ai_result or {}).get("vision", {})
        res = score_report(r.issue_type, vision, r.context, r.confirmations)
        if res["score"] is None:
            return {"ok": False, "reason": "no factors could be evaluated"}
        res["reason_source"] = "template"
        res["deadline_note"] = "Proposed service level, not an official commitment"
        reason = template_reason(res)
        try:
            from ai.severity_reason import write_reason
            llm_reason = write_reason(res, r.issue_type)
            if llm_reason:
                reason = llm_reason
                res["reason_source"] = "llm"
        except Exception:
            pass
        with engine.begin() as c:
            c.execute(text(
                "UPDATE reports SET severity_score = :s, severity_level = :l, severity_reason = :r, "
                "deadline_at = created_at + (:h * interval '1 hour'), "
                "ai_result = COALESCE(ai_result, '{}'::jsonb) || jsonb_build_object('severity', CAST(:sev AS jsonb)) "
                "WHERE id = :i"
            ), {"s": res["score"], "l": res["level"], "r": reason, "h": res["deadline_hours"],
                "sev": json.dumps(res), "i": report_id})
            c.execute(text(
                "INSERT INTO status_events (report_id, status, note) VALUES (:i, :st, :n)"
            ), {"i": report_id, "st": r.status,
                "n": f"Severity scored: {res['level']} ({res['score']}/100, {res['coverage']})"})
        return {"ok": True, "score": res["score"], "level": res["level"], "reason": reason}
    except Exception as e:
        return {"ok": False, "reason": f"{type(e).__name__}: {e}"}
