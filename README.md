# Pacific Golf 🏌️

Multi-tenant golf tournament management SaaS for Guam and the Pacific region.

[![Rails](https://img.shields.io/badge/Rails-8.1-red.svg)](https://rubyonrails.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Proprietary-gray.svg)]()

## Features

✅ **Online Registration** — Public signup with Stripe payments  
✅ **Admin Dashboard** — Tournament management, check-in, golfer management  
✅ **Live Scoring** — Mobile-optimized scorecard entry  
✅ **Real-time Leaderboard** — WebSocket-powered updates  
✅ **Digital Raffle** — Prize management with automated drawings  
✅ **Sponsor Management** — Tiered sponsor display (title, platinum, gold, etc.)  
✅ **Multi-tenant** — One platform, many organizations  

## Tech Stack

| Layer | Technology |
|-------|------------|
| **API** | Rails 8.1, PostgreSQL, ActionCable |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Auth** | Clerk |
| **Payments** | Stripe |
| **Email** | Resend |
| **Deployment** | Render (planned) |

## Project Structure

```
pacific-golf/
├── api/              # Rails API server
│   ├── app/
│   │   ├── controllers/api/v1/
│   │   ├── models/
│   │   └── channels/
│   └── config/
├── web/              # React frontend
│   ├── src/
│   │   ├── api/      # API client
│   │   ├── components/
│   │   └── pages/
│   └── public/
├── docs/             # Documentation
│   ├── PRD.md        # Product requirements
│   ├── ARCHITECTURE.md
│   ├── API.md        # API reference
│   └── BUILD_PLAN.md
└── packages/         # Shared code (future)
```

## Quick Start

### Prerequisites

- Ruby 3.3.4
- Node.js 20+
- PostgreSQL 15+
- pnpm

### Setup

```bash
# Clone the repository
git clone https://github.com/shimizu-technology/pacific-golf.git
cd pacific-golf

# Install dependencies
pnpm install
cd api && bundle install && cd ..

# Setup database
cd api
cp .env.example .env  # Configure your environment
rails db:create db:migrate db:seed
cd ..

# Start development servers
pnpm dev
```

The API runs on `http://localhost:3001` and frontend on `http://localhost:5173`.

### Environment Variables

**API (.env):**
```env
# Database
DATABASE_URL=postgresql://localhost/pacific_golf_development

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...

# Stripe Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@pacificgolf.com

# App
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3001
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

## Development

### Running Tests

```bash
# API tests
cd api
bundle exec rails test

# Frontend tests (coming soon)
cd web
pnpm test
```

### Code Style

- Ruby: Standard Ruby style
- TypeScript: ESLint + Prettier
- CSS: Tailwind CSS utilities

## Documentation

| Document | Description |
|----------|-------------|
| [PRD.md](docs/PRD.md) | Product requirements document |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical architecture |
| [API.md](docs/API.md) | API endpoint reference |
| [BUILD_PLAN.md](docs/BUILD_PLAN.md) | Development phases |

## Multi-Tenancy

Each organization gets their own:
- Custom URL: `pacificgolf.com/:org-slug`
- Branding (logo, colors)
- Tournaments
- Admin users

Example:
- `pacificgolf.com/rotary-guam`
- `pacificgolf.com/chamber-of-commerce`

## Business Model

- **Pricing:** $4 per registrant
- **Target:** Rotary clubs, charity tournaments, corporate events
- **Region:** Guam and Micronesia

## Origin

Forked from GIAA Tournament Software, adapted for multi-tenant SaaS.

## License

Proprietary — Shimizu Technology LLC

---

Built with ❤️ in Guam 🇬🇺
