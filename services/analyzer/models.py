"""Per-stage model registry — THE single source of truth for which engines can
run each pipeline stage (parse / text / judge). The portal proxies GET /models
from here so the dropdowns can never drift from what the worker actually runs.

A run may carry a plan of option ids; resolve_plan() turns ids into concrete
ModelChoice configs and FAILS LOUDLY on unknown or unavailable options — a run
must never silently fall back to a different engine than the one chosen
(extends the pipelineVersion honesty rule)."""
from dataclasses import dataclass, field

import config


@dataclass(frozen=True)
class ModelChoice:
    backend: str          # paddle | fireworks | anthropic | openai (generic OpenAI-compatible)
    model: str
    base_url: str = ""    # openai backend + paddle vl_rec_server_url
    api_key: str = ""     # openai backend + paddle vl_rec_api_key
    extra: dict = field(default_factory=dict)  # paddle: pipelineVersion

    def label(self) -> str:
        tail = self.model.rsplit("/", 1)[-1] or "unset"
        if self.backend == "paddle":
            return f"paddle:vl@{tail}"
        return f"{self.backend}:{tail}"


@dataclass(frozen=True)
class RunPlan:
    parse: ModelChoice
    text: ModelChoice
    judge: ModelChoice
    ids: dict = field(default_factory=dict)  # the option ids that were chosen (audit)

    def pipeline_version(self) -> str:
        return f"analyzer-0.1 parse={self.parse.label()} judge={self.judge.label()}"


def _env_default(stage: str) -> ModelChoice:
    """The env-configured backend for a stage — the system default."""
    if stage == "parse":
        if config.PARSE_BACKEND == "paddle":
            return ModelChoice("paddle", config.PADDLE_VL_MODEL, config.PADDLE_VL_URL,
                               config.FIREWORKS_API_KEY, {"pipelineVersion": "v1.6"})
        return ModelChoice(config.PARSE_BACKEND, config.PARSE_MODEL)
    if stage == "text":
        return ModelChoice(config.TEXT_BACKEND, config.TEXT_MODEL)
    return ModelChoice(config.JUDGE_BACKEND, config.JUDGE_MODEL)


# Registry entries: id -> (stage, label, status, note, choice-factory, missing-fn)
# status: validated = head-to-head tested on our packets; experimental = wired but unproven.
def _registry() -> dict[str, dict]:
    return {
        # ── parse ────────────────────────────────────────────────────────────
        "claude-parse": {
            "stage": "parse", "label": "Claude Sonnet (Anthropic)", "status": "validated",
            "note": "Hosted VLM parse — validated fallback. ~$10–30 / 1,000 pages.",
            "choice": lambda: ModelChoice("anthropic", "claude-sonnet-4-6"),
            "missing": lambda: [] if config.ANTHROPIC_API_KEY else ["Anthropic credentials"],
        },
        "mistral-ocr-4": {
            "stage": "parse", "label": "Mistral OCR 4 (Document AI)", "status": "experimental",
            "note": "Native document OCR — $4/1,000 pages, markdown + typed blocks + confidence. Quality unproven on our packets.",
            "choice": lambda: ModelChoice("mistral", config.MISTRAL_OCR_MODEL, config.MISTRAL_BASE,
                                          config.MISTRAL_API_KEY),
            "missing": lambda: [] if config.MISTRAL_API_KEY else ["MISTRAL_API_KEY"],
        },
        "paddle-vl-fireworks": {
            "stage": "parse", "label": "PaddleOCR-VL 1.6 (Fireworks GPU)", "status": "validated",
            "note": "Dedicated GPU deployment — may be disarmed; re-arm in the Fireworks console before use.",
            "choice": lambda: ModelChoice("paddle", config.PADDLE_VL_MODEL, config.PADDLE_VL_URL,
                                          config.FIREWORKS_API_KEY, {"pipelineVersion": "v1.6"}),
            "missing": lambda: [k for k, v in
                                [("PADDLE_VL_URL", config.PADDLE_VL_URL),
                                 ("FIREWORKS_API_KEY", config.FIREWORKS_API_KEY)] if not v],
        },
        "paddle-vl-novita": {
            "stage": "parse", "label": "PaddleOCR-VL (Novita serverless)", "status": "experimental",
            "note": "Serverless pay-per-token (~$0.02/1M). Older VL weights than 1.6 — quality unproven.",
            "choice": lambda: ModelChoice("paddle", "paddlepaddle/paddleocr-vl", config.NOVITA_BASE,
                                          config.NOVITA_API_KEY, {"pipelineVersion": "v1.6"}),
            "missing": lambda: [] if config.NOVITA_API_KEY else ["NOVITA_API_KEY"],
        },
        "deepseek-ocr2-novita": {
            "stage": "parse", "label": "DeepSeek-OCR 2 (Novita serverless)", "status": "experimental",
            "note": "Serverless pay-per-token (~$0.03/1M). Chat-shaped OCR — quality unproven on our packets.",
            "choice": lambda: ModelChoice("openai", "deepseek/deepseek-ocr-2",
                                          config.NOVITA_BASE, config.NOVITA_API_KEY),
            "missing": lambda: [] if config.NOVITA_API_KEY else ["NOVITA_API_KEY"],
        },
        # ── text (split/classify assist — text-only models allowed) ─────────
        "glm-5p2-fireworks": {
            "stage": "text", "label": "GLM-5.2 (Fireworks serverless)", "status": "validated",
            "note": "Strong reasoning text model — current default for split/classify.",
            "choice": lambda: ModelChoice("fireworks", "accounts/fireworks/models/glm-5p2"),
            "missing": lambda: [] if config.FIREWORKS_API_KEY else ["FIREWORKS_API_KEY"],
        },
        "claude-text": {
            "stage": "text", "label": "Claude Sonnet (Anthropic)", "status": "validated",
            "note": "Frontier fallback for split/classify.",
            "choice": lambda: ModelChoice("anthropic", "claude-sonnet-4-6"),
            "missing": lambda: [] if config.ANTHROPIC_API_KEY else ["Anthropic credentials"],
        },
        # ── judge (frontier multimodal — locked in v1, spec §1.2) ────────────
        "claude-judge": {
            "stage": "judge", "label": "Claude Sonnet (Anthropic)", "status": "validated",
            "note": "Locked in v1 — the independent multimodal judge (spec §1.2).",
            "choice": lambda: ModelChoice("anthropic", config.JUDGE_MODEL),
            "missing": lambda: [] if config.ANTHROPIC_API_KEY else ["Anthropic credentials"],
        },
    }


