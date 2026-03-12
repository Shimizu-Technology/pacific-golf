# Tournament Context + Theming Implementation Tracker

**Status:** Active  
**Owner:** Pacific Golf core implementation  
**Last Updated:** 2026-02-16  
**Source Decision Doc:** `docs/ADMIN_TOURNAMENT_CONTEXT_AND_THEMING_BLUEPRINT.md`

---

## Purpose (single working doc)

Use this as the **only execution tracker** for this initiative:

- what is done
- what is in progress
- what is next
- what is blocked

No extra planning docs should be created unless this tracker becomes unmanageable.

---

## Guardrails (to avoid over-engineering)

- Keep one `open` registration tournament per org (hard invariant).
- Keep admin operations in one selected tournament context at a time.
- Use structured theming (presets + tokens), not arbitrary CSS/page-builder.
- Ship in phases; no large-bang rewrite.

---

## Status Legend

- `[ ]` Not started
- `[-]` In progress
- `[x]` Done
- `[!]` Blocked

---

## Current Snapshot

### Done

- `[x]` Blueprint decision doc created (`ADMIN_TOURNAMENT_CONTEXT_AND_THEMING_BLUEPRINT.md`)
- `[x]` PRD cross-link added to blueprint
- `[x]` Org admin module shell alignment started (dashboard/groups/check-in/reports/modules in shared nav)
- `[x]` Live scoring route no longer hard-crashes without `group` query; now shows group-selection state
- `[x]` Context source unified for org admin operational routes (shared wrapper for dashboard/groups/check-in/reports/tournament pages/modules)
- `[x]` Deep-link tournament slug now takes precedence in context resolution
- `[x]` Tournament selector now updates slug-routed module URLs to selected tournament
- `[x]` Explicit “Viewing: {tournament}” indicator added to admin header
- `[x]` Backend invariant hardened: opening a tournament now closes sibling open tournaments and disables sibling registration
- `[x]` Added integration test coverage for one-open-per-org behavior (`api/test/integration/tournament_open_invariant_test.rb`)
- `[x]` Added client branding strategy doc (`CLIENT_BRANDING_CUSTOMIZATION_STRATEGY.md`) and PRD cross-link
- `[x]` Added tournament-level branding override fields + defaults in DB/model/API (`use_org_branding`, `theme_preset`, override assets/colors)
- `[x]` Added org-admin tournament branding controls in tournament create/edit modal (inherit vs override, preset, color overrides, logo/banner/signature uploads)
- `[x]` Added backend test coverage for tournament branding override updates (`tournament_branding_overrides_test.rb`)

### In Progress

- `[-]` Normalize admin tournament-context UX and selector behavior across all admin pages
- `[-]` Apply resolved tournament branding consistently across all intended public surfaces (org/tournament/registration/success/leaderboard/raffle)

### Blocked

- `[ ]` None currently

---

## Phase Plan (exact execution order)

## Phase 1 — Tournament Context Hardening

**Goal:** make selected tournament context reliable and explicit across admin operations.

### Backend

- `[x] P1-BE-01` Confirm/open invariant: one `open` tournament per org (already enforced) + tests covering edge cases.
- `[ ] P1-BE-02` Add/confirm endpoint support for setting/getting current tournament context if needed (org-scoped).

### Frontend

- `[x] P1-FE-01` Ensure every admin operational page reads the same selected tournament context source.
- `[x] P1-FE-02` Add consistent “Viewing: {tournament}” indicator in admin header/pages where missing.
- `[x] P1-FE-03` Ensure tournament switching from management/header updates all downstream pages correctly.
- `[x] P1-FE-04` Remove any stale fallback logic that can show wrong tournament metrics/data.

### QA / Tests

- `[ ] P1-QA-01` Test context switch on: Dashboard, Groups, Check-In, Reports, Live Scoring, Raffle, Sponsors.
- `[ ] P1-QA-02` Verify no cross-tournament data bleed after switching.
- `[ ] P1-QA-03` Verify direct deep links load expected tournament context.

