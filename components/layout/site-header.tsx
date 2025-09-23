import Link from "next/link";

import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="rounded bg-primary/10 px-2 py-1 text-primary">TechGuard</span>
          <span className="hidden font-medium text-muted-foreground sm:inline">Digital Seats</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link className="transition hover:text-foreground" href="/plans">
            Plans
          </Link>
          <Link className="transition hover:text-foreground" href="/auth/signin">
            Sign in
          </Link>
          <Button asChild size="sm">
            <Link href="/auth/signup">Create account</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
