# Client Branding Customization Strategy (V1)

**Last Updated:** 2026-02-16  
**Status:** Approved direction for implementation

---

## Why This Exists

This document defines how Pacific Golf should let organizations make tournaments feel like their own brand (logo, colors, hero visuals, signature imagery) without turning the product into a drag-and-drop website builder.

Goal: strong brand identity + simple operations + low maintenance.

---

## Product Decision

Use a **Brand Kit + Theme Preset** model.

- **Brand Kit (organization/tournament content):**
  - Logo
  - Hero/banner image
  - Optional signature image (for commemorative visuals)
  - Primary and accent colors
  - Contact/footer fields
- **Theme Preset (system-controlled styling):**
  - Curated style modes (example: Classic, Premium, Minimal, Event)
  - Presets control card/section/button treatment and spacing consistently
  - Layout structure remains product-owned

This gives each client a custom feel without adding page-builder complexity.

---

## Non-Goals (Explicitly Out of Scope for V1)

- Drag-and-drop page building
- Arbitrary section reordering
- Raw custom CSS/HTML injection
- Unlimited font uploads
- Per-page freeform layout editor

---

## Scope

### V1 (recommended now)

1. Keep org-level branding as default theme source.
2. Add tournament-level optional overrides with inheritance:
   - `Use organization branding` (default on)
   - `Customize this tournament` (optional override)
3. Add `theme_preset` selection from a limited preset list.
4. Apply branding consistently to:
   - Public org page
   - Public tournament page
   - Registration page/success page
   - Public leaderboard/raffle board where applicable

### V1.1 (next)

- Preview before publish
- Light validation guardrails (contrast/readability)
- Minor typography mode options from a curated set

---

## UX Rules

- Branding controls must be easy to use for non-technical admins.
- Default path should be one click: keep org branding.
- Tournament custom mode should be optional and clearly reversible.
- Use the same design primitives as existing admin forms (no parallel design system).

---

## Data Model Direction (Lean)

- Keep organization branding fields as defaults.
- Add tournament branding override fields only for high-value tokens:
  - `theme_preset`
  - `primary_color_override`
  - `accent_color_override`
  - `logo_url_override`
  - `banner_url_override`
  - `signature_image_url_override` (optional)
  - `use_org_branding` (boolean, default `true`)

Effective theme resolution:

1. If `use_org_branding = true`: use organization values.
2. If `use_org_branding = false`: use tournament override when present; fallback to organization value when missing.

---

## Success Criteria

- Clients can make tournaments visibly theirs in less than 10 minutes.
- No design regressions from custom branding inputs.
- Support burden does not increase from freeform customization requests.
- UI remains mobile-first and consistent with Pacific Golf standards.

---

## Implementation Order

1. Add backend fields + API support for tournament overrides.
2. Add admin UI controls in tournament settings/edit flow.
3. Apply resolved branding tokens on public pages.
4. Add regression checks for inheritance and fallback behavior.

---

## Related References

- `docs/ADMIN_TOURNAMENT_CONTEXT_AND_THEMING_BLUEPRINT.md`
- `docs/TOURNAMENT_CONTEXT_AND_THEMING_IMPLEMENTATION_TRACKER.md`
