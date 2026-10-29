# AARVIKA Codex Task 12 — Existing admin only now: audit and simplify product editing

## Prerequisites
Read `../AGENTS.md`, `../AARVIKA_FULL_APP_FIRST_MASTER.md`, `../CATEGORY_FEATURE_MATRIX.md`, `../DESIGN_AND_MOTION.md` and the matching owner-uploaded `../references/` files. Confirm the complete active repo, not only the partial admin archive. Read completion reports for earlier tasks.

## Scope
Once Task 11 approved, re-audit complete existing admin and compare to app contracts. Fix source confirmed variant/personalization/delivery save differences as applicable, strengthen round-trip tests; implement simple five-step draft-safe product editor and dynamic 3-level categories/quick add. Keep existing admin visual/auth/history.

## Acceptance criteria
No historical products, order links, auth or production data harmed; old IDs preserved; staged admin create/edit/publish and per-SKU data round-trip tested; migration dry-run/rollback.

## Mandatory boundaries
Only after owner has signed off Task 11. Stage before production. One bounded task, safe branch, relevant typed contracts, preserve working flows; do not invent products/reviews/discounts. For UI, include actual screenshot/device evidence; for backend, execute relevant typecheck, tests, security checks, and report precise outcomes.

## Prompt to give Codex
```text
Implement AARVIKA Task 12: Existing admin only now: audit and simplify product editing.
Read the AARVIKA app-first master, AGENTS.md, category matrix,
design/motion spec, this task file and relevant original source references.
First inspect the actual repository and report exact files, existing contracts,
risks and tests. Then implement only this task if it is an authorized coding
task. Only after owner has signed off Task 11. Stage before production.
Build complete working behaviour, not decorative mockups or dead navigation.
Run all applicable tests and produce screenshots or action traces.
Report files changed, test commands/results, unresolved risks and next task
using templates/TASK_RESULT_TEMPLATE.md. STOP after this task.
```
