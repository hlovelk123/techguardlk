import { NextRequest, NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getAuthSession();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const actor = request.nextUrl.searchParams.get("actor");
  const action = request.nextUrl.searchParams.get("action");

  const logs = await prisma.auditLog.findMany({
    where: {
      actorUserId: actor ?? undefined,
      action: action ?? undefined,
    },
    include: {
      actorUser: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ logs });
}
