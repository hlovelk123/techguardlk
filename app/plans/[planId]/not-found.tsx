import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function PlanNotFound() {
  return (
    <div className="container flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Plan not found</h1>
      <p className="max-w-md text-muted-foreground">
        The plan you are looking for is no longer available. Explore other offers that fit your needs.
      </p>
      <Button asChild>
        <Link href="/plans">Browse plans</Link>
      </Button>
    </div>
  );
}
