import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitStore } from "@/lib/rate-limit";
import { createNextRequest } from "@/tests/utils/next-request";

function createPrismaMock() {
  return {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    plan: {
      findFirst: vi.fn(),
    },
    order: {
      create: vi.fn(),
    },
  };
}

const prismaMock = vi.hoisted(() => createPrismaMock());
const getAuthSessionMock = vi.hoisted(() => vi.fn());
const ensureStripeConfiguredMock = vi.hoisted(() => vi.fn());
const stripeClientMock = vi.hoisted(() => ({
  customers: {
    create: vi.fn(),
  },
  checkout: {
    sessions: {
      create: vi.fn(),
    },
  },
}));
const sendEmailMock = vi.hoisted(() => vi.fn());
const writeAuditLogMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ getAuthSession: getAuthSessionMock }));
vi.mock("@/lib/stripe", () => ({
  ensureStripeConfigured: ensureStripeConfiguredMock,
  getStripeClient: () => stripeClientMock,
}));
vi.mock("@/lib/email", () => ({ sendEmail: sendEmailMock }));
vi.mock("@/lib/audit", () => ({ writeAuditLog: writeAuditLogMock }));

import { POST as checkoutPost } from "@/app/api/checkout/route";

describe("POST /api/checkout", () => {
  beforeEach(() => {
    resetRateLimitStore();
    getAuthSessionMock.mockReset();
    ensureStripeConfiguredMock.mockReset();
    sendEmailMock.mockReset();
    writeAuditLogMock.mockReset();
    prismaMock.user.findUnique.mockReset();
    prismaMock.user.update.mockReset();
    prismaMock.plan.findFirst.mockReset();
    prismaMock.order.create.mockReset();
    stripeClientMock.customers.create.mockReset();
    stripeClientMock.checkout.sessions.create.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    getAuthSessionMock.mockResolvedValueOnce(null);
    const response = await checkoutPost(createNextRequest({ method: "POST" }));
    expect(response.status).toBe(401);
  });

  it("returns 404 when plan not found", async () => {
    getAuthSessionMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "user-1", email: "user@example.com" });
    prismaMock.plan.findFirst.mockResolvedValueOnce(null);

    const response = await checkoutPost(
      createNextRequest({
        method: "POST",
        body: { planId: "clan000000000000000000001", quantity: 1 },
      }),
    );

    expect(response.status).toBe(404);
  });

  it("creates Stripe checkout session and order", async () => {
    getAuthSessionMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "user-1",
      email: "user@example.com",
      name: "User",
      stripeCustomerId: null,
    });
    prismaMock.plan.findFirst.mockResolvedValueOnce({
      id: "clan000000000000000000001",
      name: "Plan",
      priceCents: 1000,
      currency: "usd",
      stripePriceId: "price_123",
      provider: { name: "Provider" },
    });
    stripeClientMock.customers.create.mockResolvedValueOnce({ id: "cus_123" });
    stripeClientMock.checkout.sessions.create.mockResolvedValueOnce({ id: "cs_123", url: "https://stripe.test" });
    prismaMock.order.create.mockResolvedValueOnce({ id: "order_1" });

    const response = await checkoutPost(
      createNextRequest({
        method: "POST",
        body: { planId: "clan000000000000000000001", quantity: 2 },
        headers: { origin: "http://localhost:3000" },
      }),
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.url).toBe("https://stripe.test");
    expect(stripeClientMock.customers.create).toHaveBeenCalled();
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { stripeCustomerId: "cus_123" },
    });
    expect(stripeClientMock.checkout.sessions.create).toHaveBeenCalled();
    expect(prismaMock.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amountCents: 2000,
          planId: "clan000000000000000000001",
        }),
      }),
    );
    expect(writeAuditLogMock).toHaveBeenCalled();
  });

  it("reuses existing Stripe customer id", async () => {
    getAuthSessionMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "user-1",
      email: "user@example.com",
      name: "User",
      stripeCustomerId: "cus_existing",
    });
    prismaMock.plan.findFirst.mockResolvedValueOnce({
      id: "clan000000000000000000001",
      name: "Plan",
      priceCents: 1000,
      currency: "usd",
      stripePriceId: "price_123",
      provider: { name: "Provider" },
    });
    stripeClientMock.checkout.sessions.create.mockResolvedValueOnce({ id: "cs_123", url: "https://stripe.test" });
    prismaMock.order.create.mockResolvedValueOnce({ id: "order_1" });

    const response = await checkoutPost(
      createNextRequest({
        method: "POST",
        body: { planId: "clan000000000000000000001", quantity: 1 },
      }),
    );

    expect(response.status).toBe(200);
    expect(stripeClientMock.customers.create).not.toHaveBeenCalled();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("rate limits repeated checkout attempts from same source", async () => {
    getAuthSessionMock.mockResolvedValue({ user: { id: "user-1" } } as never);
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      name: "User",
      stripeCustomerId: "cus_existing",
    } as never);
    prismaMock.plan.findFirst.mockResolvedValue({
      id: "clan000000000000000000001",
      name: "Plan",
      priceCents: 1000,
      currency: "usd",
      stripePriceId: "price_123",
      provider: { name: "Provider" },
    } as never);
    stripeClientMock.checkout.sessions.create.mockResolvedValue({ id: "cs_123", url: "https://stripe.test" } as never);
    prismaMock.order.create.mockResolvedValue({ id: "order_1" } as never);

    const request = () =>
      checkoutPost(
        createNextRequest({
          method: "POST",
          body: { planId: "clan000000000000000000001", quantity: 1 },
          ip: "6.6.6.6",
        }),
      );

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const interim = await request();
      expect(interim.status).toBe(200);
    }

    const limited = await request();
    expect(limited.status).toBe(429);
  });

  it("returns 422 when plan missing Stripe price", async () => {
    getAuthSessionMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "user-1", email: "user@example.com" });
    prismaMock.plan.findFirst.mockResolvedValueOnce({
      id: "clan000000000000000000001",
      name: "Plan",
      priceCents: 1000,
      currency: "usd",
      stripePriceId: null,
      provider: { name: "Provider" },
    });

    const response = await checkoutPost(
      createNextRequest({
        method: "POST",
        body: { planId: "clan000000000000000000001", quantity: 1 },
      }),
    );

    expect(response.status).toBe(422);
  });

  it("bubbles configuration error when Stripe not configured", async () => {
    ensureStripeConfiguredMock.mockImplementationOnce(() => {
      throw new Error("Missing Stripe env");
    });
    getAuthSessionMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const response = await checkoutPost(
      createNextRequest({
        method: "POST",
        body: { planId: "clan000000000000000000001", quantity: 1 },
      }),
    );

    expect(response.status).toBe(500);
  });
});
