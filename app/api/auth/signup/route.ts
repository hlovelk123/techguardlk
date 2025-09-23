import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendEmail } from "@/lib/email";
import { emailVerificationTemplate } from "@/lib/email-templates";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(80).optional(),
});

export async function POST(request: NextRequest) {
  const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = rateLimit(`signup:${ip}`, 5, 60 * 60 * 1000);

  if (!limit.success) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  try {
    const payload = signupSchema.parse(await request.json());

    const existing = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });

    if (existing) {
      return NextResponse.json({ message: "Email already registered." }, { status: 409 });
    }

    const hashedPassword = await hash(payload.password, 12);

    const user = await prisma.user.create({
      data: {
        email: payload.email.toLowerCase(),
        name: payload.name,
        hashedPassword,
        role: "customer",
      },
    });

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires,
      },
    });

    if (env.EMAIL_FROM) {
      const baseUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const verifyUrl = `${baseUrl}/auth/verify?token=${token}&email=${encodeURIComponent(user.email)}`;
      void sendEmail({
        to: user.email,
        subject: "Verify your TechGuard account",
        html: emailVerificationTemplate({ verifyUrl }),
      }).catch((error) => console.error("Failed to send verification email", error));
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Invalid payload",
        details: error instanceof z.ZodError ? error.flatten() : undefined,
      },
      { status: 400 },
    );
  }
}
