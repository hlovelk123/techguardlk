import { beforeEach, describe, expect, it, vi } from "vitest";

class RedirectCalled extends Error {
  constructor(readonly to: string) {
    super(`Redirect to ${to}`);
  }
}

const redirectSpy = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new RedirectCalled(url);
  }),
);
const getAuthSessionMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: redirectSpy,
}));

vi.mock("@/lib/auth", () => ({
  getAuthSession: getAuthSessionMock,
}));

import { requireAdmin, requireCustomer, requireUser } from "@/lib/auth-helpers";

beforeEach(() => {
  redirectSpy.mockReset();
  getAuthSessionMock.mockReset();
});

describe("requireUser", () => {
  it("returns session when present", async () => {
    const session = { user: { id: "1", role: "customer" } };
    getAuthSessionMock.mockResolvedValueOnce(session);
    await expect(requireUser()).resolves.toEqual(session);
    expect(redirectSpy).not.toHaveBeenCalled();
  });

  it("redirects when missing", async () => {
    getAuthSessionMock.mockResolvedValueOnce(null);
    await expect(requireUser()).rejects.toBeInstanceOf(RedirectCalled);
    expect(redirectSpy).toHaveBeenCalledWith("/auth/signin");
  });
});

describe("requireCustomer", () => {
  it("allows customer role", async () => {
    const session = { user: { id: "1", role: "customer" } };
    getAuthSessionMock.mockResolvedValueOnce(session);
    await expect(requireCustomer()).resolves.toEqual(session);
  });

  it("redirects unauthenticated to signin with callback", async () => {
    getAuthSessionMock.mockResolvedValueOnce(null);
    await expect(requireCustomer()).rejects.toBeInstanceOf(RedirectCalled);
    expect(redirectSpy).toHaveBeenCalledWith("/auth/signin?callbackUrl=/dashboard");
  });

  it("redirects admins to /admin", async () => {
    const session = { user: { id: "1", role: "admin" } };
    getAuthSessionMock.mockResolvedValueOnce(session);
    await expect(requireCustomer()).rejects.toBeInstanceOf(RedirectCalled);
    expect(redirectSpy).toHaveBeenCalledWith("/admin");
  });
});

describe("requireAdmin", () => {
  it("allows admin role", async () => {
    const session = { user: { id: "1", role: "admin" } };
    getAuthSessionMock.mockResolvedValueOnce(session);
    await expect(requireAdmin()).resolves.toEqual(session);
  });

  it("redirects unauthenticated to admin signin", async () => {
    getAuthSessionMock.mockResolvedValueOnce(null);
    await expect(requireAdmin()).rejects.toBeInstanceOf(RedirectCalled);
    expect(redirectSpy).toHaveBeenCalledWith("/auth/signin?callbackUrl=/admin");
  });

  it("redirects non-admins to /dashboard", async () => {
    const session = { user: { id: "1", role: "customer" } };
    getAuthSessionMock.mockResolvedValueOnce(session);
    await expect(requireAdmin()).rejects.toBeInstanceOf(RedirectCalled);
    expect(redirectSpy).toHaveBeenCalledWith("/dashboard");
  });
});
