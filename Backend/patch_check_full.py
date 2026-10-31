from pathlib import Path

p = Path("check_escalation.py")
src = p.read_text(encoding="utf-8")
Path("check_escalation.py.bak").write_text(src, encoding="utf-8")

old = 'd["body"][:900]'
new = 'd["body"]'
assert src.count(old) == 1, f"expected 1 match, found {src.count(old)}"

p.write_text(src.replace(old, new), encoding="utf-8")
print("patched OK")
