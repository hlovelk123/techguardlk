import Link from "next/link";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/signin-form";

export default function SignInPage() {
  return (
    <div className="w-full max-w-md space-y-6 text-center">
      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
      <p className="text-sm text-muted-foreground">
        New to TechGuard? <Link className="text-primary underline" href="/auth/signup">Create an account</Link>
      </p>
      <p className="text-sm text-muted-foreground">
        Forgot your password? <Link className="text-primary underline" href="/auth/reset">Reset it</Link>
      </p>
    </div>
  );
}
