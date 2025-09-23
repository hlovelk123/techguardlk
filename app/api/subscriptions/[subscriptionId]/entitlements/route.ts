import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const assignSchema = z.object({
  email: z.string().email(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { subscriptionId: string } },
) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      id: params.subscriptionId,
      userId: session.user.id,
    },
    include: {
      entitlements: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!subscription) {
    return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
  }

  return NextResponse.json({ entitlements: subscription.entitlements });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { subscriptionId: string } },
) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      id: params.subscriptionId,
      userId: session.user.id,
    },
  });

  if (!subscription) {
    return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
  }

  let body: z.infer<typeof assignSchema>;

  try {
    const json = await request.json();
    body = assignSchema.parse(json);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Invalid request payload",
        details: error instanceof z.ZodError ? error.flatten() : undefined,
      },
      { status: 400 },
    );
  }

  const normalizedEmail = body.email.toLowerCase();

  let entitlement;

  try {
    entitlement = await prisma.$transaction(async (tx) => {
      const availableSeat = await tx.entitlement.findFirst({
        where: {
          subscriptionId: subscription.id,
          status: "unassigned",
        },
        orderBy: { createdAt: "asc" },
      });

      if (!availableSeat) {
        throw new Error("NO_AVAILABLE_SEAT");
      }

      const updatedSeat = await tx.entitlement.update({
        where: { id: availableSeat.id },
        data: {
          status: "assigned",
          assigneeEmail: normalizedEmail,
        },
      });

      await writeAuditLog({
        action: "entitlement.assign",
        entityType: "entitlement",
        entityId: updatedSeat.id,
        actorType: "user",
        actorUserId: session.user.id,
        changes: {
          assigneeEmail: normalizedEmail,
        },
        client: tx,
      });

      return updatedSeat;
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NO_AVAILABLE_SEAT") {
      return NextResponse.json(
        { message: "All seats are currently assigned. Increase quantity to add more." },
        { status: 422 },
      );
    }

    throw error;
  }

  return NextResponse.json({ entitlement });
}
