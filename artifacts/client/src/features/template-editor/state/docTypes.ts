// Analyzer taxonomy ids (analyzer spec §4–6, plus the ids the seed templates
// were tagged with on creation). docType is an OPEN string in the contract —
// absent/unknown values fall back to name-matching — so this list is a UI
// affordance, not enforcement. The engine's taxonomy registry becomes the
// source of truth when it lands.
export const DOC_TYPES = [
  { id: "application_form", label: "Application form" },
  { id: "appraisal_report", label: "Appraisal report" },
  { id: "background_check", label: "Background check" },
  { id: "bank_statement", label: "Bank statement" },
  { id: "closing_disclosure", label: "Closing disclosure" },
  { id: "credit_report", label: "Credit report" },
  { id: "disclosure_acknowledgment", label: "Disclosure acknowledgment" },
  { id: "gift_letter", label: "Gift letter" },
  { id: "government_id", label: "Government ID" },
  { id: "insurance_binder", label: "Insurance binder" },
  { id: "pay_stub", label: "Pay stub" },
  { id: "property_deed", label: "Property deed" },
  { id: "purchase_agreement", label: "Purchase agreement" },
  { id: "ssn_verification", label: "SSN verification" },
  { id: "title_report", label: "Title report" },
  { id: "w2_or_tax_return", label: "W-2 / tax return" },
];
