import { Suspense } from "react";
import { AuthForm } from "@/components/teregna/auth-form";

/**
 * A separate door, not a separate identity. The same account signs in here;
 * the route decides which experience you land in.
 */
export default function ProviderLoginPage() {
  return (
    <Suspense>
      <AuthForm
        mode="signin"
        audience="provider"
        title="Provider sign in"
        subtitle="Open your queue, manage what you offer, and see how the week went."
      />
    </Suspense>
  );
}
