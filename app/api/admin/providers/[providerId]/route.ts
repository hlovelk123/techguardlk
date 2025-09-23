import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { providerId: string } },
) {
  const session = await getAuthSession();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const provider = await prisma.provider.findUnique({ where: { id: params.providerId } });

  if (!provider) {
    return NextResponse.json({ message: "Provider not found" }, { status: 404 });
  }

  try {
    const payload = updateSchema.parse(await request.json());

    const updated = await prisma.provider.update({
      where: { id: provider.id },
      data: payload,
    });

    await writeAuditLog({
      action: "provider.update",
      entityType: "provider",
      entityId: updated.id,
      actorType: "user",
      actorUserId: session.user.id,
      changes: payload,
    });

    return NextResponse.json({ provider: updated });
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
  { params }: { params: { providerId: string } },
) {
  const session = await getAuthSession();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await prisma.provider.delete({ where: { id: params.providerId } });

  await writeAuditLog({
    action: "provider.delete",
    entityType: "provider",
    entityId: params.providerId,
    actorType: "user",
    actorUserId: session.user.id,
  });

  return NextResponse.json({ success: true });
}
