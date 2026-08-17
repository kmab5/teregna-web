# Teregna — Web

ተረኛ · *the one whose turn it is*

The web frontend: a **receiver app** (discover, request, track your place) and a
**provider portal** (work the queue, archive, items, analytics) in one Next.js
codebase, deployed to Vercel.

## Setup

Needs Node.js 20+ and a running Teregna backend.

```
npm install
cp .env.example .env.local     # fill in your Supabase URL + anon key
npm run dev
```

Open <http://localhost:3000>.

Against a local backend, `npm run status` in `teregna-backend` prints the URL
and anon key to paste in.

| Command | Does |
|---------|------|
| `npm run dev` | Dev server |
| `npm test` | Route guards, i18n catalogue parity, server/client boundaries |
| `npm run verify` | Lint + test + build. Run before pushing |
| `npm run typecheck` | Standalone `tsc`. See the note below |
| `npm run build` | Production build |

### Server/client boundaries

`tests/boundaries.test.mts` asserts that any file calling a client-only hook
declares `"use client"`, and that no client component imports server-only code.

This is a test rather than a build step because **`next build` cannot catch it**.
A component that calls `useT()` without the directive compiles and type-checks
cleanly, then throws at *request* time on the server. For a dynamically rendered
route that means the first real visitor sees the error, not CI.

That is precisely how `provider-card.tsx` shipped broken: it began as a pure
presentational component with no hooks and no directive, later gained a `useT()`
call, and the landing page renders it on the server.

### A note on `npm run typecheck`

`next build` regenerates `.next/types/validator.ts` from the current route tree
and then type-checks it, so `npm run verify` is always accurate.

A standalone `tsc --noEmit` checks whatever `.next/types` was left behind by the
*last* build. Add, move or delete a route and it will report phantom
`Cannot find module '.../page.js'` errors until you rebuild. If that happens,
delete `.next` and re-run — it is a stale artifact, not a real error.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4 ·
Radix primitives · TanStack Query · Supabase SSR · Recharts · sonner ·
next-themes · lucide-react

## How it talks to the backend

Everything goes through the contract in `teregna-backend`:

- **Reads** hit RLS-protected views — `provider_public`, `provider_queue`,
  `provider_archive`, `my_requests`.
- **Writes** go through RPC only (`src/lib/rpc.ts`). There is no other way in:
  clients hold no write grant on `requests`.
- **Realtime** subscribes to `requests` filtered by `provider_id` or
  `receiver_id`, then **refetches the view**. Position is derived server-side
  from `seq`, so recomputing it locally would drift. Liveness is not truth.
- **Errors** arrive as bare codes and are mapped to sentences in
  `src/lib/errors.ts`. A raw Postgres string never reaches a person.

### Sign-in

Email/password and **Google OAuth**. Both land on `/auth/callback`, which trades
the PKCE code for a session cookie and returns the person to `?next=`,
sanitised by `safeNext`.

Google needs configuration in two consoles before it will work — the exact
values are in [`docs/google-oauth.md`](docs/google-oauth.md). The button ships
text-only because Google's branding guidelines require their own asset; that doc
says where to get it and how to switch it on.

### Two surfaces, one identity

`/provider/*` and the receiver routes are separate doors, not separate accounts.
The same user can sign into either; the route group picks the experience. A
signed-in user with no provider row is sent to onboarding.

Route guards in `src/proxy.ts` are convenience. **RLS decides what any request
can actually read or write** — a hidden route is not a security boundary.

### Why `(portal)` is a route group

The authenticated portal pages live in `src/app/provider/(portal)/`, and its
layout holds the auth guard. `/provider/login` sits *outside* that group.

This matters: when the guard layout sat directly at `/provider`, it also wrapped
`/provider/login`, so a signed-out visitor was redirected from the login page to
the login page — an infinite loop. The proxy had the same flaw, since
`pathname.startsWith("/provider")` matches `/provider/login` too.

Route groups do not change URLs, so `/provider`, `/provider/archive` and the
rest are unaffected.

