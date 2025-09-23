import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: session.user.id },
    include: {
      plan: {
        include: {
          provider: true,
        },
      },
      entitlements: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ subscriptions });
}
