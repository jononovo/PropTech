"""Global document-type taxonomy (analyzer spec §4) — ids match the portal's
builder dropdown exactly. Detection hints seeded with standard mortgage form IDs
(§4: printed form IDs are the highest-yield deterministic signal; they never
hallucinate). Classifier contract: output a taxonomy id or 'unassigned' — never
an invented category."""

TAXONOMY: dict[str, dict] = {
    "application_form":          {"display": "Loan Application (URLA)", "hints": ["URLA", "Form 1003", "Uniform Residential Loan Application"]},
    "appraisal_report":          {"display": "Appraisal Report", "hints": ["Uniform Residential Appraisal Report", "Form 1004", "appraisal"]},
    "background_check":          {"display": "Background Check", "hints": ["background check", "criminal history", "DOJ"]},
    "bank_statement":            {"display": "Bank Statement", "hints": ["account statement", "statement period", "beginning balance", "ending balance"]},
    "closing_disclosure":        {"display": "Closing Disclosure", "hints": ["Closing Disclosure", "CD", "loan terms", "cash to close"]},
    "credit_report":             {"display": "Credit Report", "hints": ["credit report", "tri-merge", "FICO", "credit score"]},
    "disclosure_acknowledgment": {"display": "Disclosure Acknowledgment", "hints": ["Loan Estimate", "disclosure", "acknowledgment", "TRID"]},
    "gift_letter":               {"display": "Gift Letter", "hints": ["gift letter", "donor", "no repayment expected"]},
    "government_id":             {"display": "Government ID", "hints": ["driver license", "passport", "identification card", "DMV"]},
    "insurance_binder":          {"display": "Insurance Binder", "hints": ["evidence of insurance", "binder", "homeowner's policy", "declarations page"]},
    "pay_stub":                  {"display": "Pay Stub", "hints": ["earnings statement", "pay period", "gross pay", "net pay", "YTD"]},
    "property_deed":             {"display": "Property Deed", "hints": ["grant deed", "deed of trust", "recorded", "APN"]},
    "purchase_agreement":        {"display": "Purchase Agreement", "hints": ["purchase agreement", "CAR Form RPA", "residential purchase agreement", "escrow"]},
    "ssn_verification":          {"display": "SSN Verification", "hints": ["Social Security", "SSA", "SSN verification", "Form 4506"]},
    "title_report":              {"display": "Title Report", "hints": ["preliminary title report", "title commitment", "schedule B", "exceptions"]},
    "w2_or_tax_return":          {"display": "W-2 / Tax Return", "hints": ["W-2", "Wage and Tax Statement", "Form 1040", "4506-C", "tax return"]},
}

# (regex-ready literal, taxonomy id) — checked against parsed page markdown.
FORM_ID_SIGNALS: list[tuple[str, str]] = [
    ("Uniform Residential Loan Application", "application_form"),
    ("Form 1003", "application_form"),
    ("URLA", "application_form"),
    ("Uniform Residential Appraisal Report", "appraisal_report"),
    ("Form 1004", "appraisal_report"),
    ("Closing Disclosure", "closing_disclosure"),
    ("Loan Estimate", "disclosure_acknowledgment"),
    ("Wage and Tax Statement", "w2_or_tax_return"),
    ("W-2", "w2_or_tax_return"),
    ("4506-C", "w2_or_tax_return"),
    ("Form 1040", "w2_or_tax_return"),
    ("Residential Purchase Agreement", "purchase_agreement"),
    ("Preliminary Title Report", "title_report"),
    ("Earnings Statement", "pay_stub"),
    ("Gift Letter", "gift_letter"),
    # Boundary-only signals (spec v0.6.3 §2 lists 1008 as a split signal). The
    # sentinel id is not in TAXONOMY, so it can only start a new segment —
    # classification runs separately and can never emit it.
    ("Uniform Underwriting and Transmittal Summary", "form_1008"),
    ("Form 1008", "form_1008"),
]
