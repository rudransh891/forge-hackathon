"""One-sentence severity explanation written by the LLM, then verified by code.
Returns None if no model produces a sentence that passes the checks."""
import json
import logging
import re

from openai import OpenAI

from ai.config import OPENROUTER_BASE_URL, MAX_OUTPUT_TOKENS, get_api_key, get_model_chain

log = logging.getLogger("fixit.severity_reason")

LLM_TIMEOUT_SECONDS = 12.0
MAX_CHARS = 300
NUM = re.compile(r"\d+(?:\.\d+)?")
LEVEL_WORDS = {"low", "medium", "high", "critical"}

SYSTEM = (
    "You write one short explanation of a civic issue's severity for a public dashboard. "
    "Use ONLY the facts in the JSON you are given. Do not add any number, place, road name "
    "or fact that is not in the JSON. Write exactly one sentence, at most 35 words, in plain "
    "English, and include the severity level word. If the evidence says a feature is "
    "'school-tagged' or a 'ground'/'playground', say 'school-tagged area' and never "
    "'school building'. Reply with the sentence only."
)


def _facts(res, issue_type):
    scored = [
        {"factor": k, "points": f["points"], "max": f["max"], "evidence": f["note"]}
        for k, f in res["factors"].items() if f["state"] == "scored"
    ]
    return {
        "issue_type": issue_type,
        "level": res["level"],
        "score": res["score"],
        "coverage": res["coverage"],
        "scored_factors": scored,
    }


def _passes(sentence, res, facts_text):
    if not sentence or "\n" in sentence or len(sentence) > MAX_CHARS:
        return False, "empty, multi-line or too long"
    allowed = set(NUM.findall(facts_text)) | {"100"}
    extra = [n for n in NUM.findall(sentence) if n not in allowed]
    if extra:
        return False, f"numbers not in the evidence: {extra}"
    words = set(re.findall(r"[a-z]+", sentence.lower()))
    if res["level"] not in words:
        return False, "does not state the level"
    other = (LEVEL_WORDS - {res["level"]}) & words
    if other:
        return False, f"mentions another level: {sorted(other)}"
    return True, ""


def write_reason(res, issue_type):
    facts = _facts(res, issue_type)
    facts_text = json.dumps(facts, ensure_ascii=False)
    try:
        client = OpenAI(base_url=OPENROUTER_BASE_URL, api_key=get_api_key(),
                        timeout=LLM_TIMEOUT_SECONDS, max_retries=0)
        models = get_model_chain()
    except Exception as e:
        log.warning("reason LLM not available: %s", type(e).__name__)
        return None

    for model in models:
        try:
            out = client.chat.completions.create(
                model=model, max_tokens=MAX_OUTPUT_TOKENS, temperature=0.2,
                messages=[{"role": "system", "content": SYSTEM},
                          {"role": "user", "content": facts_text}],
            )
            sentence = (out.choices[0].message.content or "").strip().strip('"')
            ok, why = _passes(sentence, res, facts_text)
            if ok:
                if res["missing"]:
                    sentence = sentence.rstrip(".") + ". Not assessed (data unavailable): " + ", ".join(res["missing"]) + "."
                return sentence
            log.warning("reason from %s rejected: %s", model, why)
        except Exception as e:
            log.warning("reason model %s failed: %s", model, type(e).__name__)
    return None
