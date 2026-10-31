import shutil
path = "agents/escalation.py"
shutil.copyfile(path, path + ".bak")
with open(path, "r", encoding="utf-8", newline="") as f:
    s = f.read()

old = "    for e in events:"
new = '    for e in [x for x in events if not any(k in (x["note"] or "") for k in ("AI unavailable", ":free", "RateLimit"))]:'
assert s.count(old) == 1, f"expected 1 match, found {s.count(old)}"
with open(path, "w", encoding="utf-8", newline="") as f:
    f.write(s.replace(old, new))
print("patched OK")
