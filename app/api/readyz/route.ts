import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw(Prisma.sql`SELECT 1`);
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Readiness check failed", error);
    return NextResponse.json({ status: "error", reason: "database_unreachable" }, { status: 503 });
  }
}
