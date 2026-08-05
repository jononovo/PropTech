# Evals for document analysis & management — landscape + issue-class taxonomy

Status: RESEARCH — compiled Aug 5, 2026 (industry + academic + practitioner sweep).
Feeds the benchmark-harness idea (challenge packets + golden answers + scoring script)
and gives triage a shared vocabulary. Sources linked inline; vendor claims marked [M].

## The one-line finding

**Parsing/OCR evals are saturated; management-layer evals are scarce and mostly
private.** OmniDocBench v1.5 tops out at ~94.6% ([LlamaIndex: "OmniDocBench is
saturated"](https://www.llamaindex.ai/blog/omnidocbench-is-saturated-what-s-next-for-ocr-benchmarks));
the long tail moved to exactly the layers Sheaf sells: splitting, filing,
completeness, freshness, fraud, and cited Q&A. For most of those layers there is
**no public benchmark** — teams that win build private golden sets and treat the
eval harness as proprietary infrastructure. That's an opportunity, not a gap.

## 1. Eval landscape by capability (beyond OCR)

### 1a. Splitting / page-stream segmentation — OUR CORE, finally getting benchmarks
- **[DocSplit](https://arxiv.org/html/2602.15958v1)** (Feb 2026) — packet
  recognition + splitting: boundary detection, type classification, page ordering;
  handles out-of-order pages, interleaved documents, unmarked boundaries. Partial-credit
  metrics that grade error severity, not just exact match. Closest public analog to our packet task.
- **[OpenPSS](https://irlab.science.uva.nl/wp-content/papercite-data/pdf/heus_open24.pdf)** (2024) — two
  public page-stream datasets; notes the field lacks agreed metrics (boundary P/R/F1 vs
  document-level exact match differ a lot on the same output).
- **[LLMs for PSS](https://arxiv.org/pdf/2408.11981)** — LLM-based splitting evals.
- Metric menu: boundary precision/recall, document-level exact match ("span perfect"),
  and weighted variants where a missed boundary (merge) ≠ a false boundary (fragment).

### 1b. Classification
- RVL-CDIP is the classic 16-class benchmark — considered saturated AND label-noisy;
  fine-grained form-type classification (URLA vs 4506-C vs VOE…) has no public benchmark.
  Private golden sets are the norm. Confusable-pair matrices matter more than headline accuracy.

### 1c. Field extraction (KIE)
- **[DocILE](https://arxiv.org/abs/2302.05658)** (Rossum, ICDAR) — KILE + Line Item
  Recognition on 6.7k invoices, 55 field classes; field-level F1 with exact AND relaxed
  match, numeric tolerance windows. The metric design (per-field comparators) is the takeaway.
- **[AWS's KIE eval methodology](https://aws.amazon.com/blogs/machine-learning/document-intelligence-evolved-building-and-evaluating-kie-solutions-that-scale/)** —
  the cleanest public recipe: deterministic field-specific comparators (numeric = value
  match ignoring format; text = fuzzy on spacing/punctuation), F1 headline, cost+latency
  reported alongside. Explicitly avoids LLM-as-judge where a comparator will do.
- Tables: TEDS / GriTS; **[RD-TableBench](https://github.com/reductoai/rd-tablebench)** (Reducto).

### 1d. Multi-page / long-document understanding & QA
- **DUDE** (cross-page evidence, forms/tables focus), **MP-DocVQA**, 
  **MMLongBench-Doc** (docs to 468 pages, avg 47.5 — compositional reasoning),
  SlideVQA, LongDocURL. Metrics: ANLS (fuzzy answer match), accuracy, F1.
  ([overview](https://arxiv.org/pdf/2604.13731))
- Relevant to the QA agent: these test answer correctness but NOT citations — see 1g.

### 1e. Parsing (context — the saturated layer)
- **[OmniDocBench](https://github.com/opendatalab/OmniDocBench)** (CVPR 2025, now v1.7),
  OCRBench v2, [CC-OCR v2](https://arxiv.org/pdf/2605.03903), olmOCR-bench + ParseBench
  (unit-test paradigm: binary pass/fail per cell — resistant to fluent-but-wrong),
  **[SCORE-Bench](https://unstructured.io/blog/introducing-score-bench-an-open-benchmark-for-document-parsing)**
  (Unstructured, open: fuzzy word-weighted alignment because classic edit-distance metrics
  unfairly punish generative parsers whose output is semantically equivalent but structurally different).
- Lesson for us: unit-test-style binary checks > holistic similarity scores.
  Our `models/` dated head-to-heads already follow the right pattern; they lack the binary task list.

### 1f. Fraud / tamper detection
- **DocTamper** (2023, the standard: 120k synthetic tampered doc images, pixel-level masks;
  copy-move/splice/print-edit types), **[AIForge-Doc](https://arxiv.org/html/2602.20569v1)**
  (Feb 2026 — diffusion-inpainting forgeries on financial/form docs; the modern threat),
  **[DocForge-Bench](https://arxiv.org/pdf/2603.01433)** (0-shot generalization — most
  detectors that ace DocTamper fail out-of-distribution), ForensicHub.
- ID documents: MIDV-2020, SIDTD, IDNet, KID34K; metrics from ISO/IEC 30107-3:
  **APCER** (attacks passed) / **BPCER** (genuines rejected), BPCER20 = BPCER at 5% APCER.
- Commercial framing worth stealing: **fraud catch rate AT a given review rate** —
  the economics metric. Ocrolus Detect outputs a 0–100 authenticity score, ≤30 = reject-tier [M].
- Metadata forensics (PDF tool chains, edit history): methods published, no public benchmark.

### 1g. Grounding / citations (QA agent)
- RAG-era metrics ([RAGAS/DeepEval decomposition](https://www.confident-ai.com/blog/rag-evaluation-metrics-answer-relevancy-faithfulness-and-more)):
  **faithfulness** (answer implied by sources), **groundedness per claim**
  (each atomic claim supported/contradicted/silent), **context precision/recall** (retrieval),
  and **citation accuracy** — the biggest trust lever above faithfulness itself.
- **["Cited but Not Verified"](https://arxiv.org/pdf/2605.06635)** (2026): agents cite
  sources that don't support the claim — citation-quote verification must be scored, not assumed.
  Our resolver (quote → bbox match) already produces the raw signal for this eval for free.
- Grep-recall eval (our vectors-only-if-grep-fails ruling): measure with a planted
  question set — questions whose answers live at known pages; score retrieval hit rate.

### 1h. Completeness / checklist satisfaction — NO public benchmark (our differentiator)
- The real-world standard is regulatory, not academic:
  **[Fannie Mae post-closing QC](https://selling-guide.fanniemae.com/sel/d1-3-01/lender-post-closing-quality-control-review-process)** —
  **10% random sample** (or 750/mo cap) full-file reviews → **defect rate**, plus
  discretionary risk-targeted samples; 90-day cycle; prefunding QC = lesser of 10%/750.
  GSEs certify *vendors + process*, never an accuracy percentage; enforcement is
  rep-and-warranty relief (Day 1 Certainty / AIM) conditional on approved verification chains.
- Commercial: ICE's `AnalyzerResult` makes checklist-rule failures a first-class output;
  Infrrd markets post-close QC auto-detecting "60+ common issues" [M].
- Nobody publishes an eval for "is the required set complete" — build ours from synthetic
  packets with known-missing documents.

### 1i. Freshness / recency — no public eval anywhere
- Date extraction + reference-date logic + staleness rules. Trivially gold-standardable
  in synthetic packets (plant dated documents around the boundary). We'd be first.

### 1j. Cross-document consistency — no public benchmark
- Commercial practice exists ([cross-doc validation](https://www.checkfile.ai/en-US/blog/cross-document-validation-beyond-ocr-idp),
  Ocrolus Inspect, Scry Collatio) — reconcile names/addresses/employers/amounts across a
  file, tolerance for benign variation ("St." vs "Street") — but evals are private.
  Synthetic packets with planted mismatches make this scoreable.

## 2. The production eval layer (how the industry actually measures)

- **STP rate** — % of documents end-to-end with zero human touches. Industry avg 40–60%
  (invoices), best-in-class 95%+ [M]. Distinct from **automation rate** (% of *fields* auto-done).
- **Exception/fallout rate**, human-touch rate, cost/doc, turnaround, rework rate.
- **Field-level vs document-level accuracy** — a doc is right only if ALL critical fields are right.
- **Silent failure rate** — wrong value NOT flagged for review; measured by sampling the
  auto-approved stream against ground truth. Best-in-class target <0.5%. The metric that
  matters most and is hidden by "accuracy".
- **Confidence calibration** — "95% confident" must be right 95% of the time. Validated with
  coverage-vs-accuracy curves; 2026 SOTA: [99.1% automated accuracy at 80% coverage](https://arxiv.org/pdf/2606.24420).
  Two commercial patterns: Rossum's per-field threshold (default **0.975**); Hyperscience's
  inversion — set **target accuracy per field**, system derives the threshold and reports
  achievable automation rate (their FLAT = critical fields carry higher targets).
- **QA sampling of the auto-approved stream** (Hyperscience field-level QA, AWS A2I random
  loops, Fannie's 10% QC) — threshold routing alone never catches confident-and-wrong.
- **Overrides as the flywheel** — reviewer corrections double as accumulating ground truth,
  calibration data, and drift signal. Guard with inter-annotator agreement on a
  double-annotated slice (Cohen's kappa ≥ ~0.7).
- **Golden set practice** — 100–500 verified examples (below ~100, confidence intervals
  can't call regressions); mix head traffic + edge cases + risk cases; **immutable
  versioned snapshots** so runs stay comparable; fed from production failures.
- **Drift monitoring** — watch input mix (doc-type distribution, page counts, scan quality,
  per-field confidence distributions); confirm accuracy impact before reacting.
- **LLM-as-judge, used carefully** — deterministic comparators first (AWS rule); judges only
  where normalization fails; known biases (position, verbosity, self-preference); calibrate
  against human labels (~80% agreement achievable ≈ human-human ceiling); swap-and-average
  for pairwise. 93% of teams report struggling with judge consistency/cost/bias
  ([Galileo](https://galileo.ai/blog/llm-as-a-judge-vs-human-evaluation)).

## 3. Issue-class taxonomy

Shared vocabulary for golden-set labels, run triage, and override reasons. Two axes on
every issue: **loud vs silent** (was it flagged?) and **direction** (false-complete is
worse than false-incomplete; false fraud accusation is worse than a missed weak signal
at our review-everything stage). Codes are stable for use in labels/receipts.

### SPLIT — document boundary errors
- SPLIT-1 **Merge** (missed boundary): two documents fused; sub-cases: same-type run-on
  (two bank statements), different-type absorption (paystub swallowed by URLA).
- SPLIT-2 **Fragment** (false boundary): one document cut; sub-cases: mid-table cut,
  continuation/addendum page orphaned, schedule separated from parent form.
- SPLIT-3 **Junk absorption**: blank/duplicate/separator pages glued into a span
  (our span-gluing rule exists because both engines did this).
- SPLIT-4 **Ordering**: correct pages, wrong sequence; out-of-order input not recovered.
- SPLIT-5 **Interleaving**: pages of two documents alternating (double-sided scan artifacts);
  includes ID front/back arriving as separate files not paired.
- SPLIT-6 **Orphan/unassigned handling**: real page dropped as junk (silent loss — severe)
  vs junk page surfaced as document (noise — mild).

### CLASS — document type errors
- CLASS-1 **Confusable swap**: paystub↔W-2, bank statement↔brokerage statement,
  URLA↔loan estimate; track as a confusion matrix, not an accuracy number.
- CLASS-2 **Form-revision confusion**: right family, wrong vintage (URLA 2009 vs 2020;
  W-2 tax year); matters because checklists pin revisions.
- CLASS-3 **Long-tail dumping**: rare type shoved into "other"/nearest common type.
- CLASS-4 **Multi-type page**: one page legitimately two things (VOE letter + paystub table).
- CLASS-5 **Wrong-entity document**: right type, wrong person/account (co-borrower's
  paystub filed as borrower's) — classification is right, allocation is wrong; often silent.

### FILE — naming / filing / allocation errors
- FILE-1 **Wrong checklist slot**: valid doc, wrong requirement.
- FILE-2 **Cardinality**: four bank accounts → statements collapsed into one slot, or one
  account's months scattered; "all pages of all accounts" under-collected.
- FILE-3 **Variant misassignment**: right block, wrong declared variant (Chase statement
  filed under the Wells account).
- FILE-4 **Alternatives mishandling**: alternative-group satisfaction miscomputed
  (either-or treated as both-required, or vice versa).
- FILE-5 **Naming violations**: name doesn't follow requirement convention; collisions.
- FILE-6 **Multi-requirement docs**: one doc legitimately satisfies two slots — double-filed
  when it shouldn't be, or one slot starved when it should share.

### COMP — completeness / satisfaction errors
- COMP-1 **False complete** (silent — worst class): requirement marked satisfied when the
  doc is missing/partial/wrong-entity.
- COMP-2 **False incomplete** (loud — friction): satisfied requirement flagged missing →
  needless borrower re-request.
- COMP-3 **Partial document**: statement missing pages ("page 3 of 6"), truncated form,
  missing signature page — present but incomplete.
- COMP-4 **Incomplete-set detection**: N-of-M months/accounts logic wrong.

### FRESH — freshness / recency errors
- FRESH-1 **Date extraction wrong** (period end vs print date vs statement date).
- FRESH-2 **Rule application wrong**: right date, wrong reference point or window math.
- FRESH-3 **Stale accepted** (silent) / FRESH-4 **Fresh rejected** (friction).
- FRESH-5 **Undated handling**: no extractable date — must surface, never default-pass.

### QUAL — legibility / usability errors
- QUAL-1 **Illegible accepted** (downstream extraction garbage traced to intake quality).
- QUAL-2 **Legible rejected** (false re-request friction).
- QUAL-3 **Geometry defects**: skew/rotation/crop cutting content; glare on IDs.
- QUAL-4 **Degradation blindness**: scan-of-scan, photo-of-screen accepted silently.

### FRAUD — fraud-scoring errors
- FRAUD-1 **Missed manipulation**: pixel/font edits, copy-move, and (2026 threat)
  diffusion-inpainting edits invisible to classic forensics.
- FRAUD-2 **False accusation** (economics: one false positive burns reviewer trust).
- FRAUD-3 **Metadata blindness/misread**: creation-tool chains, edit history, font
  substitution — missed or over-weighted.
- FRAUD-4 **Template reuse missed**: same doc skeleton across applicants (needs
  cross-application signals — currently out of scope, note the boundary).
- FRAUD-5 **Cross-doc inconsistency missed**: names/addresses/employers/amounts disagree
  across the file, unflagged.
- FRAUD-6 **Score miscalibration**: fraud score doesn't rank risk (high scores no more
  likely fraudulent than low) — measure catch-rate-at-review-rate, not accuracy.

### EXTR — core-field extraction errors
- EXTR-1 **Wrong value** (misread digits, wrong row/column).
- EXTR-2 **Fluent hallucination**: plausible value not present in the document —
  the LLM-era failure that unit-test scoring exists to catch.
- EXTR-3 **Field confusion**: gross vs net, YTD vs period, borrower vs co-borrower.
- EXTR-4 **Normalization**: format/sign/units mangled (dates, currency, SSN masking).
- EXTR-5 **Missing extraction**: present in doc, not extracted (below-threshold silent drop).

### QA — Q&A agent / citation errors
- QA-1 **Wrong answer** (retrieval found the right page, reasoning failed).
- QA-2 **Retrieval miss**: answer exists, grep never surfaced it (THE metric guarding our
  no-vectors ruling).
- QA-3 **Cited-but-unsupported**: answer right or wrong, quote doesn't support the claim.
- QA-4 **Citation mislocation**: right claim, wrong file/page; bbox resolves to wrong region.
- QA-5 **Unfaithful synthesis**: claim not grounded in any retrieved source (hallucination).
- QA-6 **Staleness**: answered from an old run's sidecars after a newer run superseded them.

### SYS — pipeline honesty / provenance errors (our house rules, made testable)
- SYS-1 **Fabrication on failure**: stage fails, output looks normal (violates no-fake rule).
- SYS-2 **Provenance mislabel**: run's `pipelineVersion`/spec/prompt version doesn't match
  what actually ran.
- SYS-3 **Confidence miscalibration**: stated confidences don't track empirical accuracy
  (per stage — judge scores especially).
- SYS-4 **Silent degradation**: partial results (some pages unparsed) presented as complete.

## 4. Implications for our harness (bridge to build plan)

1. **Unit-test scoring over similarity scoring** (olmOCR-bench lesson): golden answers are
   binary assertions per task — "boundary between p.5/p.6 exists", "doc 3 is a W-2",
   "requirement X unsatisfied", "quote resolves to p.2" — not fuzzy text diffs.
2. **Score direction-aware**: false-complete and silent classes carry higher weight;
   report per-issue-class counts, not one blended accuracy.
3. **Synthetic-first is fine and fast** for SPLIT/COMP/FRESH/FILE (plant the traps —
   we already do this); FRAUD needs a tamper generator (DocTamper-style edits + diffusion
   inpainting on our SAMPLE docs); EXTR/QA need a planted-question set with known pages.
4. **The plumbing exists**: per-run model plans (any packet × any model combo), judge
   receipts, `pipelineVersion`, per-stage timings/tokens — a scoring script over run
   payloads + golden JSON closes the loop.
5. **Verdict/override records are our accumulating real-world golden set** — Fannie's own
   QC model (10% random + risk-targeted sampling → defect rate) is the audit-ready template
   when real volume arrives.
