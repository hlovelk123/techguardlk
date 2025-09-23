import { redirect } from "next/navigation";

import { getAuthSession } from "@/lib/auth";

export async function requireCustomer() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/auth/signin?callbackUrl=/dashboard");
  }

  if (session.user.role !== "customer") {
    redirect("/admin");
  }

  return session;
}

export async function requireUser() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/auth/signin");
  }

  return session;
}

export async function requireAdmin() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return session;
}
