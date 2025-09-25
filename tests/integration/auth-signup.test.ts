import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitStore } from "@/lib/rate-limit";
import { createNextRequest } from "@/tests/utils/next-request";

function createPrismaMock() {
  return {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    verificationToken: {
      create: vi.fn(),
    },
  };
}

const prismaMock = vi.hoisted(() => createPrismaMock());
const sendEmailMock = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/email", () => ({ sendEmail: sendEmailMock }));
vi.mock("bcryptjs", () => ({
  hash: vi.fn(async (value: string) => `hashed:${value}`),
}));

import { env } from "@/lib/env";

import { POST as signup } from "@/app/api/auth/signup/route";

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    resetRateLimitStore();
    sendEmailMock.mockReset();
    prismaMock.user.findUnique.mockReset();
    prismaMock.user.create.mockReset();
    prismaMock.verificationToken.create.mockReset();
    env.EMAIL_FROM = "";
  });

  it("creates a new user and verification token", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.create.mockResolvedValueOnce({
      id: "user-1",
      email: "new@example.com",
    });
    prismaMock.verificationToken.create.mockResolvedValueOnce(undefined);
    env.EMAIL_FROM = "noreply@example.com";

    const request = createNextRequest({
      method: "POST",
      body: {
        name: "New User",
        email: "new@example.com",
        password: "Password123",
      },
      ip: "127.0.0.1",
    });

    const response = await signup(request);

    expect(response.status).toBe(201);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: "new@example.com" },
    });
    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(prismaMock.verificationToken.create).toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalled();
  });

  it("rejects duplicate emails", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "existing" });

    const request = createNextRequest({
      method: "POST",
      body: {
        name: "Existing",
        email: "existing@example.com",
        password: "Password123",
      },
      ip: "127.0.0.1",
    });

    const response = await signup(request);

    expect(response.status).toBe(409);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("validates payload and returns 400", async () => {
    const request = createNextRequest({
      method: "POST",
      body: { email: "invalid" },
      ip: "127.0.0.1",
    });

    const response = await signup(request);

    expect(response.status).toBe(400);
  });

  it("rate limits excessive signup attempts", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null as never);
    prismaMock.user.create.mockResolvedValue({ id: "user-1", email: "user@example.com" } as never);
    prismaMock.verificationToken.create.mockResolvedValue(undefined as never);

    const request = () =>
      signup(
        createNextRequest({
          method: "POST",
          body: { name: "User", email: "user@example.com", password: "Password123" },
          ip: "9.9.9.9",
        }),
      );

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const interim = await request();
      expect(interim.status).toBe(201);
    }

    const limited = await request();
    expect(limited.status).toBe(429);
  });
});
