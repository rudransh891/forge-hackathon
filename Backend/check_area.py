import sys
sys.path.insert(0, ".")
from routing.area import in_pilot_area

tests = [("pothole 96249e3f", 25.42712, 81.77141, True),
         ("drain e73a7619", 25.444188, 81.825817, True),
         ("Lucknow (outside)", 26.8467, 80.9462, False),
         ("Varanasi (outside)", 25.3176, 82.9739, False)]
for name, lat, lng, expect in tests:
    res = in_pilot_area(lat, lng)
    print(f"{name:20} inside={res['inside']}  expected={expect}  {'OK' if res['inside'] == expect else 'MISMATCH'}")
