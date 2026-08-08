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
      mode="signin"
      audience="receiver"
      title="Welcome back"
      subtitle="Sign in to send requests and track your place in line."
      nextParam={next}
      errorParam={error}
    />
  );
}
