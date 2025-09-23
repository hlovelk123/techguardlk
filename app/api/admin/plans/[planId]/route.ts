import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  interval: z.enum(["month", "year"]).optional(),
  priceCents: z.number().int().min(100).optional(),
  currency: z.string().length(3).optional(),
  seatCapacityPerPurchase: z.number().int().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  stripePriceId: z.string().optional().nullable(),
  stripeProductId: z.string().optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { planId: string } },
) {
  const session = await getAuthSession();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const plan = await prisma.plan.findUnique({ where: { id: params.planId } });

  if (!plan) {
    return NextResponse.json({ message: "Plan not found" }, { status: 404 });
  }

  try {
    const payload = updateSchema.parse(await request.json());

    const updated = await prisma.plan.update({
      where: { id: params.planId },
      data: {
        ...payload,
        stripePriceId: payload.stripePriceId ?? plan.stripePriceId,
        stripeProductId: payload.stripeProductId ?? plan.stripeProductId,
      },
      include: {
        provider: true,
      },
    });

    await writeAuditLog({
      action: "plan.update",
      entityType: "plan",
      entityId: updated.id,
      actorType: "user",
      actorUserId: session.user.id,
      changes: payload,
    });

    return NextResponse.json({ plan: updated });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Invalid payload",
        details: error instanceof z.ZodError ? error.flatten() : undefined,
      },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { planId: string } },
) {
  const session = await getAuthSession();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await prisma.plan.delete({ where: { id: params.planId } });

  await writeAuditLog({
    action: "plan.delete",
    entityType: "plan",
    entityId: params.planId,
    actorType: "user",
    actorUserId: session.user.id,
  });

  return NextResponse.json({ success: true });
}
