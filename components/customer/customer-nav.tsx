"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/orders", label: "Orders" },
  { href: "/profile", label: "Profile" },
] as const satisfies ReadonlyArray<{ href: Route; label: string }>;

const PLANS_ROUTE: Route = "/plans";

interface CustomerNavProps {
  email?: string | null;
}

export function CustomerNav({ email }: CustomerNavProps) {
  const pathname = usePathname();

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Signed in as</p>
        <p className="truncate font-semibold">{email ?? "Customer"}</p>
      </div>
      <nav className="mt-6 grid gap-1 text-sm">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Button
              key={item.href}
              variant="ghost"
              className={cn(
                "justify-start",
                isActive ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
              asChild
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          );
        })}
        <Button variant="ghost" className="justify-start text-muted-foreground" asChild>
          <Link href={PLANS_ROUTE}>Browse plans</Link>
        </Button>
      </nav>
    </div>
  );
}
