import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_SHADOW_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.enum(["true", "false"]).optional(),
});

type Env = z.infer<typeof envSchema>;

const rawEnv: Partial<Env> = {
  NODE_ENV: process.env.NODE_ENV as Env["NODE_ENV"],
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_SHADOW_URL: process.env.DATABASE_SHADOW_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_SECURE: process.env.SMTP_SECURE,
};

const skipValidation =
  process.env.SKIP_ENV_VALIDATION === "true" || process.env.SKIP_ENV_VALIDATION === "1";

const parsedEnv = envSchema.safeParse(rawEnv);
const issueSummary = parsedEnv.success
  ? null
  : Object.entries(parsedEnv.error.flatten().fieldErrors)
      .map(([key, messages]) => `${key}: ${messages?.join(", ")}`)
      .join("; ");

if (!parsedEnv.success && !skipValidation) {
  throw new Error(`Invalid environment configuration: ${issueSummary}`);
}

const globalEnvState = globalThis as { __envValidationWarned?: boolean };

if (!parsedEnv.success && skipValidation && !globalEnvState.__envValidationWarned) {
  console.warn(
    `Skipping environment validation because SKIP_ENV_VALIDATION is set${issueSummary ? ` (${issueSummary})` : ""}.`,
  );
  globalEnvState.__envValidationWarned = true;
}

const fallbackEnv: Env = parsedEnv.success
  ? parsedEnv.data
  : ({
      NODE_ENV: rawEnv.NODE_ENV ?? "development",
      DATABASE_URL: rawEnv.DATABASE_URL ?? "",
      DATABASE_SHADOW_URL: rawEnv.DATABASE_SHADOW_URL,
      NEXTAUTH_SECRET: rawEnv.NEXTAUTH_SECRET ?? "",
      GOOGLE_CLIENT_ID: rawEnv.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: rawEnv.GOOGLE_CLIENT_SECRET,
      STRIPE_SECRET_KEY: rawEnv.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: rawEnv.STRIPE_WEBHOOK_SECRET,
      NEXT_PUBLIC_APP_URL: rawEnv.NEXT_PUBLIC_APP_URL,
      RESEND_API_KEY: rawEnv.RESEND_API_KEY,
      EMAIL_FROM: rawEnv.EMAIL_FROM,
      SMTP_HOST: rawEnv.SMTP_HOST,
      SMTP_PORT: rawEnv.SMTP_PORT,
      SMTP_USER: rawEnv.SMTP_USER,
      SMTP_PASS: rawEnv.SMTP_PASS,
      SMTP_SECURE: rawEnv.SMTP_SECURE,
    } as Env);

export const env: Env = fallbackEnv;

export function getRequiredEnv(name: keyof Env): string {
  const value = process.env[name as string] ?? env[name];
  if (!value || value.length === 0) {
    if (skipValidation) {
      return "__SKIP_ENV_VALIDATION__";
    }
    throw new Error(`Missing required environment variable: ${String(name)}`);
  }
  return value;
}
