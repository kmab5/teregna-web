# Google sign-in — setup

The code is done. What remains is configuration, in two consoles. Getting one
URL wrong here is the difference between working and a blank redirect, so the
exact values are listed rather than described.

## 1. Google Cloud Console

**APIs & Services → Credentials → your OAuth 2.0 Client ID**

**Authorised JavaScript origins**

```
https://teregna-web.vercel.app
http://localhost:3000
```

**Authorised redirect URIs** — this is Supabase's callback, *not* your app's:

```
https://<project-ref>.supabase.co/auth/v1/callback
```

> The single most common mistake is putting your app's `/auth/callback` here.
> Google redirects to **Supabase**, and Supabase then redirects to your app.

**OAuth consent screen** must list your app name, support email, and a privacy
policy URL before Google will let external users sign in.

## 2. Supabase Dashboard

**Authentication → Providers → Google:** enable, paste the Client ID and Client
Secret from step 1.

**Authentication → URL Configuration:**

| Field | Value |
|---|---|
| Site URL | `https://teregna-web.vercel.app` |
| Redirect URLs | `https://teregna-web.vercel.app/**` |
| | `http://localhost:3000/**` |
| | `https://*-teregna-web.vercel.app/**` (preview deploys) |

The wildcard preview entry matters: every Vercel preview gets a fresh
subdomain, and without it sign-in works in production but silently fails on
every PR preview.

## 3. Vercel

**Settings → Environment Variables**, for Production *and* Preview:

```
NEXT_PUBLIC_SUPABASE_URL       https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  <anon key>
NEXT_PUBLIC_SITE_URL           https://teregna-web.vercel.app
```

## 4. The button asset — already installed

Google's official assets are in `public/google/`, byte-identical to the
download, renamed only because the originals contain spaces, commas and `=` in
their filenames, which are unusable in a URL.

The app renders Google's **complete button**, not their logo dropped into a
Teregna button. That is forced by the asset pack itself: it contains **no bare
"G"** — every file is a whole button — so composing a custom one would mean
redrawing their mark, which their guidelines prohibit and their OAuth
verification review can fail you for.

Consequences worth knowing:

- The button keeps its own 180:40 proportions and sits centred rather than
  spanning the form. Stretching it would distort the mark.
- It reads "Sign in with Google" on the sign-up page too. That is the only text
  variant Google ships.
- It is served with a plain `<img>`, not `next/image`. `next/image` refuses SVG
  unless `dangerouslyAllowSVG` is enabled, and loosening that project-wide for
  two static first-party files is a worse trade. Nothing to optimise anyway —
  the asset is already vector.
- Light and dark variants both render, swapped by CSS, so there is no flash of
  the wrong one.

Other variants are already in `public/google/` if you want them:
`icon-light.svg`, `icon-dark.svg` (icon-only, 40×40) and `signin-neutral.svg`.

## How the flow runs

1. Button calls `signInWithOAuth` with
   `redirectTo = <origin>/auth/callback?next=<destination>`
2. Supabase sends the browser to Google with a PKCE challenge
3. Google returns to **Supabase**'s `/auth/v1/callback`
4. Supabase returns to **your** `/auth/callback?code=…&next=…`
5. `exchangeCodeForSession` sets the session cookie
6. Redirect to `next`, sanitised by `safeNext`

## Two things handled in code that bite people

**Vercel's load balancer.** `new URL(request.url).origin` inside the callback is
the *internal* host, not `teregna-web.vercel.app`. Redirecting there is a dead
end. The route reads `x-forwarded-host` in production and only falls back to
`origin` locally.

**Open redirect.** `?next=` is attacker-controllable. `safeNext` refuses
off-site and protocol-relative targets, and refuses auth pages so the round
trip cannot loop. Covered by `npm test`.

## Troubleshooting

| Symptom | Cause |
|---|---|
| Lands on a Supabase error page | Redirect URL not allowlisted (step 2) |
| `redirect_uri_mismatch` from Google | Wrong URI in step 1 — must be Supabase's |
| Returns signed-out | `router.refresh()` missing, or cookies blocked |
| Works in production, fails on previews | Missing the `*-teregna-web` wildcard |
| Redirects to a Vercel internal URL | `x-forwarded-host` not handled — fixed here |
