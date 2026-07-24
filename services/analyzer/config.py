"""Analyzer configuration — everything model-related is env-driven so an engine
swap is config, never code (analyzer spec §1.1)."""
import os

PORTAL_API_BASE = os.environ.get("PORTAL_API_BASE", "http://127.0.0.1:80/api")

FIREWORKS_BASE = os.environ.get("FIREWORKS_BASE", "https://api.fireworks.ai/inference/v1")
FIREWORKS_API_KEY = os.environ.get("FIREWORKS_API_KEY", "")

# Anthropic — either a direct key or the Replit AI-integrations proxy pair.
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "") or os.environ.get("AI_INTEGRATIONS_ANTHROPIC_API_KEY", "")
ANTHROPIC_BASE = os.environ.get("AI_INTEGRATIONS_ANTHROPIC_BASE_URL", "https://api.anthropic.com")

# parse_document() backend (spec §1.1: PaddleOCR-VL self-hosted is the target;
# hosted interim is sanctioned, swap = config).
PARSE_BACKEND = os.environ.get("PARSE_BACKEND", "fireworks")     # fireworks | anthropic
PARSE_MODEL = os.environ.get("PARSE_MODEL", "")

# Judge (spec §1.2: frontier multimodal API in v1).
JUDGE_BACKEND = os.environ.get("JUDGE_BACKEND", "anthropic")     # anthropic | fireworks
JUDGE_MODEL = os.environ.get("JUDGE_MODEL", "claude-sonnet-4-6")

# Split/classify assist runs on TEXT (parsed md) — any strong text model.
TEXT_BACKEND = os.environ.get("TEXT_BACKEND", "fireworks")
TEXT_MODEL = os.environ.get("TEXT_MODEL", "accounts/fireworks/models/glm-5p2")

RENDER_DPI = int(os.environ.get("RENDER_DPI", "150"))
PARSE_CONCURRENCY = int(os.environ.get("PARSE_CONCURRENCY", "3"))
RUN_TIMEOUT_S = int(os.environ.get("RUN_TIMEOUT_S", "900"))
STORE_DIR = os.environ.get("ANALYZER_STORE", os.path.join(os.path.dirname(__file__), "store"))

PIPELINE_VERSION = (
    f"analyzer-0.1 parse={PARSE_BACKEND}:{PARSE_MODEL.rsplit('/', 1)[-1] or 'unset'}"
    f" judge={JUDGE_BACKEND}:{JUDGE_MODEL.rsplit('/', 1)[-1]}"
)


def missing_backends() -> list[str]:
    """Honest startup check — a run must fail loudly, never pretend (spec: no fabricated analysis)."""
    problems: list[str] = []
    if PARSE_BACKEND == "fireworks" and not FIREWORKS_API_KEY:
        problems.append("parse: FIREWORKS_API_KEY missing")
    if PARSE_BACKEND == "anthropic" and not ANTHROPIC_API_KEY:
        problems.append("parse: Anthropic credentials missing")
    if not PARSE_MODEL:
        problems.append("parse: PARSE_MODEL not set")
    if JUDGE_BACKEND == "anthropic" and not ANTHROPIC_API_KEY:
        problems.append("judge: Anthropic credentials missing")
    if JUDGE_BACKEND == "fireworks" and not FIREWORKS_API_KEY:
        problems.append("judge: FIREWORKS_API_KEY missing")
    return problems
