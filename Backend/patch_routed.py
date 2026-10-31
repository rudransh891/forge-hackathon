from pathlib import Path

p = Path("routing/service.py")
src = p.read_text(encoding="utf-8")

old1 = 'def _save(report_id, status, record, note):'
new1 = 'def _save(report_id, status, record, note, set_routed=False):'

old2 = 'c.execute(text("INSERT INTO status_events (report_id, status, note) VALUES (:i, :s, :n)"),'
new2 = (
    'if set_routed:\n'
    '            c.execute(text("UPDATE reports SET status = \'routed\' WHERE id = :i AND status = \'analysed\'"),\n'
    '                      {"i": report_id})\n'
    '        c.execute(text("INSERT INTO status_events (report_id, status, note) VALUES (:i, :s, :n)"),'
)

old3 = '_save(report_id, r["status"], rec, note)'
new3 = ('_save(report_id, "routed" if (delivery["ok"] and r["status"] == "analysed") else r["status"], '
        'rec, note, set_routed=bool(delivery["ok"]))')

for old in (old1, old2, old3):
    assert src.count(old) == 1, f"expected 1 match for {old!r}, found {src.count(old)}"

Path("routing/service.py.bak").write_text(src, encoding="utf-8")
src = src.replace(old1, new1).replace(old2, new2).replace(old3, new3)
p.write_text(src, encoding="utf-8")
print("patched OK")
