"""Severity scoring configuration. All weights and thresholds live here.

Deadlines are PROPOSED service levels chosen by the FixIt Bharat team,
not official municipal commitments.
"""

# Maximum points per factor (sums to 100)
WEIGHTS = {
    "damage": 40,
    "road": 20,
    "places": 15,
    "conditions": 10,
    "confirmations": 15,
}

# --- Damage (from the vision model) ---
# Base points by estimated size, plus hazard indicators, capped at WEIGHTS["damage"].
SIZE_POINTS = {"small": 12, "medium": 24, "large": 32}
HAZARD_POINTS_EACH = 2
HAZARD_POINTS_MAX = 8

# --- Road importance (OpenStreetMap highway class) ---
ROAD_POINTS = {
    "motorway": 20, "trunk": 20, "primary": 20,
    "secondary": 16, "tertiary": 12,
    "unclassified": 8, "residential": 6,
    "service": 3, "track": 2, "path": 2, "footway": 2,
}
ROAD_DEFAULT_POINTS = 4  # known road, class not listed above

# --- Sensitive places (within the enrichment radius, currently 200 m) ---
# Closest school or hospital decides the points; bus stops add a little.
PLACE_NEAR_M = 100
PLACE_POINTS_NEAR = 15   # school/hospital within PLACE_NEAR_M
PLACE_POINTS_FAR = 10    # school/hospital beyond that, inside the radius
BUS_STOP_POINTS = 4

# --- Weather / air quality: which issue types use which signal ---
CONDITION_SIGNAL = {
    "pothole": "rain",
    "drain_overflow": "rain",
    "water_leak": "rain",
    "garbage": "air",
    "streetlight": None,   # not applicable
}
# Rain in the last 24 h (mm) -> points
RAIN_THRESHOLDS = [(10.0, 10), (2.5, 6), (0.1, 3)]  # checked top-down; below all -> 0
# Modelled US AQI (0-500) -> points; checked top-down, below all -> 0
AIR_THRESHOLDS = [(151, 10), (101, 7), (51, 3)]

# --- Confirmations (a report starts with 1) ---
CONFIRM_POINTS_EACH = 5   # per extra confirmation
# capped at WEIGHTS["confirmations"]

# --- Levels: (minimum score on the 0-100 scale, level) ---
LEVELS = [(75, "critical"), (50, "high"), (25, "medium"), (0, "low")]

# --- Proposed response deadlines (hours) ---
DEADLINE_HOURS = {"critical": 24, "high": 72, "medium": 168, "low": 336}

# A score with any missing factor is provisional and cannot exceed this level
PROVISIONAL_MAX_LEVEL = "medium"
