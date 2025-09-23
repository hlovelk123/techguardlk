import nodemailer from "nodemailer";
import { Resend } from "resend";

import { env } from "@/lib/env";

const resendClient = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const transporter = env.EMAIL_FROM
  ? nodemailer.createTransport({
      host: env.NODE_ENV === "development" ? "localhost" : "smtp.resend.com",
      port: env.NODE_ENV === "development" ? 1025 : 587,
      secure: false,
    })
  : null;

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (resendClient && env.EMAIL_FROM) {
    await resendClient.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    return;
  }

  if (transporter && env.EMAIL_FROM) {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    return;
  }

  if (env.NODE_ENV === "development") {
    console.info("[email]", { to, subject });
    return;
  }

  throw new Error("Email service not configured");
}
