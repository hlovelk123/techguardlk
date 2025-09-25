import { describe, expect, it, vi } from "vitest";

const createMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: { auditLog: { create: createMock } } }));

import { writeAuditLog } from "@/lib/audit";

describe("writeAuditLog", () => {
  it("persists audit entry with provided data", async () => {
    await writeAuditLog({
      action: "test.action",
      entityType: "entity",
      entityId: "123",
      actorUserId: "user-1",
      actorType: "user",
      changes: { foo: "bar" },
    });

    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "test.action",
        actorType: "user",
        changes: { foo: "bar" },
      }),
    });
  });
});
