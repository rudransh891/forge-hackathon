import shutil
path = "ai/severity_service.py"
shutil.copyfile(path, path + ".bak")
with open(path, "r", encoding="utf-8", newline="") as f:
    s = f.read()
nl = "\r\n" if "\r\n" in s else "\n"

old = "        reason = template_reason(res)"
assert s.count(old) == 1, f"expected 1 match, found {s.count(old)}"
new = nl.join([
    old,
    "        try:",
    "            from ai.severity_reason import write_reason",
    "            llm_reason = write_reason(res, r.issue_type)",
    "            if llm_reason:",
    "                reason = llm_reason",
    '                res["reason_source"] = "llm"',
    "        except Exception:",
    "            pass",
])
with open(path, "w", encoding="utf-8", newline="") as f:
    f.write(s.replace(old, new))
print("patched OK")