**Phase 1 Exit Criteria**

- One consistent tournament context behavior across all org admin pages.
- Switching tournament is deterministic and immediately reflected everywhere.

---

## Phase 2 — Theming Foundation (Org-Level)

**Goal:** establish robust org-level styling controls with safe design constraints.

### Backend

- `[ ] P2-BE-01` Add org theme preset field (if missing) and validated token payload (if needed).
- `[ ] P2-BE-02` Add server-side validation for theme token schema and color safety constraints.

### Frontend

- `[ ] P2-FE-01` Expand org settings UI for theme preset selection + token controls (minimal v1 set).
- `[ ] P2-FE-02` Build preview state before save (where practical).
- `[ ] P2-FE-03` Standardize component consumption of org theme tokens.

### QA / Tests

- `[ ] P2-QA-01` Validate org theme persists and renders on public + admin org surfaces.
- `[ ] P2-QA-02` Validate fallback to default Pacific theme when fields are absent.
- `[ ] P2-QA-03` Validate contrast/readability baseline on key surfaces.

**Phase 2 Exit Criteria**

- Org can reliably brand its instance with consistent rendering across pages.

---

## Phase 3 — Tournament-Level Theme Overrides

**Goal:** allow event-specific styling while preserving org defaults.

### Backend

- `[x] P3-BE-01` Add tournament override fields (`use_org_theme`, optional override tokens/assets).
- `[ ] P3-BE-02` Implement resolved-theme service logic (tournament -> org -> platform default).

### Frontend

- `[x] P3-FE-01` Add “Tournament Branding” section in tournament settings/edit modal.
- `[x] P3-FE-02` Add inherit/override toggle with clear reset behavior.
- `[-] P3-FE-03` Apply resolved theme to tournament public surfaces and org-admin tournament surfaces.

### QA / Tests

- `[ ] P3-QA-01` Verify inherit mode exactly matches org theme.
- `[ ] P3-QA-02` Verify override mode only affects selected tournament.
- `[ ] P3-QA-03` Verify turning override off cleanly reverts to org style.

**Phase 3 Exit Criteria**

- Tournament-specific customization works with predictable fallback and no cross-event contamination.

---

## Phase 4 — Stabilization + Rollout Readiness

**Goal:** harden behavior and reduce regression risk before full rollout.

### Hardening

- `[ ] P4-01` Add regression checklist for all admin modules under tournament context switching.
- `[ ] P4-02` Add visual QA snapshots for key branded pages.
- `[ ] P4-03` Remove obsolete styling paths and dead code introduced during migration.

### Operational

- `[ ] P4-04` Update runbook notes for theme troubleshooting and context-related support issues.
- `[ ] P4-05` Prepare release notes and rollback notes for this initiative.

**Phase 4 Exit Criteria**

- Context + theming system is stable, test-covered, and supportable.

---

## Immediate Next 5 Tasks (working queue)

1. `P3-FE-03` finish resolved-theme application on any remaining tournament-linked surfaces (admin tournament views where applicable).
2. `P3-BE-02` extract/centralize resolved-theme service logic (currently model-level methods).
3. `P3-QA-01` verify inherit mode exactly matches org theme.
4. `P3-QA-02` verify override mode only affects selected tournament.
5. `P3-QA-03` verify toggling override off reverts cleanly.

---

## Change Log

- `2026-02-16` — Initial tracker created as single execution doc for tournament context + theming rollout.
- `2026-02-16` — Completed P1 frontend context-hardening tasks (P1-FE-01/02/03/04); shifted queue to QA + backend verification.
- `2026-02-16` — Completed P1 backend invariant hardening and added integration test (`tournament_open_invariant_test.rb`).
- `2026-02-16` — Started Phase 3 implementation: added tournament branding override fields/API/model logic, org-admin branding controls, and initial public-surface branding application.
