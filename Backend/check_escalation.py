import sys
sys.path.insert(0, ".")
from agents.escalation import run

hrs = float(sys.argv[1]) if len(sys.argv) > 1 else 0.0
res = run(dry_run=True, hours_ahead=hrs)
print("ok:", res["ok"], "| as_of:", res.get("as_of"), "| reason:", res.get("reason"))
shown = False
for d in res.get("decisions", []):
    print(f"  {d['id'][:8]} {d['issue']:15} late {d['late_h']} h  due level {d['level_due']}  -> {d['action']}")
    if d.get("body") and not shown:
        shown = True
        print("\n--- sample message ---\n" + d["subject"] + "\n" + d["body"] + "\n----------------------")
