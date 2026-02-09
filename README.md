# Pacific Golf

Multi-tenant golf tournament management SaaS built for Guam and the Pacific region.

## Overview

Pacific Golf provides online registration, live mobile scoring, real-time leaderboards, and digital raffle systems for golf tournaments.

**Target Customers:** Rotary clubs, Chamber of Commerce, GNGF, charity tournaments

**Business Model:** $4 per registrant, paid by hosting organization

## Tech Stack

- **API:** Rails 8.1, PostgreSQL, ActionCable (WebSockets)
- **Web:** React 18, TypeScript, Vite, Tailwind CSS
- **Auth:** Clerk
- **Payments:** Stripe
- **Email:** Resend

## Monorepo Structure

```
pacific-golf/
├── api/          # Rails API (forked from GIAA tournament software)
├── web/          # React frontend (admin + public + mobile scorer)
├── docs/         # PRD, architecture, starter-app guides
└── packages/     # Shared code (future)
```

## Development

```bash
# Install dependencies
pnpm install
cd api && bundle install

# Start development servers
pnpm dev
# or separately:
pnpm api:dev  # Rails on :3000
pnpm web:dev  # Vite on :5173
```

## Documentation

- [PRD.md](docs/PRD.md) — Product Requirements Document
- [docs/starter-app/](docs/starter-app/) — Development guides

## Status

🚧 **In Planning** — PRD under review

## Origin

Forked from GIAA Tournament Software (giaa-tournament-api + giaa-tournament-frontend), adapted for multi-tenant SaaS.
