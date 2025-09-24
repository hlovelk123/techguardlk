import { ReactNode } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/auth-helpers";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await requireAdmin();

  return (
    <div className="container flex flex-col gap-8 py-10 lg:flex-row">
      <aside className="w-full lg:w-60">
        <AdminNav userEmail={session.user.email} />
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
