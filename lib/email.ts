import nodemailer from "nodemailer";
import { Resend } from "resend";

import { env } from "@/lib/env";

const resendClient = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const smtpHost = env.SMTP_HOST ?? (env.NODE_ENV === "development" ? "localhost" : undefined);
const smtpPort = env.SMTP_PORT ? Number.parseInt(env.SMTP_PORT, 10) : env.NODE_ENV === "development" ? 1025 : undefined;
const smtpSecure = env.SMTP_SECURE ? env.SMTP_SECURE === "true" : false;

const transporter = env.EMAIL_FROM && smtpHost && smtpPort
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASS,
            }
          : undefined,
    })
  : env.EMAIL_FROM && env.NODE_ENV !== "development"
    ? nodemailer.createTransport({
        host: "smtp.resend.com",
        port: 587,
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
