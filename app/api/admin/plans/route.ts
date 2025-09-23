import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  providerId: z.string().cuid(),
  name: z.string().min(3),
  description: z.string().min(10),
  interval: z.enum(["month", "year"]),
  priceCents: z.number().int().min(100),
  currency: z.string().length(3).default("usd"),
  seatCapacityPerPurchase: z.number().int().min(1).max(100),
  isActive: z.boolean().optional().default(true),
  stripePriceId: z.string().optional(),
  stripeProductId: z.string().optional(),
});

export async function GET() {
  const session = await getAuthSession();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const plans = await prisma.plan.findMany({
    include: {
      provider: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ plans });
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = createSchema.parse(await request.json());

    const plan = await prisma.plan.create({
      data: payload,
      include: {
        provider: true,
      },
    });

    await writeAuditLog({
      action: "plan.create",
      entityType: "plan",
      entityId: plan.id,
      actorType: "user",
      actorUserId: session.user.id,
      changes: payload,
    });

    return NextResponse.json({ plan }, { status: 201 });
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
