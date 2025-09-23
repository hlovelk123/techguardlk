import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendEmail } from "@/lib/email";
import { passwordResetTemplate } from "@/lib/email-templates";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const requestSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = rateLimit(`reset:${ip}`, 5, 60 * 60 * 1000);

  if (!limit.success) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  try {
    const payload = requestSchema.parse(await request.json());
    const email = payload.email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.verificationToken.create({
        data: {
          identifier: `reset:${email}`,
          token,
          expires,
        },
      });

      if (env.EMAIL_FROM) {
        const baseUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        const resetUrl = `${baseUrl}/auth/reset?token=${token}`;
        void sendEmail({
          to: email,
          subject: "Reset your TechGuard password",
          html: passwordResetTemplate({ resetUrl }),
        }).catch((error) => console.error("Failed to send reset email", error));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Invalid request",
        details: error instanceof z.ZodError ? error.flatten() : undefined,
      },
      { status: 400 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = resetSchema.parse(await request.json());

    const verification = await prisma.verificationToken.findUnique({
      where: { token: payload.token },
    });

    if (!verification || verification.expires < new Date()) {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 });
    }

    if (!verification.identifier.startsWith("reset:")) {
      return NextResponse.json({ message: "Invalid token" }, { status: 400 });
    }

    const email = verification.identifier.replace("reset:", "");

    const hashedPassword = await hash(payload.password, 12);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { email },
        data: {
          hashedPassword,
        },
      });

      await tx.verificationToken.delete({ where: { token: payload.token } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Invalid request",
        details: error instanceof z.ZodError ? error.flatten() : undefined,
      },
      { status: 400 },
    );
  }
}
