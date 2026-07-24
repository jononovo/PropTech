---
name: User interaction preferences
description: How this user prefers to receive questions and updates from the agent.
---

- **LIKES being asked questions — welcomes them and answers thoroughly ("I do like answering questions", Jul 24, 2026). Final call (later Jul 24, 2026): ask in PLAIN CHAT — "Why can't you just ask me the questions here in the chat?" — after briefly requesting forms once.** Answers may also arrive as a revised spec doc from a parallel research thread. Never point them at a doc to answer sign-off questions — restate the questions in chat.
  **Why:** flip-flopped once on forms, but the settled, repeated preference is chat text; pointing at doc questions also drew pushback.
  **How to apply:** numbered list in chat, one line each, options inline with my default marked. Answerable in any order.
- **Wants momentum over rigor ("over-engineering" pushback, Jul 24, 2026).** Small-team internal tool, not consumer scale: skip extra hardening/verification/review rounds beyond one basic check, prefer single-service simple choices, ship v1 of the next feature instead of polishing the last one.
  **Why:** user pushed back hard when a review round followed an already-verified migration ("just wanna build this now").
  **How to apply:** after a feature works end-to-end once, move on. Don't add speculative concurrency/robustness layers without a concrete failure story; keep existing guards but stop expanding them.

**Standing order (July 24, 2026):** when hitting a wall, do NOT pick a workaround silently. Research the problem (web/docs/probes), then present findings + numbered options with a recommendation in plain chat, and wait for their pick before changing approach or technology. They explicitly flagged that silent roundabout fixes make the codebase feel complex.
- Style (2026-07-24, explicit): MAX terseness. Point form for comparisons/decisions (~5 lines). Long-winded or "exaggerated" prose infuriates the user. Applies to chat replies, not docs.
