"""Derived names, never hand-written (spec §2.8):
<document_date>_<blockId-or-type>_<issuing_party?>_<primary_party_lastname>.pdf
Human rename always wins portal-side and is recorded there."""
import re


def _slug(s: str, max_len: int = 40) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s[:max_len].rstrip("-")


def derive_name(document_date: str, block_or_type: str, issuing_party: str | None,
                primary_party_name: str, taken: set[str]) -> str:
    date = document_date if re.fullmatch(r"\d{4}-\d{2}-\d{2}", document_date or "") else "undated"
    last = _slug((primary_party_name or "").split()[-1]) if (primary_party_name or "").strip() else "unknown"
    parts = [date, _slug(block_or_type)]
    if issuing_party:
        parts.append(_slug(issuing_party))
    parts.append(last or "unknown")
    base = "_".join(p for p in parts if p)
    name, n = f"{base}.pdf", 2
    while name in taken:
        name, n = f"{base}-{n}.pdf", n + 1
    taken.add(name)
    return name
