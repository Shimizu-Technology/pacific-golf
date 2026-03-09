## Active Demo Runbook (Current)

Use this section as the current source of truth for near-term Make-A-Wish demos.
The rest of this document contains historical planning notes.

### Demo Objective
- Show a reliable Golf for Wishes demo flow end-to-end.
- Keep scope honest: what is live now vs what is post-approval roadmap.

### Canonical Facts (Do Not Drift)
- Organization: Make-A-Wish Guam & CNMI
- Golf event: Golf for Wishes 2026
- Public event details: 2-person scramble, LeoPalace, 7:00 check-in, 8:00 shotgun, $300/team
- Commercial agreement: $5 per registrant (internal pricing agreement)

### Demo URLs
- Public org page: https://pacific-golf-web.netlify.app/make-a-wish-guam
- Tournament page: https://pacific-golf-web.netlify.app/make-a-wish-guam/tournaments/golf-for-wishes-2026
- Admin login: https://pacific-golf-web.netlify.app/admin/login
- API verification: https://pacific-golf-api.onrender.com/api/v1/organizations/make-a-wish-guam/tournaments/golf-for-wishes-2026

### Pre-Meeting Checklist (Hard Gate)
- [ ] Run `scripts/smoke-prod.sh` and confirm all green.
- [ ] Confirm demo seed data is current and raffle is enabled.
- [ ] Log in to admin before meeting to avoid auth delays.
- [ ] Open tabs in advance: org page, tournament page, leaderboard, admin.
- [ ] Keep backup screenshots ready.

### Demo Sequence (10-12 minutes)
1. Public page + tournament details
2. Registration flow (without processing real payment during demo)
3. Admin dashboard + registrant operations
4. Check-in + groups workflow
5. Live scoring + leaderboard
6. Raffle board/demo
7. Next steps + timeline

### Messaging Guardrails
- Keep pricing language consistent at $5 per registrant.
- Do not over-promise non-live features.
- For Gala requirements, position as phase-2 expansion after golf launch.

### Security Note
- Do not store plaintext credentials in this file.
- Use password manager links or temporary one-time credentials only.

---

# Make-A-Wish Guam & CNMI — Client Overview

## Status: Prospecting (Pitch Sent)

## Contact
- **Eric Tydingco** — President & CEO
- Email: etydingco@guam.wish.org
- Phone: 671-649-9474 (Guam)
- See: `obsidian-vault/people/eric-tydingco.md`

## How We Connected
- Leon's mom may have mentioned his name to them
- Eric reached out, Leon met with him on **Feb 17, 2026**
- Full meeting transcript saved in session history

## What They Need
Event management software for their fundraising events — currently all manual (spreadsheets, paper check-in, email-based guest lists).

### Events
1. **Golf for Wishes** (3rd annual) — May 2, 2026
   - LeoPalace Resort Country Club, Yona
   - Two-person scramble, ~60-144 players
   - 7 AM check-in, 8 AM shotgun start, 1:30 PM banquet/awards/raffle
   - Prizes: closest-to-pin, longest drive, hole-in-one cars (Triple J & CarsPlus)
   - Day-of raffle (QR bundles, NOT pre-sold)
   - **This is the foot-in-the-door project**

2. **Gala** — Aug 22, 2026
   - Hyatt, 400 capacity
   - Table management, dietary requirement tracking
   - Two raffle types: $20 small bundles (night-of) + $100 limited tickets (pre-sold, e.g. car raffle)
   - Sponsor/corporate table check-in (currently manual email lists)
   - **Bigger revenue opportunity** (400 people × $5 = $2,000+)

3. **Whiskey for Wishes** — new event, TBD

4. **Saipan event** — end of Feb 2026

## Pricing (Agreed)
- **$5 per registrant** — same model as Guam Running Club
- No setup fee, no monthly subscription
- Raffle management **included free**
- Stripe processing fees (2.9% + 30¢) pass through to Stripe
- Pay based on actual participation only

## Timeline
- **Feb 17**: Initial meeting with Eric
- **Feb 17**: Leon sent follow-up email with full pitch
- **Feb 20**: Eric replied — board chair interested, wants summary + pricing
- **Feb 20**: Leon sent pricing reply ✅
- **Next**: Waiting for board/golf committee approval → POC within 1 week of go-ahead

## Technical Plan
- Based on existing **Ordering Platform** (GIA airport tournament POC)
- Features: registration, Stripe payments, waiver, dashboard, drag-drop hole assignments, check-in, raffle (QR bundles), RBAC, reporting/Excel export, audit log, mobile-first
- Tournament duplication for year-over-year reuse
- Progressive Web App for push notifications