def _default_id(stage: str, reg: dict[str, dict]) -> str:
    """Map the env-configured backend to its registry id (system default)."""
    env = _env_default(stage)
    for oid, e in reg.items():
        if e["stage"] == stage and e["choice"]().backend == env.backend and e["choice"]().model == env.model:
            return oid
    # env points at something not in the registry — fall back to the first
    # available validated option for the stage (still honest: the resolved
    # choice is frozen into the run record either way).
    for oid, e in reg.items():
        if e["stage"] == stage and e["status"] == "validated" and not e["missing"]():
            return oid
    return next(oid for oid, e in reg.items() if e["stage"] == stage)


def list_options() -> dict:
    """Shape consumed by the portal's GET /models/options proxy."""
    reg = _registry()
    stages = []
    for stage in ("parse", "text", "judge"):
        default = _default_id(stage, reg)
        stages.append({
            "stage": stage,
            "locked": stage == "judge",
            "options": [
                {
                    "id": oid,
                    "label": e["label"],
                    "status": e["status"],
                    "note": e["note"],
                    "available": not e["missing"](),
                    **({"unavailableReason": "missing: " + ", ".join(e["missing"]())} if e["missing"]() else {}),
                    "default": oid == default,
                }
                for oid, e in reg.items() if e["stage"] == stage
            ],
        })
    return {"stages": stages}


def resolve_plan(plan_ids: dict | None) -> RunPlan:
    """Option ids -> concrete configs. Unknown/unavailable ids raise — the run
    fails loudly rather than running a different engine than was chosen."""
    reg = _registry()
    ids: dict[str, str] = {}
    choices: dict[str, ModelChoice] = {}
    for stage in ("parse", "text", "judge"):
        oid = (plan_ids or {}).get(stage)
        if oid is None:
            oid = _default_id(stage, reg)
        entry = reg.get(oid)
        if entry is None or entry["stage"] != stage:
            raise RuntimeError(f"unknown {stage} model option '{oid}'")
        missing = entry["missing"]()
        if missing:
            raise RuntimeError(f"{stage} option '{oid}' unavailable — missing: {', '.join(missing)}")
        ids[stage] = oid
        choices[stage] = entry["choice"]()
    return RunPlan(parse=choices["parse"], text=choices["text"], judge=choices["judge"], ids=ids)
