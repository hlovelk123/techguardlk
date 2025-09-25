import Link from "next/link";

import { Button } from "@/components/ui/button";

const providers = [
  "MusicPlus",
  "StreamMax",
  "NewsPro",
  "CourseSphere",
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="container flex flex-1 flex-col items-center gap-6 py-24 text-center">
        <span className="rounded-full border border-primary/30 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Digital subscriptions reimagined
        </span>
        <h1 className="max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
          Manage every seat, plan, and customer in one modern workspace.
        </h1>
        <p className="max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
          TechGuard helps small businesses sell, provision, and monitor seat-based digital
          subscriptions across premium content providers.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/plans">Browse plans</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/auth/signup">Start free trial</Link>
          </Button>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
          <span className="font-medium uppercase tracking-[0.25em] text-foreground">
            Trusted providers
          </span>
          {providers.map((provider) => (
            <span
              key={provider}
              className="rounded-full border border-dashed border-muted-foreground/30 px-3 py-1"
            >
              {provider}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
