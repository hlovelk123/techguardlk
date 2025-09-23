import { OrderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getAuthSession();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const statusParam = request.nextUrl.searchParams.get("status") ?? undefined;
  const status = statusParam && Object.values(OrderStatus).includes(statusParam as OrderStatus)
    ? (statusParam as OrderStatus)
    : undefined;

  const orders = await prisma.order.findMany({
    where: status ? { status } : undefined,
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

  return NextResponse.json({ orders });
}
