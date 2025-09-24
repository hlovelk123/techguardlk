import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth-helpers";
import { formatDate } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

interface CustomersPageProps {
  searchParams: { q?: string };
}

export default async function AdminCustomersPage({ searchParams }: CustomersPageProps) {
  await requireAdmin();
  const query = searchParams.q?.toLowerCase();

  const customers = await prisma.user.findMany({
    where: {
      role: "customer",
      ...(query
        ? {
            OR: [
              { email: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      _count: {
        select: {
          subscriptions: true,
          orders: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Subscriptions</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.name ?? "–"}</TableCell>
                  <TableCell>{customer._count.subscriptions}</TableCell>
                  <TableCell>{customer._count.orders}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(customer.createdAt)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    <Link className="text-primary underline" href={`/admin/customers/${customer.id}`}>
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
