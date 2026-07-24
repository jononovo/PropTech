"""Analyzer configuration — everything model-related is env-driven so an engine
swap is config, never code (analyzer spec §1.1)."""
import os

PORTAL_API_BASE = os.environ.get("PORTAL_API_BASE", "http://127.0.0.1:80/api")

FIREWORKS_BASE = os.environ.get("FIREWORKS_BASE", "https://api.fireworks.ai/inference/v1")
FIREWORKS_API_KEY = os.environ.get("FIREWORKS_API_KEY", "")

# Anthropic — either a direct key or the Replit AI-integrations proxy pair.
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "") or os.environ.get("AI_INTEGRATIONS_ANTHROPIC_API_KEY", "")
ANTHROPIC_BASE = os.environ.get("AI_INTEGRATIONS_ANTHROPIC_BASE_URL", "https://api.anthropic.com")

# parse_document() backend (spec §1.1: PaddleOCR-VL 1.6 is the target engine;
# hosted-VLM interim is sanctioned, swap = config).
PARSE_BACKEND = os.environ.get("PARSE_BACKEND", "fireworks")     # paddle | fireworks | anthropic
PARSE_MODEL = os.environ.get("PARSE_MODEL", "")

# Paddle pipeline (spec §1.1): PP-DocLayoutV3 local, VL recognition against the
# Fireworks deployment's OpenAI-compatible endpoint (vllm-server backend).
PADDLE_VL_URL = os.environ.get("PADDLE_VL_URL", "")       # e.g. https://api.fireworks.ai/inference/v1
PADDLE_VL_MODEL = os.environ.get("PADDLE_VL_MODEL", "")   # e.g. accounts/creditclaw/deployments/p4tlc3h1

# Judge (spec §1.2: frontier multimodal API in v1).
JUDGE_BACKEND = os.environ.get("JUDGE_BACKEND", "anthropic")     # anthropic | fireworks
JUDGE_MODEL = os.environ.get("JUDGE_MODEL", "claude-sonnet-4-6")

# Split/classify assist runs on TEXT (parsed md) — any strong text model.
TEXT_BACKEND = os.environ.get("TEXT_BACKEND", "fireworks")
TEXT_MODEL = os.environ.get("TEXT_MODEL", "accounts/fireworks/models/glm-5p2")

RENDER_DPI = int(os.environ.get("RENDER_DPI", "150"))
PARSE_CONCURRENCY = int(os.environ.get("PARSE_CONCURRENCY", "3"))
RUN_TIMEOUT_S = int(os.environ.get("RUN_TIMEOUT_S", "900"))

# VL deployment readiness gate (vl_ready.py) — scale-to-zero cold starts get
# their own budget, separate from RUN_TIMEOUT_S (measured 10+ min on 2026-07-24).
VL_READY_POLL_S = float(os.environ.get("VL_READY_POLL_S", "15"))
VL_READY_TIMEOUT_S = float(os.environ.get("VL_READY_TIMEOUT_S", "1200"))
STORE_DIR = os.environ.get("ANALYZER_STORE", os.path.join(os.path.dirname(__file__), "store"))

_PARSE_LABEL = (
    f"paddle:vl-1.6@{PADDLE_VL_MODEL.rsplit('/', 1)[-1] or 'unset'}"
    if PARSE_BACKEND == "paddle"
    else f"{PARSE_BACKEND}:{PARSE_MODEL.rsplit('/', 1)[-1] or 'unset'}"
)
PIPELINE_VERSION = (
    f"analyzer-0.1 parse={_PARSE_LABEL}"
    f" judge={JUDGE_BACKEND}:{JUDGE_MODEL.rsplit('/', 1)[-1]}"
)


def missing_backends() -> list[str]:
    """Honest startup check — a run must fail loudly, never pretend (spec: no fabricated analysis)."""
    problems: list[str] = []
    if PARSE_BACKEND == "fireworks" and not FIREWORKS_API_KEY:
        problems.append("parse: FIREWORKS_API_KEY missing")
    if PARSE_BACKEND == "anthropic" and not ANTHROPIC_API_KEY:
        problems.append("parse: Anthropic credentials missing")
    if PARSE_BACKEND == "paddle":
        if not PADDLE_VL_URL:
            problems.append("parse: PADDLE_VL_URL missing (deployment endpoint)")
        if not FIREWORKS_API_KEY:
            problems.append("parse: FIREWORKS_API_KEY missing (deployment auth)")
    elif not PARSE_MODEL:
        problems.append("parse: PARSE_MODEL not set")
    if JUDGE_BACKEND == "anthropic" and not ANTHROPIC_API_KEY:
        problems.append("judge: Anthropic credentials missing")
    if JUDGE_BACKEND == "fireworks" and not FIREWORKS_API_KEY:
        problems.append("judge: FIREWORKS_API_KEY missing")
    return problems
