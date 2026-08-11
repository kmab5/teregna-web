/**
 * Server/client boundary checks.
 *
 * These exist because `next build` does NOT catch this class of mistake. A
 * component that calls a client-only hook without "use client" compiles fine
 * and type-checks fine; it throws at REQUEST time, on the server, and for a
 * dynamically-rendered route that means the first person to load the page sees
 * the error rather than CI.
 *
 * That is exactly how provider-card.tsx shipped broken: it started as a pure
 * presentational component with no hooks and no directive, then gained a
 * useT() call, and the landing page renders it on the server.
 *
 * Run: node --experimental-strip-types tests/boundaries.test.mts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SRC = new URL("../src", import.meta.url).pathname;

/** Hooks and APIs that only work inside a client component. */
const CLIENT_ONLY = [
  "useT(", "useLocale(", "useLocaleFormat(", "useNow(",
  "useState(", "useEffect(", "useMemo(", "useReducer(", "useRef(",
  "useContext(", "useTransition(", "useSyncExternalStore(",
  "usePathname(", "useRouter(", "useSearchParams(", "useTheme(",
  "useQuery(", "useMutation(", "useQueryClient(",
];

/** Modules that only work on the server. */
const SERVER_ONLY = [
  'from "next/headers"',
  'from "@/i18n/server"',
  'from "@/lib/supabase/server"',
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.tsx?$/.test(full) ? [full] : [];
  });
}

/**
 * Comments are stripped before scanning. Several files legitimately *mention*
 * useSearchParams() in a comment explaining why they avoid it, and a naive
 * substring match reports those as violations - a checker that cries wolf gets
 * ignored, which is worse than not having one.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const files = walk(SRC).map((f) => ({
  path: relative(SRC, f),
  source: readFileSync(f, "utf8"),
  code: stripComments(readFileSync(f, "utf8")),
}));

/** Only the first few lines count — the directive must lead the module. */
const isClient = (source: string) =>
  source.split("\n").slice(0, 4).some((l) => /^\s*["']use client["']/.test(l));
const isServerAction = (source: string) =>
  source.split("\n").slice(0, 4).some((l) => /^\s*["']use server["']/.test(l));

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

check("every file using a client-only hook declares \"use client\"", () => {
  const offenders = files
    .filter(({ path, source, code }) => {
      if (isClient(source) || path.startsWith("i18n/messages")) return false;
      return CLIENT_ONLY.some((hook) => code.includes(hook));
    })
    .map(({ path, code }) => {
      const hook = CLIENT_ONLY.find((h) => code.includes(h));
      return `${path} (${hook})`;
    });
  assert.deepEqual(offenders, [], `missing "use client": ${offenders.join(", ")}`);
});

check("no client component imports server-only modules", () => {
  const offenders = files
    .filter(({ source }) => isClient(source))
    .filter(({ code }) => SERVER_ONLY.some((imp) => code.includes(imp)))
    .map(({ path }) => path);
  assert.deepEqual(offenders, [], `server import in client: ${offenders.join(", ")}`);
});

check("server actions are marked \"use server\"", () => {
  const actions = files.filter(({ path }) => path.endsWith("i18n/actions.ts"));
  assert.ok(actions.length > 0, "expected i18n/actions.ts to exist");
  const unmarked = actions.filter(({ source }) => !isServerAction(source));
  assert.deepEqual(unmarked.map((f) => f.path), []);
});

check("the i18n client entry is itself a client module", () => {
  const client = files.find(({ path }) => path === "i18n/client.tsx");
  assert.ok(client, "i18n/client.tsx not found");
  assert.ok(isClient(client!.source), 'i18n/client.tsx must declare "use client"');
});

console.log(`\n  ${pass} boundary checks passed`);
