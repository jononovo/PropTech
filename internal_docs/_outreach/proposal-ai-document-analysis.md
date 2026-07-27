# Proposal — AI Document Analysis & Allocation for Lending

**Working title:** Sheaf
**Prepared for:** Homium
**Status:** Draft for discussion

---

## Motivation

Every loan file begins the same way: a folder of disparate files. Photos of a driver's license taken on a phone — front in one image, back in another. A 38-page scan where a URLA, three paystubs, and two bank statements were fed through the scanner in one pass. Files named `IMG_4club2.jpg`, `scan_final_FINAL.pdf`, `doc(3).pdf`. Some rotated, some skewed, some duplicated.

Today, a human untangles this by hand. It is slow, error-prone, and — critically for compliance — undocumented. Nobody records *why* pages 12–17 were treated as one bank statement, or who decided the blurry paystub was acceptable.

We propose to explore what current AI document models can actually do here, end to end:

- **Compliance** — is every required document present, complete, and current?
- **Fraud** — do documents show signs of tampering, template reuse, or inconsistency across the file?
- **Quality** — is each document legible, complete, and usable, or should a better version be requested?
- **Document adjustment** — straightening skewed scans, splitting multi-document files apart, and merging files that belong together (the canonical case: driver's license front and back arriving as two separate photos).

**The input contract is deliberately brutal:** a folder of files, uploaded with arbitrary or incoherent names, in any form — PDFs, phone photos, scans of scans.

**The output contract is deliberately clean:**

1. **Per document** — each real-world document extracted as its own clean, named, straightened file with a structured analysis attached.
2. **Per requirement** — each document allocated to the checklist item it satisfies. If the loan product requires bank statements and the borrower has four accounts, the result is four correctly named statements, all indexed under that one requirement.
3. **AI-indexable throughout** — every artifact (transcripts, scores, decisions, allocations) stored in formats an AI can search, cite, and reason over, so the corpus supports downstream Q&A, cross-document checks, and analyses we haven't designed yet.

---

## Stage 1 — Research, architecture, and the requirements framework

### Step 1: Deep research (models and industry)

Before writing product code, the team does focused research on two fronts.

**Industry.** How lenders actually assemble files today: which document types dominate, what checklists look like across loan products, where fraud is actually caught, and what compliance regimes require to be *recorded* (not just decided).

**Models.** The OCR/parse layer is the foundation everything sits on, and the field is moving fast. We will evaluate head-to-head, on realistic messy lending documents:

| Candidate | Type | Key questions |
|---|---|---|
| **PaddleOCR-VL 1.6** | Open weights, self-hosted | Hosting and ops cost; GPU footprint; fine-tuning on lending documents; layout/element fidelity on rotated & skewed scans |
| **DeepSeek-OCR** | Open weights | Accuracy vs. Paddle on dense forms; throughput; hosting profile |
| **Unlimited-OCR** (Baidu, 3B, built on DeepSeek-OCR) | Open weights, self-hosted | One-shot long-horizon parsing of whole multi-page documents; accuracy vs. its DeepSeek base; hosting footprint |
| **Mistral OCR** | Hosted API | Quality on photos vs. flatbed scans; per-page cost at volume; latency; data-handling terms |

For the self-hosted candidates (Paddle 1.6 especially), research explicitly covers **how to host it, manage it, and fine-tune it**: deployment options, warm-vs-cold economics, and what a lending-specific fine-tune would require. This is research only — establishing feasibility and cost so the option is understood, not committing to it.

**The dovetail question.** Raw OCR output is not the deliverable. The real evaluation criterion is how each model's output *feeds an analysis framework efficiently*:

- Does it emit **structured elements** (tables, key-value pairs, checkboxes, signatures) or just text?
- Can its output be normalized into a common intermediate format — page-level markdown plus an elements JSON — regardless of which backend produced it?
- Does that format give downstream models (classifiers, judges, fraud scanners) what they need without re-parsing?
- Is the result **indexable**: can an AI search it, cite page-level sources, and run additional analysis passes later without touching the original binary?

The research output is a written recommendation: which backend(s) to use for which document classes, what it costs per file, and the common intermediate format the rest of the system builds on. We expect a *pluggable* answer — backends will keep changing; the intermediate format should not.

### Step 2: Application structure and the testing framework

With a parse layer chosen, the team crafts the application structure — on paper and in markdown before code:

- **Pipeline shape** — intake → parse → split/classify → adjust (straighten, split, merge) → judge (quality / compliance / fraud) → allocate to requirements → human review.
- **Storage shape** — original files preserved untouched; extracted documents as clean files; every analysis as markdown with structured frontmatter so both humans and AI read the same artifact.
- **Markdown-first prototyping** — we build markdown versions of the key artifacts (document transcripts, analysis reports, requirement checklists) and validate the *shapes* with realistic examples before building UI.

Crucially, this step includes a **testing framework for loan products and requirements**. Loan products vary enormously — a product's checklist can include up to **~100 distinct documents**. The framework lets us define a product, its requirements, and its acceptance rules, then run sample folders through the pipeline and score how well documents land.

### Step 3: The requirements framework and form builder

The testing framework graduates into a product feature: a system for **managing loan-product requirements**, with a **form builder** on top.

- A staff user composes a loan product's requirement set: each requirement has a name, the document types that can satisfy it, cardinality (one paystub vs. "all accounts' statements"), recency rules, and acceptance criteria.
- The form builder's underlying output is **JSON** — a machine-readable requirements schema, not a rendered form. This is the point: the same JSON that drives the human-facing checklist is handed directly to the AI, so the model *understands the requirements natively* and can match scanned documents to the correct requirement(s) without a translation layer.
- The matcher connects analysis to allocation: a classified, judged document is scored against every open requirement, allocated to the best match (or several, where one document satisfies more than one requirement), and named per the requirement's naming convention — the four-bank-accounts case falls out of this naturally.

### Stage 1 exit criteria

- Model recommendation written, with measured cost/quality numbers on lending documents.
- Common intermediate format defined and demonstrated across at least two parse backends.
- Pipeline processes a messy sample folder end to end: clean per-document outputs, per-requirement allocation, human review gate, full decision ledger.
- Requirements JSON schema + form builder working for at least two real loan products.

---

## Stage 2 — Real-world data: tweaking and analysis

Stage 1 proves the shape on curated samples. Stage 2 is about contact with reality.

- **Real files, at volume.** Run genuine (appropriately permissioned) loan folders through the pipeline. Measure where classification, splitting, and allocation actually fail — the errors real data produces are never the ones test data predicts.
- **Real customer data as the capability benchmark.** Beyond finding failures, this is where we honestly measure how efficient and capable these models actually are on the real thing: accuracy, cost per file, and time saved versus manual assembly, reported with numbers.
- **Adversarial document testing.** Deliberately hard inputs: complex merged files containing multiple document types in one scan, photographed documents, and crooked or hard-to-read scans — driver's licenses and IDs especially, where skew, glare, and low resolution are the norm.
- **Threshold tuning.** Quality, fraud, and confidence thresholds calibrated against human reviewer agreement, not intuition. Track where reviewers override the machine and feed that back.
- **Fraud depth.** Move beyond single-document signals to cross-document analysis: consistency of names, addresses, employers, and figures across the whole file — the checks only an indexed corpus makes cheap.
- **AI search and Q&A over the corpus.** With every document and analysis stored as indexed markdown, Stage 2 delivers the payoff of the indexability requirement: ask questions across a loan file ("what was the average balance across all four accounts?") with page-level citations.
- **Requirement analytics.** Which requirements cause the most friction, the most re-requests, the most fraud flags — data the form builder then uses to improve the products themselves.

---

## Next steps (post–Stage 2)

Beyond Stage 2 lie the harder problems that turn a capable pipeline into something that actually works in production. These are deliberately listed as challenges, not commitments:

- **Review page for the real world.** Harden the human review surface against real-world scenarios and edge cases — the messy files, partial decisions, and interruptions that curated testing never produces.
- **Smarter merge suggestions.** Matching new pages to documents that were *already approved* — e.g., additional bank statement pages arriving after the statement was signed off — and proposing the merge without silently reopening a settled decision.
- **Duplicate flagging, auditable.** Detect re-uploads and near-duplicates, flag them, and store the determination as an auditable record rather than silently dropping files.
- **Visual overlays on suspicious elements.** Highlight regions of a document — stamps, signatures, dates — directly on the page image when analysis finds them suspicious, so a reviewer sees *where*, not just *that*.
- **Reversing approved documents.** A governed path to un-approve: what happens downstream, what gets re-opened, and how the reversal is recorded.
- **Dual-approval authentication.** Required double-check by differently authenticated roles — Originator and Underwriter both review and approve, with one role senior and able to override. Approval becomes a two-key operation tied to identity.
- **In-person competitor analysis.** Sales calls and demo onboarding with competing products, to understand their analysis depth, compliance flow, and UI capabilities from the inside rather than from marketing pages.
- **Real-world pilot.** Live applications with multi-user document submission and approval flows — the full loop, under real conditions.

---

## Beyond this scope

This proposal covers the analysis-and-allocation core. Around it, a fuller product will need — and this outline deliberately leaves open — borrower-facing intake, staff workflow and communication, audit/register views, retention policies, and access control. Those are listed here to bound the scope, not to specify it; the feature set above is the starting point the rest is designed around.

---

## Summary of deliverables

| # | Deliverable | Stage |
|---|---|---|
| 1 | Model research report (Paddle 1.6 vs. DeepSeek-OCR vs. Unlimited-OCR vs. Mistral OCR; hosting & fine-tuning feasibility) | 1 |
| 2 | Common intermediate format (markdown + elements JSON), backend-pluggable | 1 |
| 3 | End-to-end pipeline: messy folder → clean, adjusted, per-document outputs | 1 |
| 4 | Per-requirement allocation with correct naming and indexing | 1 |
| 5 | Loan-product testing framework (up to ~100 documents per product) | 1 |
| 6 | Requirements management + JSON form builder feeding the matcher | 1 |
| 7 | Real-data calibration, threshold tuning, reviewer-feedback loop | 2 |
| 8 | Adversarial testing: merged multi-type files, images, crooked/hard-to-read IDs | 2 |
| 9 | Capability & efficiency report on real customer data | 2 |
| 10 | Cross-document fraud analysis | 2 |
| 11 | AI search/Q&A over the indexed corpus with citations | 2 |
