import shutil

def read(path):
    with open(path, "r", encoding="utf-8", newline="") as f:
        return f.read()

def apply(s, pairs, label):
    nl = "\r\n" if "\r\n" in s else "\n"
    for old, new in pairs:
        n = s.count(old.replace("\n", nl))
        assert n == 1, f"{label}: expected 1 match, found {n} for {old[:50]!r}"
    for old, new in pairs:
        s = s.replace(old.replace("\n", nl), new.replace("\n", nl))
    return s

files = {p: read(p) for p in ("ai/severity_config.py", "ai/severity.py", "routing/service.py", "jobs/process.py")}

cfg = files["ai/severity_config.py"]
assert "PROVISIONAL_MAX_LEVEL" not in cfg, "config already patched"
nl = "\r\n" if "\r\n" in cfg else "\n"
new_cfg = cfg.rstrip() + nl + nl + "# A score with any missing factor is provisional and cannot exceed this level" + nl + 'PROVISIONAL_MAX_LEVEL = "medium"' + nl

old1 = '    level = next((lvl for floor, lvl in C.LEVELS if score is not None and score >= floor), None)'
new1 = (old1 + '\n    uncapped = level\n'
        '    provisional = any(f["state"] == "missing" for f in factors.values())\n'
        '    order = ["low", "medium", "high", "critical"]\n'
        '    if provisional and level in order and order.index(level) > order.index(C.PROVISIONAL_MAX_LEVEL):\n'
        '        level = C.PROVISIONAL_MAX_LEVEL')
old2 = '        "coverage": f"{len(used)} of 5 factors",'
new2 = '        "provisional": provisional,\n        "uncapped_level": uncapped,\n' + old2
new_sev = apply(files["ai/severity.py"], [(old1, new1), (old2, new2)], "severity.py")

old3 = '        sug = (r["ai_result"] or {}).get("duplicate_suggestion")'
new3 = ('        if ((r["ai_result"] or {}).get("severity") or {}).get("provisional") and not force:\n'
        '            return {"ok": False, "reason": "not routed: severity is provisional (some context data is missing)"}\n' + old3)
new_svc = apply(files["routing/service.py"], [(old3, new3)], "service.py")

pairs = [
    ("import logging", "import logging\nimport time"),
    ("from ai.pipeline import analyse_report", "from sqlalchemy import text\n\nfrom ai.pipeline import analyse_report\nfrom api.database import engine"),
    ('log = logging.getLogger("fixit.jobs")',
     'log = logging.getLogger("fixit.jobs")\n\n\n'
     'def _missing_context(report_id):\n'
     '    try:\n'
     '        with engine.connect() as c:\n'
     '            m = c.execute(text("SELECT context->\'missing\' FROM reports WHERE id = :i"), {"i": report_id}).scalar()\n'
     '        return list(m or [])\n'
     '    except Exception:\n'
     '        return []'),
    ('    log.info("enrichment finished for %s: %s", report_id, enrich_report(report_id))',
     '    log.info("enrichment finished for %s: %s", report_id, enrich_report(report_id))\n'
     '    if _missing_context(report_id):\n'
     '        time.sleep(20)\n'
     '        log.info("enrichment retry for %s: %s", report_id, enrich_report(report_id))'),
]
new_proc = apply(files["jobs/process.py"], pairs, "process.py")

outputs = {"ai/severity_config.py": new_cfg, "ai/severity.py": new_sev,
           "routing/service.py": new_svc, "jobs/process.py": new_proc}
for path, content in outputs.items():
    shutil.copyfile(path, path + ".bak")
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(content)
    print("patched", path)
