# Customer interactions checkpoint

Scope: mobile UI/local demo interactions only. Existing catalogue, API, SKU, taxonomy and payment contracts remain unchanged. No backend/admin code, environment values, dependencies or production services changed.

## Changes

- Cart: compact line items, accessible quantity/removal controls, variant sheet. Variant changes preserve customization, merge identical lines, enforce aggregate demo stock and use canonical SKU preview prices.
- Account: add/edit/delete sample addresses in a keyboard-aware sheet, confirmation before clearing device data, collapsed local connection tools.
- Gift builder: Items / Details / Finish steps, searchable and windowed compatible choices, persistent action/validation footer, URL-restored step and existing persisted customization. Existing capacity, budget, stock and wedding template rules remain intact.
- Personalization: local photo included in the labelled template preview; selected lettering is exposed to accessibility APIs.
- New `/review`: address selection, validated canonical demo subtotal and locally saved review snapshot, stale-cart detection and profile isolation. This is explicitly NOT an order. Payments remain disabled; nothing is sent to a merchant or reserved.
- Shared sheets dismiss by Escape on web as well as close/backdrop/native back. Removed duplicate success text during modal dismissal.

## Verification at checkpoint

- TypeScript and lint: exit 0.
- Unit tests: 36 passed, 0 failed, including new canonical-review and variant-merge regressions.
- New fixture interaction tests: 3 passed, covering address editing, variant persistence, disabled payments, saved/stale review, builder step restoration, Escape, offline loaded-fixture cart and corrupt-storage recovery.
- Existing loopback API mode: 19 passed, 1 intentional fixture-offline skip, 0 failed (3.5 minutes). Catalogue server was explicitly started before this clean rerun. Earlier two startup failures were harness sequencing, not bypassed assertions.
- Android/iOS/web exports: fixture and process-only local API modes succeeded using installed Hermes. Initial sandbox compiler restriction required an escalated local rerun.

Final exhaustive screenshots and fixture regression are recorded separately in MOBILE_POLISH_REPORT.md. Native device, native keyboard and actual TalkBack/VoiceOver testing remain unavailable in this Windows environment.

Rollback: revert the functional checkpoint, retaining the preceding visual checkpoint. Stored version remains 1; added review is optional, old profile data stays compatible.
