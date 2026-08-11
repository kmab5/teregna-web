import { AuthForm } from "@/components/teregna/auth-form";

/**
 * searchParams are read here, on the server, and passed to the form. Reading
 * them with useSearchParams() inside the client component would defer the whole
 * form behind a Suspense boundary and flash an empty page first.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <AuthForm
      mode="signup"
      audience="receiver"
      titleKey="auth.createTitle"
      subtitleKey="auth.createTitle"
      nextParam={next}
      errorParam={error}
    />
  );
}
