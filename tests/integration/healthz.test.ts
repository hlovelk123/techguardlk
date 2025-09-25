import { beforeEach, describe, expect, it, vi } from "vitest";

function createPrismaMock() {
  return {
    $queryRaw: vi.fn(),
  };
}

const prismaMock = vi.hoisted(() => createPrismaMock());

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { GET as healthz } from "@/app/api/healthz/route";
import { GET as readyz } from "@/app/api/readyz/route";

describe("health endpoints", () => {
  beforeEach(() => {
    prismaMock.$queryRaw.mockReset();
  });

  it("returns ok for /api/healthz", async () => {
    const response = await healthz();
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ status: "ok" });
  });

  it("returns ok for /api/readyz when database responds", async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ now: 1 }]);
    const response = await readyz();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("returns 503 when database call fails", async () => {
    prismaMock.$queryRaw.mockRejectedValueOnce(new Error("connection failed"));
    const response = await readyz();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "error", reason: "database_unreachable" });
  });
});
