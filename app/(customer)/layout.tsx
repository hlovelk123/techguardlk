import { redirect } from "next/navigation";

import { CustomerNav } from "@/components/customer/customer-nav";
import { getAuthSession } from "@/lib/auth";

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export default async function CustomerLayout({ children }: CustomerLayoutProps) {
  const session = await getAuthSession();

  if (!session) {
    redirect("/auth/signin?callbackUrl=/dashboard");
  }

  if (session.user.role !== "customer") {
    redirect("/admin");
  }

  return (
    <div className="container flex flex-col gap-8 py-10 lg:flex-row">
      <aside className="w-full lg:w-56">
        <CustomerNav email={session.user.email} />
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
