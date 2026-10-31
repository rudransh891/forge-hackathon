import shutil
path = "agents/escalation.py"
shutil.copyfile(path, path + ".bak")
with open(path, "r", encoding="utf-8", newline="") as f:
    s = f.read()
nl = "\r\n" if "\r\n" in s else "\n"

old = ("    for e in events:" + nl +
       "        lines.append(f\"- {_fmt(e['created_at'])}: {e['status']}. {e['note'] or ''}\".rstrip())")
new = ("    internal = (\"AI unavailable\", \":free\", \"RateLimit\")" + nl +
       "    for e in events:" + nl +
       "        note = e['note'] or ''" + nl +
       "        if any(k in note for k in internal):" + nl +
       "            continue" + nl +
       "        lines.append(f\"- {_fmt(e['created_at'])}: {e['status']}. {note}\".rstrip())")
assert s.count(old) == 1, f"expected 1 match, found {s.count(old)}"
with open(path, "w", encoding="utf-8", newline="") as f:
    f.write(s.replace(old, new))
print("patched OK")
