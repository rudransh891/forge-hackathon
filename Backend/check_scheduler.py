import logging

logging.basicConfig(level=logging.INFO)

from jobs.scheduler import escalation_tick, is_live

print("live mode:", is_live())
escalation_tick()
