# Plume — a portfolio for young talent

A safe, parent-controlled portfolio platform for kids and teens. No DMs. No discovery feed. Just a verified record they can be proud of.

## Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Prisma ORM (v6, PostgreSQL)
- Tailwind CSS 4 + custom Plume design tokens

## Design

The UI uses the **Plume** design system: warm cream + coral palette, Instrument Serif (display) paired with Geist (sans/mono), no emoji, custom line-icon set. To rename the product, edit `lib/brand.ts`.

## Run locally

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Default admin (from seed):
- Email: `admin@linkedinforkids.local`
- Password: `Admin123456`

Override via `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` in `.env`.

## Database

Configured for local PostgreSQL by default:

- Database: `linkedinforkids`
- Username: `postgres`
- Password: `123456`
- Host: `localhost`
- Port: `5432`

Connection string is set in `.env`:
`DATABASE_URL=postgresql://postgres:123456@localhost:5432/linkedinforkids?schema=public`

If you'd like to rename the database to `plume`, update `.env` accordingly and re-run `npm run db:push`.

Uploaded files are stored under `public/uploads/photos/` and `public/uploads/proofs/`. The folder is git-ignored.

## Features

User types
- Parent / Guardian (creates the account, controls everything)
- Child / Teen (logs in with credentials the parent set)
- Admin (moderates content + manages users)

Onboarding & authentication
- Parent-first signup; children cannot self-register
- Child accounts are created from inside the parent dashboard
- Login enforces parent approval — if a parent disables "Login allowed", the child cannot sign in
- Suspended accounts (admin action) cannot log in

Child profile
- Profile photo, age, grade/standard, school, optional location
- Skills, interests (tag pills)
- "About me" bio + optional fun fact
- All editable from parent and child views

Talent showcase
- Achievements grouped by category: Sports, Academics, Arts, Coding, Music, Other
- File uploads (PNG/JPG/WEBP/GIF/PDF, up to 5 MB) for certificates / proof
- Optional external URL field
- Child uploads enter a moderation queue; parent uploads auto-approve

Controlled visibility
- Per-child public/private toggle, owned by the parent
- Public read-only profile at `/p/[childId]` (only renders when `isPublic` is true; only approved achievements show)
- No DMs, feeds, recommendations or connections

Admin panel
- Live metrics: total users, kid profiles, achievements, pending reviews
- Moderation queue with approve / keep pending / reject (deletes)
- User management: list, filter by role, suspend / reinstate / delete

Modern, calm UI
- Warm coral / amber / cream palette
- Instrument Serif (display) + Geist (sans) — no emoji
- Custom icon set (Lucide-style line icons)
- Public profile rendered as a magazine-quality portfolio

## Routes overview

- `GET /` — landing
- `GET /signup` — parent signup
- `GET /login` — universal login (parent / child / admin)
- `GET /forgot-password` — password reset
- `GET /dashboard` — role-aware dashboard
- `GET /p/[childId]` — public profile (only if parent has enabled public)
- `POST /api/auth/signup` — create parent
- `POST /api/auth/login` — login (enforces suspension + access approval)
- `POST /api/auth/logout` — logout
- `POST /api/auth/forgot-password` — set new password
- `GET  /api/me` — current user, child, or parent data
- `POST /api/children` — create child (parent only)
- `PATCH /api/children/[id]/visibility` — toggle public + login-allowed
- `PATCH /api/children/[id]/profile` — edit any profile field
- `GET / POST /api/achievements` — list / create achievement
- `POST /api/upload` — multipart file upload (photo / proof)
- `GET /api/admin/overview` — metrics + pending queue
- `GET /api/admin/users` — list users
- `PATCH /api/admin/users/[id]` — suspend / reinstate
- `DELETE /api/admin/users/[id]` — delete user
- `PATCH /api/admin/achievements/[id]` — approve / mark pending
- `DELETE /api/admin/achievements/[id]` — reject (delete)

## Files of interest

- `lib/brand.ts` — single source of truth for the product name
- `app/globals.css` — Plume design tokens + utility classes
- `app/components/icon.tsx` — line icon set
- `app/components/ui.tsx` — Button, Card, Chip, Badge, Input, Toggle, Modal, etc.
- `app/components/auth-shell.tsx` — split-pane layout used by login / signup / forgot-password
- `app/dashboard/{parent,child,admin}-view.tsx` — role-specific dashboards
- `app/dashboard/modals.tsx` — AddChild, EditProfile, NewAchievement wizards
