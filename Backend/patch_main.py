import shutil
path = "api/main.py"
shutil.copyfile(path, path + ".bak")
with open(path, "r", encoding="utf-8", newline="") as f:
    s = f.read()
nl = "\r\n" if "\r\n" in s else "\n"

old1 = '                "select id, created_at, lat, lng, issue_type, severity_score, "' + nl + \
       '                "status, photo_path from reports order by created_at desc limit :n"'
new1 = '                "select id, created_at, lat, lng, issue_type, severity_score, "' + nl + \
       '                "severity_level, severity_reason, deadline_at, confirmations, "' + nl + \
       '                "status, photo_path from reports order by created_at desc limit :n"'

old2 = '    return {"report": report, "timeline": [dict(e) for e in events]}'
new2 = nl.join([
    '    sev = (report.get("ai_result") or {}).get("severity")',
    '    severity = None',
    '    if sev:',
    '        severity = {',
    '            "score": report.get("severity_score"),',
    '            "level": report.get("severity_level"),',
    '            "reason": report.get("severity_reason"),',
    '            "reason_source": sev.get("reason_source"),',
    '            "coverage": sev.get("coverage"),',
    '            "missing": sev.get("missing"),',
    '            "not_applicable": sev.get("not_applicable"),',
    '            "factors": sev.get("factors"),',
    '            "deadline_at": report.get("deadline_at"),',
    '            "deadline_note": sev.get("deadline_note"),',
    '        }',
    '    return {"report": report, "severity": severity, "timeline": [dict(e) for e in events]}',
])

for old in (old1, old2):
    n = s.count(old)
    assert n == 1, f"expected exactly 1 match, found {n} for: {old[:60]!r}"

s = s.replace(old1, new1).replace(old2, new2)
with open(path, "w", encoding="utf-8", newline="") as f:
    f.write(s)
print("patched OK")
