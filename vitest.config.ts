import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/{unit,integration}/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://localhost:5432/techguard_test?schema=public",
      NEXTAUTH_SECRET: "test-secret",
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_WEBHOOK_SECRET: "whsec_test_123",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      SKIP_ENV_VALIDATION: "true",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: [
        "lib/**/*.ts",
        "app/api/auth/**/*.ts",
        "app/api/profile/**/*.ts",
        "app/api/checkout/route.ts",
        "app/api/healthz/route.ts",
        "app/api/readyz/route.ts",
      ],
      exclude: [
        "**/node_modules/**",
        "**/tests/**",
        "lib/auth.ts",
        "lib/email.ts",
        "lib/prisma.ts",
        "lib/stripe.ts",
        "lib/stripe/**/*.ts",
        "lib/env.ts",
        "app/api/auth/\\[...nextauth\\]/route.ts",
        "app/api/auth/verify/route.ts",
      ],
      thresholds: {
        lines: 85,
        statements: 85,
        functions: 85,
        branches: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
});
