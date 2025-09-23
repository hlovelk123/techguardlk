import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { subscriptionId: string; entitlementId: string } },
) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const entitlement = await prisma.entitlement.findFirst({
    where: {
      id: params.entitlementId,
      subscription: {
        id: params.subscriptionId,
        userId: session.user.id,
      },
    },
  });

  if (!entitlement) {
    return NextResponse.json({ message: "Entitlement not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.entitlement.update({
      where: { id: entitlement.id },
      data: {
        status: "unassigned",
        assigneeEmail: null,
        userId: null,
      },
    });

    await writeAuditLog({
      action: "entitlement.unassign",
      entityType: "entitlement",
      entityId: entitlement.id,
      actorType: "user",
      actorUserId: session.user.id,
      changes: {
        previousAssignee: entitlement.assigneeEmail,
      },
      client: tx,
    });
  });

  return NextResponse.json({ success: true });
}
