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
| `npm run verify` | Typecheck + lint + build. Run before pushing |
| `npm run build` | Production build |

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

### Two surfaces, one identity

`/provider/*` and the receiver routes are separate doors, not separate accounts.
The same user can sign into either; the route group picks the experience. A
signed-in user with no provider row is sent to onboarding.

Route guards in `src/proxy.ts` are convenience. **RLS decides what any request
can actually read or write** — a hidden route is not a security boundary.

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
│   ├── errors.ts             code -> sentence
│   └── database.types.ts     regenerate from the backend, do not hand-edit
└── proxy.ts                  session refresh + route guards
```

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
| `NEXT_PUBLIC_SITE_URL` | For auth redirects |

Then register the Vercel production **and** preview domains as allowed redirect
URLs in Supabase Auth, or sign-in will bounce.

Point Preview at your staging Supabase branch and Production at production.
