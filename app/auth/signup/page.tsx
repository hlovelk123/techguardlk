import Link from "next/link";

import { SignUpForm } from "@/components/auth/signup-form";

export default function SignUpPage() {
  return (
    <div className="w-full max-w-md space-y-6 text-center">
      <SignUpForm />
      <p className="text-sm text-muted-foreground">
        Already have an account? <Link className="text-primary underline" href="/auth/signin">Sign in</Link>
      </p>
    </div>
  );
}