**If you add a page a signed-out person needs, put it outside `(portal)` and add
it to `PUBLIC_PREFIXES` in `src/lib/routes.ts`.** `npm test` covers this.

## Structure

```
src/
├── app/
│   ├── page.tsx              landing
│   ├── browse/               discovery (guest-browsable)
│   ├── p/[providerId]/       provider detail + send request (SSR)
│   ├── requests/             my requests, live position
│   ├── login, signup/        receiver auth
│   ├── auth/                 callback + signout handlers
│   └── provider/             portal: queue, archive, items, analytics, settings
├── components/
│   ├── ui/                   owned primitives (Radix + Tailwind)
│   └── teregna/              QueueRow, ProviderCard, ChartCard, ...
├── lib/
│   ├── supabase/             browser, server and proxy clients
│   ├── queries.ts            TanStack Query hooks + realtime
│   ├── rpc.ts                typed RPC wrappers
│   ├── routes.ts             public paths, guards, safe redirect targets
│   ├── errors.ts             code -> sentence
│   └── database.types.ts     regenerate from the backend, do not hand-edit
└── proxy.ts                  session refresh + route guards
```

## Keeping in step with the mobile app

The two apps copy `database.types.ts`, `errors.ts`, `query-keys.ts` and the
`i18n/messages` catalogues rather than sharing a package. That is simple, and it
silently allows drift — the web app once fell **77 keys behind** while mobile
gained orders, the guide and the theme control.

`npm test` now asserts that every feature shipped on both platforms has its keys
here. When you add something to one app, port it to the other and run both test
suites.

Deliberately mobile-only: push notifications, the first-run intro slides, and the
offline banner. A browser tab has its own answers to all three.

## Responsive behaviour

Mobile-first, and tested down to **320px**.

Navigation moves to a **bottom tab bar** below `md`. That is not only about
finding room — laid out horizontally the receiver header needed ~600px in a
343px space and the provider's five tabs needed ~435px. Shrinking them would
have produced targets too small to hit. Bottom placement also matches how the
app is used: a receiver checking their position and a provider finishing the
next request are both one-handed, standing up, thumb near the bottom of the
screen.

| Breakpoint | Change |
|---|---|
| `< 360px` | Item sheet number fields stack |
| `< 400px` | Wordmark drops, mark only |
| `< 640px` (`sm`) | Rows stack: identity above, controls below. Action buttons go full-width |
| `< 768px` (`md`) | Top nav replaced by bottom tab bar; provider tabs move there too |

Other rules the code holds to:

- `viewportFit: "cover"` plus `env(safe-area-inset-bottom)`, so the tab bar
  clears the iOS home indicator rather than sitting under it.
- Pages that show the tab bar reserve its height, so the last control is never
  covered.
- Long business names truncate rather than pushing the status pill off-screen.
- Tab bar rows are 56px tall — past the 44px minimum target.

## Design

Tokens live in `src/app/globals.css` and come from
`docs/frontend/design-system.md`: trust-purple primary, transaction-green
accent, Outfit / Work Sans / JetBrains Mono, plus Noto Sans Ethiopic for Amharic.

Rules the code holds to:

- **Status is never colour alone.** Every state carries an icon and a word.
- **Every chart has a table toggle.** Same content, one tap away.
- **Focus is always visible**; targets are ≥44px; reduced motion is respected.
- **The queue rail** is the signature: position numbers in mono, seated on a
  vertical rule down the queue. Order is the product, so order is what you see.

## Deploying to Vercel

Set per environment (Production / Preview / Development):

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Environment's API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `NEXT_PUBLIC_SITE_URL` | Auth redirects and OG image URLs |

Then register the Vercel production **and** preview domains as allowed redirect
URLs in Supabase Auth, or sign-in will bounce. Preview deploys need the wildcard
`https://*-teregna-web.vercel.app/**` — without it, sign-in works in production
and fails silently on every PR. Full list in
[`docs/google-oauth.md`](docs/google-oauth.md).

Point Preview at your staging Supabase branch and Production at production.
