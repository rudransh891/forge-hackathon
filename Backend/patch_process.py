import shutil
path = "jobs/process.py"
shutil.copyfile(path, path + ".bak")
with open(path, "r", encoding="utf-8", newline="") as f:
    s = f.read()
nl = "\r\n" if "\r\n" in s else "\n"

old1 = "from enrichment.service import enrich_report"
new1 = old1 + nl + "from ai.severity_service import score_and_store"
old2 = '    log.info("enrichment finished for %s: %s", report_id, enrich_report(report_id))'
new2 = old2 + nl + nl + '    log.info("severity scored for %s: %s", report_id, score_and_store(report_id))'

for old in (old1, old2):
    n = s.count(old)
    assert n == 1, f"expected exactly 1 match, found {n} for: {old!r}"

s = s.replace(old1, new1).replace(old2, new2)
with open(path, "w", encoding="utf-8", newline="") as f:
    f.write(s)
print("patched OK")
