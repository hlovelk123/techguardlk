import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient;

interface AuditLogInput {
  action: string;
  entityType: string;
  entityId: string;
  actorUserId?: string | null;
  actorType?: "user" | "system";
  changes?: Prisma.InputJsonValue;
  client?: PrismaClientOrTx;
}

export async function writeAuditLog({
  action,
  entityType,
  entityId,
  actorUserId = null,
  actorType = "system",
  changes = {},
  client = prisma,
}: AuditLogInput) {
  await client.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      actorUserId,
      actorType,
      changes,
    },
  });
}
