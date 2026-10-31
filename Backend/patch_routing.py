import shutil

def patch(path, pairs):
    shutil.copyfile(path, path + ".bak")
    with open(path, "r", encoding="utf-8", newline="") as f:
        s = f.read()
    nl = "\r\n" if "\r\n" in s else "\n"
    for old, new in pairs:
        old, new = old.replace("\n", nl), new.replace("\n", nl)
        n = s.count(old)
        assert n == 1, f"{path}: expected 1 match, found {n} for {old[:50]!r}"
    for old, new in pairs:
        s = s.replace(old.replace("\n", nl), new.replace("\n", nl))
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(s)
    print("patched", path)

patch("routing/service.py", [(
    '        prev = (r["ai_result"] or {}).get("routing") or {}',
    '        sug = (r["ai_result"] or {}).get("duplicate_suggestion")\n'
    '        if sug and sug.get("response") is None and not force:\n'
    '            return {"ok": False, "reason": "waiting for the citizen to answer the duplicate question"}\n'
    '        prev = (r["ai_result"] or {}).get("routing") or {}',
)])

patch("jobs/process.py", [
    ("from ai.severity_service import score_and_store",
     "from ai.severity_service import score_and_store\nfrom routing.service import route_report"),
    ('    log.info("severity scored for %s: %s", report_id, score_and_store(report_id))',
     '    log.info("severity scored for %s: %s", report_id, score_and_store(report_id))\n\n'
     '    log.info("routing finished for %s: %s", report_id, route_report(report_id))'),
])
