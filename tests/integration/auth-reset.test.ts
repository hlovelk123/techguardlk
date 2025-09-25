import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitStore } from "@/lib/rate-limit";
import { createNextRequest } from "@/tests/utils/next-request";

function createPrismaMock() {
  return {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    verificationToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  };
}

const prismaMock = vi.hoisted(() => createPrismaMock());
const sendEmailMock = vi.hoisted(() => vi.fn(async () => undefined));
const hashMock = vi.hoisted(() => vi.fn(async (value: string, rounds?: number) => `hashed:${value}:${rounds ?? ""}`));
const compareMock = vi.hoisted(() => vi.fn(async (_value: string, _hashed: string) => true));
const authenticatorMock = vi.hoisted(() => ({
  generateSecret: vi.fn(() => "SECRET"),
  keyuri: vi.fn(() => "otpauth://totp/TechGuard"),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/email", () => ({ sendEmail: sendEmailMock }));
vi.mock("bcryptjs", () => ({
  hash: (value: string, rounds?: number) => hashMock(value, rounds),
  compare: (value: string, hashed: string) => compareMock(value, hashed),
}));
vi.mock("otplib", () => ({ authenticator: authenticatorMock }));

import { env } from "@/lib/env";

import { PATCH as resetPatch, POST as resetPost } from "@/app/api/auth/reset/route";

describe("/api/auth/reset", () => {
  beforeEach(() => {
    resetRateLimitStore();
    sendEmailMock.mockReset();
    hashMock.mockClear();
    compareMock.mockReset();
    compareMock.mockResolvedValue(true);
    prismaMock.user.findUnique.mockReset();
    prismaMock.user.update.mockReset();
    prismaMock.verificationToken.create.mockReset();
    prismaMock.verificationToken.findUnique.mockReset();
    prismaMock.verificationToken.delete.mockReset();
    prismaMock.$transaction.mockReset();
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => unknown) =>
      callback(prismaMock),
    );
    authenticatorMock.generateSecret.mockClear();
    authenticatorMock.keyuri.mockClear();
    env.EMAIL_FROM = "";
  });

  it("queues reset email when user exists", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "user-1", email: "user@example.com" });
    prismaMock.verificationToken.create.mockResolvedValueOnce(undefined);
    env.EMAIL_FROM = "noreply@example.com";

    const response = await resetPost(
      createNextRequest({
        method: "POST",
        body: { email: "user@example.com" },
        ip: "127.0.0.1",
      }),
    );

    expect(response.status).toBe(200);
    expect(prismaMock.verificationToken.create).toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalled();
  });

  it("ignores reset request for unknown emails", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const response = await resetPost(
      createNextRequest({
        method: "POST",
        body: { email: "unknown@example.com" },
        ip: "127.0.0.1",
      }),
    );

    expect(response.status).toBe(200);
    expect(prismaMock.verificationToken.create).not.toHaveBeenCalled();
  });

  it("rate limits excessive reset requests", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "user-1", email: "user@example.com" } as never);
    prismaMock.verificationToken.create.mockResolvedValue(undefined as never);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const interim = await resetPost(
        createNextRequest({ method: "POST", body: { email: "user@example.com" }, ip: "1.1.1.1" }),
      );
      expect(interim.status).toBe(200);
    }

    const blocked = await resetPost(
      createNextRequest({ method: "POST", body: { email: "user@example.com" }, ip: "1.1.1.1" }),
    );

    expect(blocked.status).toBe(429);
  });

  it("updates password when token valid", async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValueOnce({
      token: "tok-1234567890",
      identifier: "reset:user@example.com",
      expires: new Date(Date.now() + 1_000),
    });

    const response = await resetPatch(
      createNextRequest({
        method: "PATCH",
        body: { token: "tok-1234567890", password: "NewPass123" },
      }),
    );

    expect(response.status).toBe(200);
    expect(hashMock).toHaveBeenCalledWith("NewPass123", 12);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      data: { hashedPassword: expect.stringContaining("hashed:") },
    });
    expect(prismaMock.verificationToken.delete).toHaveBeenCalledWith({
      where: { token: "tok-1234567890" },
    });
  });

  it("rejects invalid token", async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValueOnce(null);

    const response = await resetPatch(
      createNextRequest({
        method: "PATCH",
        body: { token: "missing", password: "NewPass123" },
      }),
    );

    expect(response.status).toBe(400);
  });

  it("rejects expired tokens", async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValueOnce({
      token: "tok-1234567890",
      identifier: "reset:user@example.com",
      expires: new Date(Date.now() - 1_000),
    });

    const response = await resetPatch(
      createNextRequest({
        method: "PATCH",
        body: { token: "tok-1234567890", password: "NewPass123" },
      }),
    );

    expect(response.status).toBe(400);
  });

  it("rejects tokens with unexpected identifiers", async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValueOnce({
      token: "tok-1234567890",
      identifier: "verify:user@example.com",
      expires: new Date(Date.now() + 1_000),
    });

    const response = await resetPatch(
      createNextRequest({
        method: "PATCH",
        body: { token: "tok-1234567890", password: "NewPass123" },
      }),
    );

    expect(response.status).toBe(400);
  });
});
