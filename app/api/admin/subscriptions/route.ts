import { NextRequest, NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getAuthSession();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const search = request.nextUrl.searchParams.get("q")?.toLowerCase();

  const subscriptions = await prisma.subscription.findMany({
    where: search
      ? {
          OR: [
            { id: { equals: search } },
            { user: { email: { contains: search, mode: "insensitive" } } },
            { plan: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: {
      user: true,
      plan: {
        include: {
          provider: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ subscriptions });
}
