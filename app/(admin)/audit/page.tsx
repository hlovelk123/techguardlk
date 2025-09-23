import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth-helpers";
import { formatDateTime } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

interface AuditPageProps {
  searchParams: { action?: string };
}

export default async function AuditLogsPage({ searchParams }: AuditPageProps) {
  await requireAdmin();

  const logs = await prisma.auditLog.findMany({
    where: {
      action: searchParams.action ?? undefined,
    },
    include: {
      actorUser: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit trail</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                <TableCell>{log.actorUser?.email ?? log.actorType}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>
                  {log.entityType}
                  <span className="block text-xs text-muted-foreground">{log.entityId}</span>
                </TableCell>
                <TableCell>
                  <pre className="max-w-xs whitespace-pre-wrap text-xs">
                    {JSON.stringify(log.changes, null, 2)}
                  </pre>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
