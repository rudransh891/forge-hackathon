"""Routing table for the Prayagraj pilot.

Responsible bodies are NOT yet confirmed from official sources, so each entry says so.
The only verified official channel is UP Jansunwai (IGRS) / CM Helpline 1076.
"""

PILOT_CITY = "Prayagraj"

OFFICIAL_CHANNEL = {
    "name": "UP Jansunwai (IGRS) / CM Helpline",
    "portal": "https://jansunwai.up.nic.in",
    "helpline": "1076",
    "sources": [
        "https://prayagraj.nic.in/?p=2866",
        "https://upite.gov.in/Pages/cmhelpline.aspx",
        "https://ghaziabad.nic.in/?p=24709",
    ],
}

# issue_type -> (label for the complaint, readable issue name)
BODIES = {
    "pothole": ("Road maintenance (municipal roads or PWD, depending on the road)", "Pothole / road damage"),
    "garbage": ("Sanitation / solid waste (municipal)", "Garbage / waste"),
    "water_leak": ("Water supply and pipelines (responsible body to be confirmed)", "Water leak / pipe burst"),
    "drain_overflow": ("Drainage and sewerage (municipal)", "Drain or sewage overflow"),
    "streetlight": ("Street lighting (municipal)", "Streetlight not working"),
}
BODY_CONFIRMED = False
