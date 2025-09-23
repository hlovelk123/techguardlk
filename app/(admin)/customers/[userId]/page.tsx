import { notFound } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth-helpers";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

interface CustomerDetailPageProps {
  params: { userId: string };
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    include: {
      subscriptions: {
        include: {
          plan: {
            include: {
              provider: true,
            },
          },
        },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{user.email}</CardTitle>
          <CardDescription>User ID: {user.id}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Name</p>
            <p className="font-medium">{user.name ?? "–"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Role</p>
            <p className="font-medium capitalize">{user.role}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Created</p>
            <p className="font-medium">{formatDate(user.createdAt)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Updated</p>
            <p className="font-medium">{formatDate(user.updatedAt)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {user.subscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subscriptions.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Renewal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-mono text-xs">{subscription.id}</TableCell>
                    <TableCell>
                      {subscription.plan.name}
                      <span className="block text-xs text-muted-foreground">
                        {subscription.plan.provider.name}
                      </span>
                    </TableCell>
                    <TableCell className="capitalize">{subscription.status.replace("_", " ")}</TableCell>
                    <TableCell>{subscription.quantity}</TableCell>
                    <TableCell>{formatDate(subscription.currentPeriodEnd)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
        </CardHeader>
        <CardContent>
          {user.orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{formatCurrency(order.amountCents)}</TableCell>
                    <TableCell className="text-xs uppercase">{order.status}</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
