from pathlib import Path

p = Path("ai/pipeline.py")
src = p.read_text(encoding="utf-8")

old1 = "SET status = :status,"
new1 = "SET status = CASE WHEN status IN ('routed', 'escalated', 'acknowledged', 'in_progress') THEN status ELSE :status END,"

old2 = "ai_result = COALESCE(CAST(:ai_result AS jsonb), ai_result)"
new2 = "ai_result = CASE WHEN CAST(:ai_result AS jsonb) IS NULL THEN ai_result ELSE COALESCE(ai_result, '{}'::jsonb) || CAST(:ai_result AS jsonb) END"

for old in (old1, old2):
    assert src.count(old) == 1, f"expected 1 match for {old!r}, found {src.count(old)}"

Path("ai/pipeline.py.bak").write_text(src, encoding="utf-8")
p.write_text(src.replace(old1, new1).replace(old2, new2), encoding="utf-8")
print("patched OK")
