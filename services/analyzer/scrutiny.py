"""Scrutiny rules — implements the portal's schema-spec §4 verbatim:
tier = f(block criticality); substitution scrutiny (alternative satisfying a
critical primary escalates one tier + review flag); overlap escalation -> deep
scan across the workfile. v1 fraud scope (analyzer spec §2.5): metadata/visual
anomalies + core-field consistency. NO amount-level checks until v2."""

TIERS = ["supporting", "standard", "critical"]


def escalate(tier: str) -> str:
    i = TIERS.index(tier) if tier in TIERS else 1
    return TIERS[min(i + 1, 2)]


def block_index(template: dict) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for s in template.get("sections", []):
        for ss in s.get("subsections", []):
            for b in ss.get("blocks", []):
                if b.get("kind") == "document":
                    out[b["id"]] = {**b, "_section": s.get("name", "")}
    return out


def apply_substitution_scrutiny(docs: list[dict], template: dict, blocks: dict[str, dict]) -> None:
    """§4.2: filed alternative + critical primary -> escalate one tier + flag."""
    filed = {d["suggestedBlockId"] for d in docs}
    for group in template.get("alternatives", []) or []:
        primary = group.get("primary")
        if primary in filed or primary not in blocks:
            continue
        if (blocks[primary].get("criticality") or "standard") != "critical":
            continue
        for member in group.get("satisfiedBy", []):
            if member not in filed:
                continue
            for d in docs:
                if d["suggestedBlockId"] == member:
                    d["scores"]["scrutinyTier"] = escalate(d["scores"]["scrutinyTier"])
                    d["flags"].append({
                        "code": "satisfied_by_alternative",
                        "detail": f"Filed in place of {blocks[primary].get('name', primary)} "
                                  f"({group.get('name', 'alternative group')}). Substitution scrutiny applied.",
                    })
                    d["_substituted_critical"] = True


def needs_deep_scan(docs: list[dict], blocks: dict[str, dict]) -> list[str]:
    """§4.3 overlap escalation triggers. Returns plain-language reasons (empty = no deep scan)."""
    reasons: list[str] = []
    for d in docs:
        b = blocks.get(d["suggestedBlockId"], {})
        if (b.get("criticality") == "critical") and (b.get("sourcing") == "scarce"):
            reasons.append(f"{b.get('name', d['suggestedBlockId'])}: critical + scarce sourcing")
        if d.get("_substituted_critical"):
            reasons.append(f"{d['suggestedBlockId']}: critical requirement satisfied by alternative")
    by_section: dict[str, int] = {}
    for d in docs:
        b = blocks.get(d["suggestedBlockId"], {})
        if b.get("criticality") == "critical" and d["scores"]["quality"] < 0.6:
            key = b.get("_section", "?")
            by_section[key] = by_section.get(key, 0) + 1
    reasons.extend(f"section '{k}': {v} critical documents below quality threshold" for k, v in by_section.items() if v >= 2)
    return reasons


def deep_scan(docs: list[dict], applicant_name: str) -> list[dict]:
    """Cross-document consistency pass (v1 scope): names and date sanity across
    the workfile. Returns run-level findings appended as flags on the docs involved."""
    findings: list[dict] = []
    applicant = _norm(applicant_name)
    for d in docs:
        name = _norm(d["coreFields"].get("primary_party_name", ""))
        if name and name != "unknown" and applicant and not _name_overlap(name, applicant):
            f = {"code": "party_mismatch",
                 "detail": f"Primary party '{d['coreFields']['primary_party_name']}' does not match applicant '{applicant_name}'."}
            d["flags"].append(f)
            findings.append(f)
        dd, xd = d["coreFields"].get("document_date", ""), d["coreFields"].get("expiry_date", "")
        if len(dd) == 10 and len(xd) == 10 and xd < dd:
            f = {"code": "date_inconsistency", "detail": f"Expiry {xd} precedes document date {dd}."}
            d["flags"].append(f)
            findings.append(f)
    return findings


def _norm(s: str) -> str:
    return " ".join("".join(c.lower() if c.isalnum() or c == " " else " " for c in s).split())


def _name_overlap(a: str, b: str) -> bool:
    ta, tb = set(a.split()), set(b.split())
    return bool(ta & tb)