## Related Opportunities
- **Guam Cycling Federation** — Eric is on the board (was president 12 years)
  - Currently uses Haku (membership) + Maddie/MyLaps (race timing) — two separate systems
  - Tour of Guam: big annual event, ~200-300 cyclists, GBB sponsorship
  - 10-11 events per year — potential annual contract
  - Has RF timing equipment — interested in local integration
  - New president struggles with Haku's complexity
  - See transcript for full cycling discussion

## Key People (Eric's Network)
- **Leslie** — Bank of Guam, on MAW board. Flagged Guam Time's high fees.
- **Mike Sakazaki** — Bank of Hawaii. Mentioned Leon's name in a meeting.
- **John Elow** — Next Gen vice chair, plays basketball with Leon, FD connection.
- **Makayla Pangolini Gogui** — Next Gen, works with Matt/Guam Time.
- **Frank Campillo** — Guam Chamber of Commerce, discussed raffle features.
- **Kalina** — MAW staff, handles sponsor/guest communication for gala.

## Competition
- **Guam Time (Matt)** — handles ticketing. Next Gen committee uses them. Leslie flagged high percentage fees. Can't customize (purchased software, not developers).
- **Haku** — membership/event platform. Robust but overwhelming UI. Cycling Federation moving away from it for race management.
- **Maddie** — race timing/management.

## Notes
- Eric explicitly values **local vendor** — accessibility, same time zone, on-site support
- Leon was on-site for Airport tournament + Hafaloha concerts — this is a differentiator
- Eric said "pricing is definitely more than fair"
- Don't compete with Next Gen/Guam Time relationship — Eric lets them run independently
- Every dollar of margin matters for nonprofit fundraising






-------

# Make-A-Wish Committee Meeting — Demo Script

**Event:** Golf for Wishes 2026 — May 2, LeoPalace Resort  
**Prepared by:** Jerry | **Date:** March 8, 2026  
**Goal:** Show Pacific Golf as the primary system; use GIAA legacy only as optional historical context.

---

## Pre-Meeting Checklist

- [ ] Open both URLs in Chrome tabs ahead of time (slow Render cold start)
  - GIAA: https://giaa-tournament.netlify.app
  - Pacific Golf: https://pacific-golf-web.netlify.app/make-a-wish-guam
- [ ] Log in to Pacific Golf admin before meeting (Clerk auth)
- [ ] Confirm Make-A-Wish demo data is fresh: https://pacific-golf-api.onrender.com/api/v1/organizations/make-a-wish-guam/tournaments/golf-for-wishes-2026
- [ ] Have mobile phone ready to demo PWA scoring
- [ ] Open leaderboard page in a second browser tab for live updates demo
- [ ] **Enable raffle in admin** — Tournament settings → toggle `raffle_enabled` to ON (currently false in DB). Do this before meeting.

---

## Part 1: Context — GIAA Tournament Software (~5 min)

**URL:** https://giaa-tournament.netlify.app

**What to say:**
> "We've been running tournaments in Guam for a while with this system — it was originally built for GIAA. It handles registration, check-in, scoring. But it's a single-client system. We outgrew it."

**Show briefly:**
- Registration flow (public side)
- Admin dashboard
- Group management

**Key point:** "This worked for one tournament. What we built for you is a proper platform — multi-tenant, mobile-first, real-time."

**Transition:**
> "We took everything we learned from this and built Pacific Golf specifically for Guam charity tournaments. Let me show you Golf for Wishes."

---

## Part 2: Pacific Golf — Make-A-Wish Org Page (~3 min)

**URL:** https://pacific-golf-web.netlify.app/make-a-wish-guam

