import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncEntitlements as syncEntitlementsHelper } from "@/lib/stripe/webhook-handlers";

const updateSchema = z.object({
  status: z.enum(["trialing", "active", "past_due", "canceled", "expired"]).optional(),
  quantity: z.number().int().min(1).max(500).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { subscriptionId: string } },
) {
  const session = await getAuthSession();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id: params.subscriptionId },
    include: {
      entitlements: true,
    },
  });

  if (!subscription) {
    return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
  }

  let payload: z.infer<typeof updateSchema>;

  try {
    payload = updateSchema.parse(await request.json());
  } catch (error) {
    return NextResponse.json(
      {
        message: "Invalid payload",
        details: error instanceof z.ZodError ? error.flatten() : undefined,
      },
      { status: 400 },
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        status: payload.status ?? subscription.status,
        quantity: payload.quantity ?? subscription.quantity,
      },
      include: {
        plan: true,
        user: true,
        entitlements: true,
      },
    });

    if (payload.quantity) {
      await syncEntitlementsHelper(tx, result.id, payload.quantity);
    }

    await writeAuditLog({
      action: "subscription.admin_update",
      entityType: "subscription",
      entityId: result.id,
      actorType: "user",
      actorUserId: session.user.id,
      changes: payload,
      client: tx,
    });

    return result;
  });

  return NextResponse.json({ subscription: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { subscriptionId: string } },
) {
  const session = await getAuthSession();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.subscription.update({
      where: { id: params.subscriptionId },
      data: {
        status: "canceled",
        canceledAt: new Date(),
      },
    });

    await tx.entitlement.updateMany({
      where: { subscriptionId: params.subscriptionId },
      data: { status: "revoked" },
    });

    await writeAuditLog({
      action: "subscription.admin_cancel",
      entityType: "subscription",
      entityId: params.subscriptionId,
      actorType: "user",
      actorUserId: session.user.id,
      client: tx,
    });
  });

  return NextResponse.json({ success: true });
}
