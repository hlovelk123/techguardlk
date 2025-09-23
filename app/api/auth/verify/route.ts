import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { token, email } = await request.json();

  if (!token || !email) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const verification = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verification || verification.identifier !== email || verification.expires < new Date()) {
    return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { email },
      data: {
        emailVerified: new Date(),
      },
    });

    await tx.verificationToken.delete({ where: { token } });
  });

  return NextResponse.json({ success: true });
}
