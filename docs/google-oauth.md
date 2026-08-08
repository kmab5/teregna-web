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

## 4. The official Google mark

Google's branding guidelines require **their** asset on the button — a
hand-drawn imitation is a trademark reproduction and can fail their OAuth
verification review. So the button ships text-only.

To add the real mark:

1. Download it from <https://developers.google.com/identity/branding-guidelines>
2. Save as `public/google-mark.svg`
3. Pass `hasOfficialMark` in `src/components/teregna/auth-form.tsx`:

```tsx
<GoogleButton next={next} hasOfficialMark />
```

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
