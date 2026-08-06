import { Suspense } from "react";
import { AuthForm } from "@/components/teregna/auth-form";

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm
        mode="signin"
        audience="receiver"
        title="Welcome back"
        subtitle="Sign in to send requests and track your place in line."
      />
    </Suspense>
  );
}
