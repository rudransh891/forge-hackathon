import shutil
path = "ai/severity_config.py"
shutil.copyfile(path, path + ".bak")
with open(path, "r", encoding="utf-8", newline="") as f:
    s = f.read()
nl = "\r\n" if "\r\n" in s else "\n"
old = "# Air-quality thresholds are added once we confirm the stored unit (next chunk)."
assert s.count(old) == 1, f"expected 1 match, found {s.count(old)}"
new = ("# Modelled US AQI (0-500) -> points; checked top-down, below all -> 0" + nl +
       "AIR_THRESHOLDS = [(151, 10), (101, 7), (51, 3)]")
with open(path, "w", encoding="utf-8", newline="") as f:
    f.write(s.replace(old, new))
print("patched OK")
