"""The judge (spec §1.2, §2.6): an independent multimodal check — page image +
parsed md + pre-flight flags -> quality/formatting/fraud-signal scores,
description, and the universal core fields (§1.4) that make the portal's clocks
computable. Core fields are ungrounded in v1; the verdict UI makes a human
confirm the dates. AI never writes verdicts (§1.6).

Each call also returns audit metadata (raw response, tokens, latency) so the
runner can persist the complete pre-mapping output as judge/doc-<N>.json
(judge-verdict-artifacts spec) — every score a human sees stays traceable."""
import time

from llm import chat_with_meta, extract_json
from models import ModelChoice

PROMPT_VERSION = "judge-v1"  # bump on ANY prompt change — recorded in every artifact + config.json

RAW_RESPONSE_CAP = 2_000_000  # pathological guard only; audit artifacts stay untruncated below this

PROMPT_TMPL = """You are the independent judge in a mortgage document pipeline. You see page image(s) of ONE document plus its machine-parsed markdown. Assess honestly.

Document type suggestion: {tax_display}
Pre-flight flags touching these pages: {pf_flags}

Parsed markdown (may be imperfect — you are the check on it):
{md}

Answer ONLY JSON:
{{
  "quality": 0.0-1.0,            // legibility/scan quality of the document itself
  "formatting": 0.0-1.0,         // is it complete & well-formed for its type (all pages, signatures, fields)
{fraud_line}  "description": "one factual line about this document",
  "flags": [{{"code": "snake_case_code", "detail": "plain-language finding"}}],
  "core_fields": {{
    "document_date": "YYYY-MM-DD or unknown",   // the date the document speaks from (statement end, issue date)
    "expiry_date": "YYYY-MM-DD",                 // ONLY if printed on the document; omit otherwise
    "primary_party_name": "person/entity the document is about, or unknown",
    "issuing_party": "who produced it"           // omit if unclear
  }}
}}
Only report what you can actually see. Do not invent dates or names."""


FRAUD_LINE = '  "fraud_signal": 0.0-1.0,       // visual anomalies only: inconsistent fonts, misaligned edits, pasted regions. 0 = nothing suspicious\n'


def prompt_version(fraud_scoring: bool = True) -> str:
    """Exact prompt variant, derivable from the recorded string: '-nofraud' means
    the fraud_signal line was omitted — the score is ABSENT, never a fake 0."""
    return PROMPT_VERSION if fraud_scoring else f"{PROMPT_VERSION}-nofraud"


async def judge_document(tax_display: str, md_excerpt: str, image_paths: list[str],
                         pf_flags: list[str], judge: ModelChoice,
                         fraud_scoring: bool = True) -> tuple[dict, dict]:
    """Returns (verdict, meta). verdict = the mapped subset the sidecar carries;
    meta = audit fields (raw_response/model/tokens/latencyMs/promptVersion) for
    the write-once judge artifact. fraud_scoring=False (per-run plan toggle)
    drops fraud_signal from the prompt AND the verdict — absent, never fake-0."""
    prompt = PROMPT_TMPL.format(tax_display=tax_display, pf_flags="; ".join(pf_flags) or "none",
                                md=md_excerpt[:4000], fraud_line=FRAUD_LINE if fraud_scoring else "")
    t0 = time.monotonic()

    async def ask() -> tuple[dict, str, dict | None]:
        text, tokens = await chat_with_meta(judge.backend, judge.model, prompt, image_paths, max_tokens=1200,
                                            base_url=judge.base_url, api_key=judge.api_key)
        keys = ("quality", "formatting", "fraud_signal") if fraud_scoring else ("quality", "formatting")
        return extract_json(text, required_keys=keys), text, tokens

    try:
        out, raw, tokens = await ask()
    except ValueError:  # one retry on malformed output — a judged doc is contract-critical, a whole-run failure is worse
        out, raw, tokens = await ask()
    latency_ms = int((time.monotonic() - t0) * 1000)

    def clamp(v, d=0.5):
        try:
            return max(0.0, min(1.0, float(v)))
        except (TypeError, ValueError):
            return d

    cf_in = out.get("core_fields") or {}
    core = {
        "document_date": str(cf_in.get("document_date") or "unknown"),
        "primary_party_name": str(cf_in.get("primary_party_name") or "unknown"),
    }
    if cf_in.get("expiry_date"):
        core["expiry_date"] = str(cf_in["expiry_date"])
    if cf_in.get("issuing_party"):
        core["issuing_party"] = str(cf_in["issuing_party"])

    flags = [
        {"code": str(f.get("code", "finding"))[:40], "detail": str(f.get("detail", ""))[:300]}
        for f in out.get("flags", []) if isinstance(f, dict) and f.get("detail")
    ]
    verdict = {
        "quality": clamp(out.get("quality")),
        "formatting": clamp(out.get("formatting")),
        # fraud off => key absent everywhere downstream ("not scored"), never 0.0
        **({"fraud_signal": clamp(out.get("fraud_signal"), d=0.0)} if fraud_scoring else {}),
        "description": str(out.get("description", ""))[:300],
        "flags": flags,
        "core_fields": core,
    }
    meta = {
        "raw_response": raw[:RAW_RESPONSE_CAP],
        "truncated": len(raw) > RAW_RESPONSE_CAP,
        "model": judge.model,
        "backend": judge.backend,
        "promptVersion": prompt_version(fraud_scoring),
        "fraudScoring": fraud_scoring,
        "tokens": tokens,  # exactly what the API reported — never estimated; None when unreported
        "latencyMs": latency_ms,
    }
    return verdict, meta
