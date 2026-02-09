# AGENTS.md — Pacific Golf

## Project Context

**Pacific Golf** is a multi-tenant SaaS for golf tournament management.

**Origin:** Forked from GIAA Tournament Software, adapted for multi-tenant SaaS.

**Target Market:** Guam golf tournaments (Rotary, Chamber, GNGF, charity events)

**Business Model:** $4 per registrant, paid by hosting organization

## Key Documentation

- **[docs/PRD.md](docs/PRD.md)** — Full product requirements (READ THIS FIRST)
- **[docs/starter-app/](docs/starter-app/)** — Shimizu Technology development guides

## Monorepo Structure

```
pacific-golf/
├── api/          # Rails 8.1 API
├── web/          # React + TypeScript frontend
├── docs/         # Documentation
└── packages/     # Shared code (future)
```

## Development Servers

- API: `http://localhost:3000`
- Web: `http://localhost:5173`

## Current Status

🚧 **Planning Phase** — PRD under review, architecture pending

## Key Decisions

| Decision | Choice |
|----------|--------|
| Multi-tenancy | Shared DB with organization_id |
| URL structure | Path-based (pacificgolf.com/rotary) |
| Mobile scoring | PWA (no app download) |
| Real-time | ActionCable WebSockets |
| Auth | Clerk |
| Payments | Direct Stripe (Connect later) |

## What Needs to Change from GIAA

1. **Add multi-tenancy** — Organization model, tenant scoping
2. **Remove GIAA-specific** — Employee discounts, hardcoded settings
3. **Add live scoring** — PWA scorer, WebSocket updates
4. **Add leaderboard** — Real-time standings
5. **Add raffle system** — Ticket purchase, auto-draw, notifications
6. **Add sponsor management** — Logos, tiers, display

## Coding Standards

Follow the starter-app guides in `docs/starter-app/`:
- FRONTEND_DESIGN_GUIDE.md — UI patterns
- TESTING_GUIDE.md — Test coverage
- CLERK_AUTH_SETUP_GUIDE.md — Auth patterns
- STRIPE_SETUP_GUIDE.md — Payment handling
- WEBSOCKETS_GUIDE.md — Real-time features
- PWA_SETUP_GUIDE.md — Offline support

## Design Principles

1. **No emojis in UI** — Use Lucide icons (SVGs)
2. **Mobile-first** — Design for phone scoring first
3. **Offline-capable** — Scores must work without connection
4. **Simple by default** — Don't overwhelm casual organizers
