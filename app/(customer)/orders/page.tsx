import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthSession } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

export default async function OrdersPage() {
  const session = await getAuthSession();

  if (!session) {
    return null;
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <CardDescription>Your recent purchases and billing history.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {orders.length === 0 ? (
          <p className="text-muted-foreground">No orders yet.</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{formatCurrency(order.amountCents)}</p>
                <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
              </div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{order.status}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
