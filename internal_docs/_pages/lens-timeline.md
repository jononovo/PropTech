# Timeline lens — `/applications/:id/timeline`

**Purpose.** The clocks: document staleness and hard expiries laid against Today and the Closing target. Answers "what dies before this deal closes?"

**The thinking.** Two-clock model is **portal-owned** (spec §authority): the analyzer only supplies dates; humans confirm them at verdict time ("human eyes on every clock"). Urgency is visual, not numeric — `opsBand` maps days-left to blocker/warning/faint.

**History.** "The star" of the Backbone round — the pure-CSS validity chart was born alongside the two-clock model itself (user's domain call: staleness stops on accept; hard expiries must survive to closing day — never conflate them). Timeline doctrine set then: the chart IS the alert surface (no banner restating a row it already ranks), day counts render at data size, desktop-only by explicit scope call.

**How it works.**
- Window: `today − 14d` → `max(today + 60, closing + 45, latest staleOn + 15)`; Today and Closing render as vertical markers (`todayPct`/`closingPct`).
- Live clocks chart on top; stopped clocks (accepted/expired-and-resolved) shelf below.
- "Dies before the deal" whisper renders once, on the first qualifying row.
- Row click → workfile at that requirement's section.
- The header bell's alarm count = clocks inside 30 days; it lands here.

**Peculiarities.**
- No closing date set → empty-state message pointing at the case header. **Copy nit:** since the Jul 24 header redesign the closing editor lives in the *applicant-name panel*; the message's "case header" phrasing is now vague. One-line fix, batch with the next lens touch.

**Done.** Window math, bands, live/stopped split, cross-links.

**Open.**
- *Open — feature:* the expiry **engine** (closing-date edits re-evaluating hard expiries) — spec says portal-owned, lands with expiry work; today the lens *displays* rather than *recomputes-on-edit*.
- The copy nit above.
