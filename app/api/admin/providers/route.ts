import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const providerSchema = z.object({
  name: z.string().min(2),
  isActive: z.boolean().optional().default(true),
});

export async function GET() {
  const session = await getAuthSession();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const providers = await prisma.provider.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ providers });
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = providerSchema.parse(await request.json());

    const provider = await prisma.provider.create({
      data: {
        name: payload.name,
        isActive: payload.isActive,
      },
    });

    await writeAuditLog({
      action: "provider.create",
      entityType: "provider",
      entityId: provider.id,
      actorType: "user",
      actorUserId: session.user.id,
      changes: { name: provider.name, isActive: provider.isActive },
    });

    return NextResponse.json({ provider }, { status: 201 });
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
