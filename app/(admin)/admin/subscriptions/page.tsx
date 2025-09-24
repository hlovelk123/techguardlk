import { AdminSubscriptionsTable } from "@/components/admin/subscriptions-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

interface SubscriptionsPageProps {
  searchParams: { q?: string };
}

export default async function AdminSubscriptionsPage({ searchParams }: SubscriptionsPageProps) {
  await requireAdmin();
  const query = searchParams.q?.toLowerCase();

  const subscriptions = await prisma.subscription.findMany({
    where: query
      ? {
          OR: [
            { id: { equals: query } },
            { user: { email: { contains: query, mode: "insensitive" } } },
            { plan: { name: { contains: query, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: {
      user: true,
      plan: {
        include: {
          provider: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscriptions</CardTitle>
      </CardHeader>
      <CardContent>
        <AdminSubscriptionsTable subscriptions={subscriptions} />
      </CardContent>
    </Card>
  );
}
