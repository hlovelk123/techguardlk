import { EntitlementStatus } from "@prisma/client";

import { UnassignSeatButton } from "@/components/subscriptions/entitlements/unassign-seat-button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/formatters";

const statusLabel: Record<EntitlementStatus, string> = {
  assigned: "Assigned",
  unassigned: "Available",
  revoked: "Revoked",
};

interface EntitlementTableProps {
  subscriptionId: string;
  entitlements: Array<{
    id: string;
    assigneeEmail: string | null;
    status: EntitlementStatus;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export function EntitlementsTable({ subscriptionId, entitlements }: EntitlementTableProps) {
  if (entitlements.length === 0) {
    return (
      <TableCaption className="text-left">
        No seats provisioned yet. Increase quantity to generate available seats.
      </TableCaption>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Seat</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entitlements.map((entitlement, index) => (
          <TableRow key={entitlement.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">Seat {index + 1}</span>
                <span className="text-xs text-muted-foreground">
                  {entitlement.assigneeEmail ?? "Unassigned"}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-sm font-medium">
              {statusLabel[entitlement.status]}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {formatDateTime(entitlement.updatedAt)}
            </TableCell>
            <TableCell className="text-right">
              {entitlement.status === EntitlementStatus.assigned ? (
                <UnassignSeatButton
                  subscriptionId={subscriptionId}
                  entitlementId={entitlement.id}
                />
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
