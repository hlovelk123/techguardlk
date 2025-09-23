import { compare, hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { authenticator } from "otplib";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
  twoFactorEnabled: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  let payload: z.infer<typeof updateSchema>;

  try {
    payload = updateSchema.parse(await request.json());
  } catch (error) {
    return NextResponse.json(
      {
        message: "Invalid payload",
        details: error instanceof z.ZodError ? error.flatten() : undefined,
      },
      { status: 400 },
    );
  }

  const updates: Record<string, unknown> = {};
  let otpUri: string | undefined;

  if (payload.name && payload.name !== user.name) {
    updates.name = payload.name;
  }

  if (payload.newPassword) {
    if (!payload.currentPassword || !user.hashedPassword) {
      return NextResponse.json({ message: "Current password required" }, { status: 400 });
    }

    const valid = await compare(payload.currentPassword, user.hashedPassword);
    if (!valid) {
      return NextResponse.json({ message: "Current password invalid" }, { status: 400 });
    }

    updates.hashedPassword = await hash(payload.newPassword, 12);
  }

  if (payload.twoFactorEnabled !== undefined) {
    if (payload.twoFactorEnabled) {
      const secret = authenticator.generateSecret();
      otpUri = authenticator.keyuri(user.email, "TechGuard", secret);
      updates.twoFactorEnabled = true;
      updates.twoFactorSecret = secret;
    } else {
      updates.twoFactorEnabled = false;
      updates.twoFactorSecret = null;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: true });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: updates,
  });

  return NextResponse.json({ success: true, otpUri });
}
