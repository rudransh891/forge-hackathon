import shutil

path = "enrichment/overpass.py"
shutil.copyfile(path, path + ".bak")

with open(path, "r", encoding="utf-8", newline="") as f:
    s = f.read()
nl = "\r\n" if "\r\n" in s else "\n"

old1 = '    "https://overpass-api.de/api/interpreter",'
new1 = ('    "https://overpass.openstreetmap.fr/api/interpreter",' + nl + old1)
old2 = "TIMEOUT_SECONDS = 25.0"
new2 = "TIMEOUT_SECONDS = 12.0"

for old in (old1, old2):
    n = s.count(old)
    assert n == 1, f"expected exactly 1 match, found {n} for: {old!r}"

s = s.replace(old1, new1).replace(old2, new2)
with open(path, "w", encoding="utf-8", newline="") as f:
    f.write(s)
print("patched OK")
