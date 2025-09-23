import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const anonymizedEmail = `${session.user.id}@deleted.techguard`;
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      email: anonymizedEmail,
      name: "Deleted User",
      hashedPassword: null,
      deletedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
