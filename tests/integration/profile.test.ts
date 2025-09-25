import { beforeEach, describe, expect, it, vi } from "vitest";

import { createNextRequest } from "@/tests/utils/next-request";

function createPrismaMock() {
  return {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
}

const prismaMock = vi.hoisted(() => createPrismaMock());
const getAuthSessionMock = vi.hoisted(() => vi.fn());
const hashMock = vi.hoisted(() => vi.fn(async (value: string, rounds?: number) => `hashed:${value}:${rounds ?? ""}`));
const compareMock = vi.hoisted(() => vi.fn(async (_value: string, _hashed: string) => true));
const authenticatorMock = vi.hoisted(() => ({
  generateSecret: vi.fn(() => "SECRET"),
  keyuri: vi.fn(() => "otpauth://totp/TechGuard"),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ getAuthSession: getAuthSessionMock }));
vi.mock("bcryptjs", () => ({
  hash: (value: string, rounds?: number) => hashMock(value, rounds),
  compare: (value: string, hashed: string) => compareMock(value, hashed),
}));
vi.mock("otplib", () => ({ authenticator: authenticatorMock }));

import { PATCH as profilePatch } from "@/app/api/profile/route";
import { GET as exportGet } from "@/app/api/profile/export/route";
import { POST as deletePost } from "@/app/api/profile/delete/route";

describe("profile endpoints", () => {
  beforeEach(() => {
    getAuthSessionMock.mockReset();
    hashMock.mockReset();
    hashMock.mockImplementation(async (value: string) => `hashed:${value}`);
    compareMock.mockReset();
    compareMock.mockResolvedValue(true);
    prismaMock.user.findUnique.mockReset();
    prismaMock.user.update.mockReset();
    authenticatorMock.generateSecret.mockClear();
    authenticatorMock.keyuri.mockClear();
  });

  it("requires authentication", async () => {
    getAuthSessionMock.mockResolvedValueOnce(null);
    const response = await profilePatch(createNextRequest({ method: "PATCH" }));
    expect(response.status).toBe(401);
  });

  it("updates profile details and enables two-factor", async () => {
    getAuthSessionMock.mockResolvedValueOnce({ user: { id: "user-1", email: "user@example.com" } });
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "user-1",
      name: "Old",
      email: "user@example.com",
      hashedPassword: "hashed:old",
    });

    const response = await profilePatch(
      createNextRequest({
        method: "PATCH",
        body: {
          name: "New Name",
          currentPassword: "OldPass123",
          newPassword: "NewPass123",
          twoFactorEnabled: true,
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(compareMock).toHaveBeenCalledWith("OldPass123", "hashed:old");
    expect(hashMock).toHaveBeenCalledWith("NewPass123", expect.any(Number));
    expect(authenticatorMock.generateSecret).toHaveBeenCalled();
    expect(authenticatorMock.keyuri).toHaveBeenCalled();
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: expect.objectContaining({
        name: "New Name",
        twoFactorEnabled: true,
        twoFactorSecret: "SECRET",
      }),
    });
    const json = await response.json();
    expect(json.otpUri).toBe("otpauth://totp/TechGuard");
  });

  it("rejects password change when current password incorrect", async () => {
    getAuthSessionMock.mockResolvedValueOnce({ user: { id: "user-1", email: "user@example.com" } });
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "user-1",
      name: "Old",
      email: "user@example.com",
      hashedPassword: "hashed:old",
    });
    compareMock.mockResolvedValueOnce(false);

    const response = await profilePatch(
      createNextRequest({
        method: "PATCH",
        body: {
          currentPassword: "wrong",
          newPassword: "NewPass123",
        },
      }),
    );

    expect(response.status).toBe(400);
  });

  it("disables two-factor authentication", async () => {
    getAuthSessionMock.mockResolvedValueOnce({ user: { id: "user-1", email: "user@example.com" } });
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "user-1",
      name: "Old",
      email: "user@example.com",
      hashedPassword: "hashed:old",
    });

    const response = await profilePatch(
      createNextRequest({
        method: "PATCH",
        body: {
          twoFactorEnabled: false,
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: expect.objectContaining({ twoFactorEnabled: false, twoFactorSecret: null }),
    });
  });

  it("exports profile data", async () => {
    getAuthSessionMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "user-1",
      name: "Sample",
      email: "user@example.com",
      createdAt: new Date(),
      subscriptions: [],
      orders: [],
      entitlements: [],
    });

    const response = await exportGet();

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.user.email).toBe("user@example.com");
  });

  it("requires authentication for export", async () => {
    getAuthSessionMock.mockResolvedValueOnce(null);
    const response = await exportGet();
    expect(response.status).toBe(401);
  });

  it("returns 404 when exporting missing user", async () => {
    getAuthSessionMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    const response = await exportGet();
    expect(response.status).toBe(404);
  });

  it("soft deletes profile", async () => {
    getAuthSessionMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const response = await deletePost();

    expect(response.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: expect.objectContaining({ name: "Deleted User" }),
    });
  });

  it("requires authentication to delete", async () => {
    getAuthSessionMock.mockResolvedValueOnce(null);
    const response = await deletePost();
    expect(response.status).toBe(401);
  });
});
