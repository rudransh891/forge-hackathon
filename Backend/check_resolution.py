import sys

import logging
logging.basicConfig(level=logging.INFO)

from dotenv import load_dotenv
load_dotenv()

from pathlib import Path
from ai.resolution import check_resolution, decide

before = Path(sys.argv[1]).read_bytes()
after = Path(sys.argv[2]).read_bytes()
check, model = check_resolution(before, after)
print("model:", model)
print("check:", check.model_dump())
print("decision at 0 m:", decide(check, 0.0))
