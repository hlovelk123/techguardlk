import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function PlansNotFound() {
  return (
    <div className="container flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">No plans available</h1>
      <p className="max-w-md text-muted-foreground">
        We&apos;re refreshing our catalog. Please check back soon or contact support for bespoke options.
      </p>
      <Button asChild>
        <Link href="/">Return home</Link>
      </Button>
    </div>
  );
}
