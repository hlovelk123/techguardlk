import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true, provider: { isActive: true } },
    include: {
      provider: true,
    },
    orderBy: [{ priceCents: "asc" }],
  });

  return NextResponse.json({ plans });
}
