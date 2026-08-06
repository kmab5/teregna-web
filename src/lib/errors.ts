/**
 * The shared error model. Every RPC raises a bare code with SQLSTATE P0001;
 * we translate codes to sentences a person can act on.
 *
 * Errors explain what happened and what to do. They do not apologise and they
 * are never vague.
 */

export type TeregnaErrorCode =
  | "unauthenticated"
  | "not_owner"
  | "provider_inactive"
  | "invalid_transition"
  | "not_archived"
  | "too_many_open_requests"
  | "duplicate_request"
  | "invalid_item"
  | "invalid_mode"
  | "invalid_range"
  | "not_found"
  | "unknown";

const MESSAGES: Record<TeregnaErrorCode, string> = {
  unauthenticated: "Your session ended. Sign in to pick up where you left off.",
  // Deliberately indistinguishable from not-found: confirming a request exists
  // but belongs to someone else would be an enumeration oracle.
  not_owner: "That request is no longer available to you.",
  provider_inactive: "This provider has stopped taking requests for now.",
  invalid_transition: "This request already moved on. Refreshing to catch up.",
  not_archived: "That request is already back in the queue.",
  too_many_open_requests:
    "You already have three requests open with this provider. Finish or cancel one first.",
  duplicate_request: "That request already went through. Check My requests.",
  invalid_item: "The menu changed while you were choosing. Reload and pick again.",
  invalid_mode: "Something went wrong restoring that request.",
  invalid_range: "Pick an end date that comes after the start date.",
  not_found: "We could not find that.",
  unknown: "Something went wrong. Try again in a moment.",
};

const KNOWN = new Set(Object.keys(MESSAGES));

/** Pull the bare code out of whatever the SDK threw. */
export function errorCode(error: unknown): TeregnaErrorCode {
  if (!error) return "unknown";
  const raw =
    typeof error === "string"
      ? error
      : ((error as { message?: string })?.message ?? "");
  const code = raw.trim().split("\n")[0].trim();
  return (KNOWN.has(code) ? code : "unknown") as TeregnaErrorCode;
}

/** A sentence to show the person. Never a Postgres string. */
export function errorMessage(error: unknown): string {
  const code = errorCode(error);
  if (code === "unknown" && process.env.NODE_ENV === "development") {
    console.error("Unmapped error:", error);
  }
  return MESSAGES[code];
}

/** A race, not a bug: two devices acting on the same request. Refetch. */
export function isRace(error: unknown): boolean {
  const code = errorCode(error);
  return code === "invalid_transition" || code === "not_archived";
}
