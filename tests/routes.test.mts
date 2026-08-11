/**
 * Regression tests for the redirect loop.
 *
 * A signed-out visitor hitting /provider/login was being redirected to
 * /provider/login, forever, with a ?next= nesting inside itself on every hop.
 * These lock the fix in.
 *
 * Run: node --experimental-strip-types tests/routes.test.mts
 */
import assert from "node:assert/strict";
import { guardFor, isPublicPath, safeNext } from "../src/lib/routes.ts";

let pass = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    pass++;
    console.log(`  ok    ${name}`);
  } catch (e) {
    console.error(`  FAIL  ${name}\n        ${(e as Error).message}`);
    process.exitCode = 1;
  }
}

// --- the bug -------------------------------------------------------------
check("the provider login page is never guarded", () => {
  assert.equal(guardFor("/provider/login"), null);
});
check("the receiver login and signup pages are never guarded", () => {
  assert.equal(guardFor("/login"), null);
  assert.equal(guardFor("/signup"), null);
});
check("auth callback and signout are never guarded", () => {
  assert.equal(guardFor("/auth/callback"), null);
  assert.equal(guardFor("/auth/signout"), null);
});

// --- guards still work ---------------------------------------------------
check("portal pages route to the provider door", () => {
  for (const p of ["/provider", "/provider/archive", "/provider/items",
                   "/provider/analytics", "/provider/settings",
                   "/provider/onboarding"]) {
    assert.equal(guardFor(p), "provider", p);
  }
});
check("my requests routes to the receiver door", () => {
  assert.equal(guardFor("/requests"), "receiver");
});
check("public browsing is never guarded", () => {
  for (const p of ["/", "/browse", "/p/abc-123"]) {
    assert.equal(guardFor(p), null, p);
  }
});
check("a path merely starting with a public prefix is not public", () => {
  // /loginsomething must not be treated as /login
  assert.equal(isPublicPath("/loginsomething"), false);
  assert.equal(isPublicPath("/provider/logins"), false);
});

// --- post-login destination ---------------------------------------------
check("a real destination is preserved", () => {
  assert.equal(safeNext("/provider/archive", "/provider"), "/provider/archive");
  assert.equal(safeNext("/requests", "/browse"), "/requests");
});
check("a missing destination falls back", () => {
  assert.equal(safeNext(null, "/browse"), "/browse");
});
check("an auth page is never a post-login destination", () => {
  assert.equal(safeNext("/provider/login", "/provider"), "/provider");
  assert.equal(safeNext("/login", "/browse"), "/browse");
  assert.equal(
    safeNext("/provider/login?next=/provider/login", "/provider"),
    "/provider",
  );
});
check("off-site destinations are refused (open redirect)", () => {
  assert.equal(safeNext("https://evil.example/x", "/browse"), "/browse");
  assert.equal(safeNext("//evil.example/x", "/browse"), "/browse");
  assert.equal(safeNext("javascript:alert(1)", "/browse"), "/browse");
});

console.log(`\n  ${pass} checks passed`);

// --- i18n catalogue parity -------------------------------------------------
// TypeScript already enforces this at build time (am.ts is typed as Messages),
// but an explicit check names the offending key instead of emitting a wall of
// type errors, and catches placeholder drift that types cannot see.
import { en } from "../src/i18n/messages/en.ts";
import { am } from "../src/i18n/messages/am.ts";

const enKeys = Object.keys(en);
const amKeys = Object.keys(am);

check("every English key has an Amharic translation", () => {
  const missing = enKeys.filter((k) => !(k in am));
  assert.deepEqual(missing, [], `missing in am: ${missing.join(", ")}`);
});

check("no orphaned Amharic keys", () => {
  const extra = amKeys.filter((k) => !(k in en));
  assert.deepEqual(extra, [], `not in en: ${extra.join(", ")}`);
});

check("no Amharic value is left as English", () => {
  const untranslated = enKeys.filter(
    (k) =>
      (am as Record<string, string>)[k] === (en as Record<string, string>)[k] &&
      // Proper nouns and codes legitimately match.
      !["app.name", "auth.email"].includes(k),
  );
  assert.deepEqual(untranslated, [], `identical to English: ${untranslated.join(", ")}`);
});

check("placeholders match between locales", () => {
  const drift: string[] = [];
  for (const k of enKeys) {
    const ph = (s: string) => (s.match(/\{(\w+)\}/g) ?? []).sort().join(",");
    const a = ph((en as Record<string, string>)[k]);
    const b = ph((am as Record<string, string>)[k]);
    if (a !== b) drift.push(`${k} (en:${a || "none"} vs am:${b || "none"})`);
  }
  assert.deepEqual(drift, [], `placeholder drift: ${drift.join("; ")}`);
});

check("every plural key has both .one and .other", () => {
  const bases = new Set(
    enKeys.filter((k) => k.endsWith(".one")).map((k) => k.slice(0, -4)),
  );
  const broken: string[] = [];
  for (const b of bases) {
    for (const cat of ["one", "other"]) {
      if (!(`${b}.${cat}` in en)) broken.push(`en ${b}.${cat}`);
      if (!(`${b}.${cat}` in am)) broken.push(`am ${b}.${cat}`);
    }
  }
  assert.deepEqual(broken, [], `incomplete plurals: ${broken.join(", ")}`);
});
