import type { VariantShape } from "@workspace/api-zod";

/**
 * Seeded descriptor conventions for the most common mortgage document types.
 * Starting points, never locks — the builder always copies fields in and the
 * author can edit. Deterministic ids make the boot seed an idempotent upsert.
 */

const f = (key: string, label: string) => ({ key, label });
const single = { mode: "single" as const };
const monthly = { mode: "sequence" as const, expectedCount: 2 };

const def = (
  slug: string,
  name: string,
  variantNoun: string,
  descriptorFields: { key: string; label: string }[],
  docsPerVariant: VariantShape["docsPerVariant"] = single,
): VariantShape => ({ id: `vs-preset-${slug}`, name, variantNoun, descriptorFields, docsPerVariant, preset: true });

export const PRESET_SHAPES: VariantShape[] = [
  def("bank-statement", "Bank statement", "Bank account", [f("institution", "Institution"), f("account_last4", "Account ····")], monthly),
  def("pay-stub", "Pay stub", "Employment", [f("employer", "Employer"), f("employee", "Employee")], monthly),
  def("w2", "W-2", "Employer year", [f("employer", "Employer"), f("tax_year", "Tax year")]),
  def("1099", "1099", "Payer year", [f("payer", "Payer"), f("form_type", "Form type"), f("tax_year", "Tax year")]),
  def("tax-return", "Tax return", "Filing year", [f("filer", "Filer"), f("tax_year", "Tax year")]),
  def("gov-id", "Government ID", "ID holder", [f("holder", "Holder"), f("id_type", "ID type")]),
  def("passport", "Passport", "Passport holder", [f("holder", "Holder"), f("passport_last4", "Passport no. ····")]),
  def("ssa-award", "SSA / pension award letter", "Benefit", [f("recipient", "Recipient"), f("benefit_type", "Benefit type")]),
  def("voe-letter", "Employment verification letter", "Employment", [f("employer", "Employer"), f("employee", "Employee")]),
  def("mortgage-statement", "Mortgage statement", "Mortgage account", [f("servicer", "Servicer"), f("loan_last4", "Loan ····")], monthly),
  def("hoa-statement", "HOA statement", "HOA account", [f("association", "Association"), f("property", "Property")]),
  def("insurance-policy", "Insurance policy", "Policy", [f("carrier", "Carrier"), f("policy_last4", "Policy ····")]),
  def("utility-bill", "Utility bill", "Utility account", [f("provider", "Provider"), f("service_address", "Service address")]),
  def("brokerage-statement", "Retirement / brokerage statement", "Investment account", [f("institution", "Institution"), f("account_last4", "Account ····")], monthly),
  def("gift-letter", "Gift letter", "Gift", [f("donor", "Donor"), f("recipient", "Recipient")]),
  def("lease-agreement", "Lease agreement", "Lease", [f("property", "Property"), f("tenant", "Tenant")]),
  def("title-deed", "Title deed", "Property", [f("property", "Property"), f("parcel", "Parcel no.")]),
  def("credit-report", "Credit report", "Borrower report", [f("borrower", "Borrower"), f("bureau", "Bureau")]),
  def("business-license", "Business license", "Business", [f("business", "Business"), f("jurisdiction", "Jurisdiction")]),
  def("k1", "Schedule K-1", "Entity year", [f("entity", "Entity"), f("tax_year", "Tax year")]),
];
