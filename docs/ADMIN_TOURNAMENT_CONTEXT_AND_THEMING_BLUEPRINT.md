# Admin Tournament Context And Theming Blueprint

**Version:** 1.0  
**Last Updated:** February 16, 2026  
**Status:** Proposed (Approved direction, implementation pending)

---

## Why This Exists

This document captures product and technical decisions for:

1. How Pacific Golf should handle organizations with multiple tournaments.
2. How org and tournament branding/theming should work without over-complicating the platform.

The goal is to preserve intent over time, reduce rework, and give engineers a stable reference for "why we did this."

---

## Decision Summary

### 1) Tournament Operating Model

- Keep support for **multiple tournaments per organization**.
- Enforce **one registration-open tournament per organization** at a time.
- Keep admin workflows **single-tournament-context first** (dashboard, groups, check-in, reports, modules).
- Allow admins to **switch current tournament context** from tournament management/admin selector.

### 2) Theming And Styling Model

- Support **strong customization** through structured theming, not free-form page building.
- Introduce **brand presets + design tokens** (org defaults).
- Support **optional tournament-level visual overrides** with org fallback.
- Keep usability, accessibility, and maintainability as hard constraints.

---

## Context And Constraints

### Product Context

- Most organizations typically run one flagship event at a time.
- Some organizations run multiple events per year and occasionally overlapping operations.
- Pacific Golf already has a strong "current tournament operations" UX pattern in admin.

### Current Technical Reality

- Data model already supports many tournaments per org.
- Tournament opening behavior already closes other open tournaments in the same org.
- Admin pages primarily render in a selected/current tournament context.
- Org branding controls already exist (organization settings + super admin org edit).

---

## Section A: Tournament Context Strategy

## A1. Core Principles

- **Simple by default:** Most admins should not manage multiple active operational views simultaneously.
- **Power when needed:** Admins can still create/manage many tournaments.
- **Operational clarity:** Every data-heavy admin page must clearly show "which tournament am I operating on?"

## A2. Domain Rules (Proposed Source Of Truth)

1. An organization can have unlimited tournaments across years.
2. At most one tournament can be `open` for registration per organization.
3. Admin operations pages are bound to one selected tournament context at a time.
4. Tournament context switch must be explicit and visible in the UI.

## A3. Recommended UX Behavior

- Tournament selector appears in admin shell header.
- Selected tournament drives:
  - Dashboard stats
  - Groups
  - Check-in
  - Reports
  - Live Scoring / Raffle / Sponsors
- Tournament Management page remains the place to:
  - Create/edit/archive/copy tournaments
  - Change status (draft/open/closed/etc.)
  - Change which tournament admins operate on

## A4. Practical Policy

- **Support multiple tournaments** in storage and planning.
- **Optimize UX for one operational context at a time.**
- No immediate need for a multi-tournament aggregate operations dashboard in V1.

---

## Section B: Styling And Theming Strategy

## B1. Goal

Allow organizations to have a distinct feel (including "airport-like" styling) while preserving product quality and avoiding brittle customization paths.

## B2. Recommendation: Structured Theming

Use a tokenized theming system with constraints:

- **Org-level defaults** (brand kit):
  - Primary color
  - Secondary/accent palette
  - Logo
  - Banner/hero image
  - Optional typography mode (from approved set)
- **Tournament-level optional overrides**:
  - Inherit org theme by default
  - Override selected tokens for specific tournaments/events

## B3. What "Full Styling" Means Here

Realistic and maintainable:

- Multiple approved visual presets (for example: Classic, Airport, Modern, Clean).
- Token overrides within safe bounds.
- Preview before publish.

Not recommended for current stage:

- Arbitrary CSS injection.
- Drag-and-drop page builder.
- Per-element unrestricted styling.

## B4. Why This Approach

- Keeps customization powerful but safe.
- Avoids design drift and accessibility regressions.
- Makes support/debugging practical.
- Preserves brand flexibility for client-facing differentiation.

---

## Section C: Proposed Data And Configuration Model

## C1. Organization Theme (Default)

Potential fields (some already exist):

- `primary_color` (exists)
- `logo_url` (exists)
- `banner_url` (exists)
- `theme_preset` (new)
- `theme_tokens` (new JSON, validated schema)

## C2. Tournament Theme (Override Layer)

Potential fields:

- `use_org_theme` (boolean, default true)
- `theme_preset` (nullable override)
- `theme_tokens` (nullable JSON override)
- `tournament_logo_url` / `tournament_banner_url` (optional override assets)

## C3. Resolution Rules

When rendering tournament/public/admin surfaces:

1. If tournament override enabled, use tournament tokens/assets.
2. Else use organization tokens/assets.
3. Else use Pacific Golf default theme.

---

## Section D: Implementation Phases

## Phase 1: Tournament Context Hardening

- Make selected tournament context explicit in all admin pages.
- Ensure all module pages read same context source.
- Add "switch context" affordances where missing.
- Add tests for context correctness and route behavior.

## Phase 2: Theming Foundation

- Define token schema and validation.
- Add preset system.
- Normalize component usage to consume tokens consistently.
- Add preview capability in admin settings.

## Phase 3: Tournament Overrides

- Add tournament override settings UI.
- Implement fallback resolution engine.
- Add visual regression checks for major surfaces.

## Phase 4: Polish And Governance

- Add guardrails for contrast/accessibility.
- Create style docs for admins ("how to brand your event").
- Add migration script if existing orgs need defaults backfilled.

---

## Section E: Acceptance Criteria

## Tournament Context

- Admin can manage many tournaments for one org.
- Only one registration-open tournament per org at any point.
- Dashboard/groups/check-in/reports/modules always operate on clearly indicated selected tournament.
- Tournament switching is obvious and low-friction.

## Theming

- Org can set and save core brand kit.
- Presets can materially change look/feel while preserving layout integrity.
- Tournament override can be enabled/disabled with clean fallback.
- No page breaks or unreadable states due to custom colors.

---

## Section F: Risks And Mitigations

- **Risk:** Too much theme freedom causes poor UX/accessibility.  
  **Mitigation:** Token constraints + contrast checks + preset-first design.

- **Risk:** Tournament context confusion in admin operations.  
  **Mitigation:** Always-visible current tournament indicator + consistent selector behavior.

- **Risk:** Engineering complexity grows too fast.  
  **Mitigation:** Ship in phased slices; do not add page-builder scope in current cycle.

---

## Section G: Non-Goals (Current Scope)

- Full custom page layout builder for organizations.
- Arbitrary CSS editor.
- Multi-tournament aggregate operational dashboard across many simultaneous events.

---

## Section H: Open Questions To Resolve Before Implementation

1. Should "one open tournament per org" remain a hard backend invariant or become configurable?
2. Should admins be able to designate a "default admin context tournament" at org level?
3. Which preset set should be included in V1 (minimum viable options)?
4. Should tournament-level overrides be available to org admins immediately, or only to super admins first?

---

## Section I: Change Log

- **v1.0 (2026-02-16):** Initial blueprint created from product discussion and current system review.

