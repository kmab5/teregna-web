import { Suspense } from "react";
import { AuthForm } from "@/components/teregna/auth-form";

export default function SignupPage() {
  return (
    <Suspense>
      <AuthForm
        mode="signup"
        audience="receiver"
        title="Create your account"
        subtitle="One account. Join queues, and run one if you ever want to."
      />
    </Suspense>
  );
}
