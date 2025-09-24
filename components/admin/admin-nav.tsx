"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/providers", label: "Providers" },
  { href: "/admin/plans", label: "Plans" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/audit", label: "Audit" },
] as const satisfies ReadonlyArray<{ href: Route; label: string }>;

interface AdminNavProps {
  userEmail?: string | null;
}

export function AdminNav({ userEmail }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Administrator</p>
        <p className="truncate font-semibold">{userEmail ?? "Admin"}</p>
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
          <Link href="/dashboard">Customer view</Link>
        </Button>
      </nav>
    </div>
  );
}