**What to show:**
- Organization landing page with Make-A-Wish branding
- Tournament card for Golf for Wishes 2026
- "Register Now" button (show flow, don't complete)

**Talking points:**
- "Your org has its own URL — make-a-wish-guam. All your tournaments live here."
- "Branding is customized: colors, logo, messaging. This is YOUR page."
- "Registration is self-serve. Teams register online and pay by card. No paper forms."

---

## Part 3: Registration Flow (~5 min)

**URL:** https://pacific-golf-web.netlify.app/make-a-wish-guam/tournaments/golf-for-wishes-2026

**What to show:**
- Tournament details page (date, venue, format, fee)
- Registration form (two-person scramble, $150/registrant)
- Payment options (card, cash, check — shown in form)
- Confirmation flow

**Talking points:**
- "Teams register themselves — less work for your volunteers."
- "Stripe processes payments securely. You get paid directly."
- "Cash and check are supported too — just mark them as paid in admin."
- "You currently have 24 confirmed golfers in the demo. Capacity is 144."

---

## Part 4: Admin Dashboard (~5 min)

**URL:** https://pacific-golf-web.netlify.app/admin  
**Login:** Use secure credentials from password manager (do not store plaintext here)

**What to show:**
1. **Tournament overview** — registrations, check-ins, paid count
2. **Golfer list** — names, team assignments, payment status
3. **Check-in mode** — tap to check in golfers at the door
4. **Sponsor management** — 17 sponsors loaded (title, platinum, gold, silver, bronze, hole)

**Talking points:**
- "On tournament day, your volunteers use this on an iPad or phone to check people in."
- "You can see who's paid, who hasn't, and send reminders."
- "Sponsors are organized by tier and displayed automatically on the public page."

---

## Part 5: Live Scoring + Leaderboard (~5 min)

**What to show:**
- Leaderboard URL: https://pacific-golf-web.netlify.app/make-a-wish-guam/tournaments/golf-for-wishes-2026/leaderboard
- Scoring PWA (show on mobile — no app download needed)

**Talking points:**
- "Scores are entered on mobile by a designated scorer for each group. No app download."
- "The leaderboard updates in real time. People at the clubhouse can watch it on a TV."
- "12 teams are scored in the demo — you can see the standings update live."
- "At the end of the round, you just pull the winner from here."

---

## Part 6: Raffle System (~3 min)

**What to show:**
- Raffle prizes page (6 prizes loaded in demo)
- Raffle ticket purchase flow
- Admin: trigger raffle drawing

**Talking points:**
- "Golfers can buy additional raffle tickets during registration or on the day."
- "The drawing is automatic — just hit the button and the winner is selected randomly."
- "All prize winners are logged and can be announced from here."

---

## Part 7: Pricing + Next Steps (~3 min)

**Pricing model:**
- **$5 per registered golfer** — paid by the organizing committee (not golfers)
- 144 golfers = $720 for the whole tournament
- No monthly fee, no setup fee for Golf for Wishes 2026

**What we need from them:**
1. Confirm contact: Eric Tydingco (VP Programs) — 671-649-9474, guamcnmi@wish.org
2. Their Stripe account info (or we set up payouts)
3. Their logo + any branding assets
4. Confirm $150/registrant entry fee
5. Sponsor tiers + sponsor list for this year

**Timeline:**
- Live registration open: recommend 6-8 weeks before May 2 → by mid-March
- Sponsor page ready: 2 weeks
- Scoring training for volunteers: 1 week before event

---

## Backup Demo Options (if tech fails)

- Screenshots saved in `~/work/pacific-golf/screenshots/`
- Pacific Golf PRD PDF if needed: `~/work/pacific-golf/docs/PRD.md`
- GIAA system has years of real tournament data as fallback

---

## Questions They'll Probably Ask

**"What if someone's phone dies on the course?"**
> Scores are saved after each hole. Any scorer can continue on another device.

**"What if Stripe charges a fee?"**
> Stripe takes ~2.9% + 30¢ per transaction. On $150, that's about $4.65. We can build this into the entry fee.

**"Can we still take cash on the day?"**
> Yes. Cash registrations are marked manually in admin. No Stripe needed for cash.

**"Who owns the data?"**
> You do. We can export all registration data to CSV anytime.

**"Can we use this for other events?"**
> Yes — the platform supports multiple tournaments per organization. Future Make-A-Wish events can go here too.


--------

# Make-A-Wish Demo Prep — March 9, 2026 (12 PM Lunch)

## Meeting Info
- **Who:** Eric Tydingco (CEO, Make-A-Wish Guam & CNMI) + committee members
- **When:** Monday March 9, 12:00 PM (lunch meeting)
- **What:** Show GIAA Tournament software — demonstrate capabilities for Golf for Wishes
- **DO NOT show Pacific Golf yet** — wait for their go-ahead

## Key Context from Feb 17 Meeting
- Eric is CEO of Make-A-Wish Guam & CNMI
- Currently ALL manual: paper check-in, Excel spreadsheets, email-based guest lists
- Pricing agreed: **$5 per registrant** (same as Guam Running Club model)
- Eric said pricing is "more than fair"
- **Every dollar matters** — nonprofit, margins are tight
- Values **local vendor** — same timezone, on-site support
- Competition: Guam Time (high fees, can't customize), Haku (overwhelming UI)
- Eric also chairs Guam Cycling Federation — future opportunity

## Target Event: Golf for Wishes (May 2, 2026)
- **Location:** LeoPalace Resort Country Club, Yona
- **Format:** Two-person scramble, ~60-144 players
- **Schedule:** 7 AM check-in, 8 AM shotgun start, 1:30 PM banquet/awards/raffle
- **Prizes:** Closest-to-pin, longest drive, hole-in-one cars (Triple J & CarsPlus)
- **Raffle:** Day-of QR bundles (NOT pre-sold)
- **This is the foot-in-the-door project**

## What the GIAA App Can Already Do (Demo Features)

### Public-Facing (Registration)
1. **Beautiful landing page** — tournament info, event details, spots remaining counter
2. **4-step registration wizard:** Contact → Details → Waiver → Payment
3. **Stripe payment integration** — online credit card payments
4. **Real-time capacity tracking** — "152 spots left" updates live
5. **Entry fee display** with what's included (Green Fee, Ditty Bag, Drinks & Food)

### Admin Portal (Staff)
1. **Dashboard** — registration stats, payment status overview
2. **Golfer management** — full CRUD, search, filter
3. **Check-in system** — mark arrivals on event day
4. **Payment tracking** — paid/unpaid status, send payment links, bulk operations
5. **Group management** — drag-and-drop hole assignments, auto-assign
6. **Employee/comp registration** — toggle employee status, bulk set
7. **Tournament management** — create, copy, archive tournaments, open/close registration
8. **Activity logs** — full audit trail of all changes
9. **Settings** — configurable capacity, admin email, Stripe keys
10. **Real-time updates** — ActionCable WebSocket for live dashboard

### Payment Features
- Stripe checkout (hosted + embedded)
- Payment links (send to golfers who registered but haven't paid)
- Bulk send payment links
- Refund processing
- Manual payment status updates (for checks/cash)

## What Make-A-Wish Specifically Needs (From Feb 17 Notes)
- ✅ **Online registration** — DONE
- ✅ **Stripe payments** — DONE
- ✅ **Check-in system** — DONE
- ✅ **Group/hole management** — DONE (drag-and-drop)
- ✅ **Capacity management** — DONE
- ⬜ **Raffle system** — Not built yet (day-of QR bundles)
- ⬜ **Sponsor tracking** — Not built yet
- ⬜ **Table management** — Not built yet (needed for Gala Aug 22)
- ⬜ **Dietary tracking** — Not built yet (Gala)

## Demo Script (Suggested Order)
1. **Start with the landing page** — show how clean and professional it looks
2. **Walk through registration** — fill out a test registration (don't submit payment)
3. **Show admin dashboard** — golfer list, stats, payment status
4. **Demo check-in** — show how easy day-of check-in is
5. **Show group management** — drag-drop to assign holes
6. **Mention Stripe** — payments go straight to their account, no middleman
7. **Discuss customization** — branding, colors, logo = easy to swap for Make-A-Wish
8. **Talk timeline** — Golf for Wishes is May 2, that gives us ~7 weeks

## Key Talking Points
- **Local + on-site support** — Leon was physically at GIAA tournament, will be at Golf for Wishes
- **No high percentage fees** like Guam Time — flat $5/registrant
- **Custom-built, not purchased software** — we can add raffle, sponsor tracking, anything they need
- **Already proven** — ran the GIAA tournament successfully
- **Mobile-friendly** — works on phones for check-in

## What to Avoid
- Don't pitch Pacific Golf — wait for their go-ahead
- Don't compete with Next Gen/Guam Time relationship
- Don't oversell features that aren't built (raffle, table management)
- Be transparent about what needs to be built for Golf for Wishes vs Gala

## Future Pipeline (Don't Pitch, Just Know)
- **Gala (Aug 22)** — Hyatt, 400 people, table management, dietary tracking, raffle
- **Whiskey for Wishes** — new event TBD
- **Cycling Federation** — 10-11 events/year, Tour of Guam
- **Saipan events**

## Technical Status
- **Frontend:** https://giaa-tournament.com (Netlify) ✅ Live
- **API:** https://giaa-tournament-api.onrender.com (Render, Singapore) ✅ Live
- **Local dev:** API on port 3003, Frontend on port 5176 ✅ Running
- **Admin login:** shimizutechnology@gmail.com (Clerk auth, email code verification)
- **Note:** Admin needs Clerk email verification — Leon should log in beforehand to have session cached

## ⚠️ Before the Meeting
1. Leon: Log into admin portal at giaa-tournament.com to make sure your session is cached
2. Have the production site ready to show (not local — looks more polished)
3. Consider adding Make-A-Wish branding mockup? (quick color change = strong impression)
4. Prepare for pricing discussion — $5/registrant is agreed, but may need to discuss scope for raffle/gala features
