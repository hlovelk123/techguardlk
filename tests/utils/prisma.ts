import { vi } from "vitest";

type MockFn = ReturnType<typeof vi.fn>;

type NestedMockRecord = Record<string, MockFn>;

export interface PrismaMock {
  user: NestedMockRecord;
  verificationToken: NestedMockRecord;
  subscription: NestedMockRecord;
  entitlement: NestedMockRecord;
  order: NestedMockRecord;
  webhookEvent: NestedMockRecord;
  auditLog: NestedMockRecord;
  provider: NestedMockRecord;
  plan: NestedMockRecord;
  $transaction: MockFn;
  $queryRaw: MockFn;
}

function createNestedMock(methods: string[]): NestedMockRecord {
  return Object.fromEntries(methods.map((method) => [method, vi.fn()])) as NestedMockRecord;
}

function buildPrismaMock(): PrismaMock {
  const mock = {
    user: createNestedMock(["findUnique", "create", "update", "findMany", "upsert"]),
    verificationToken: createNestedMock(["create", "findUnique", "delete"]),
    subscription: createNestedMock([
      "findMany",
      "findFirst",
      "findUnique",
      "create",
      "update",
      "count",
      "upsert",
    ]),
    entitlement: createNestedMock([
      "findMany",
      "createMany",
      "updateMany",
      "findFirst",
      "update",
    ]),
    order: createNestedMock(["create", "update", "findMany", "count", "findFirst"]),
    webhookEvent: createNestedMock(["findUnique", "create", "update"]),
    auditLog: createNestedMock(["create"]),
    provider: createNestedMock(["findMany", "findUnique", "create", "update", "delete"]),
    plan: createNestedMock([
      "findMany",
      "findUnique",
      "findFirst",
      "create",
      "update",
      "delete",
      "upsert",
    ]),
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
  } satisfies PrismaMock;

  mock.$transaction.mockImplementation(async (callback: (tx: PrismaMock) => unknown) => callback(mock));

  return mock;
}

export const prismaMock = vi.hoisted(() => buildPrismaMock());

export function resetPrismaMock() {
  const resetNested = (record: NestedMockRecord) => {
    Object.values(record).forEach((fn) => fn.mockReset());
  };

  resetNested(prismaMock.user);
  resetNested(prismaMock.verificationToken);
  resetNested(prismaMock.subscription);
  resetNested(prismaMock.entitlement);
  resetNested(prismaMock.order);
  resetNested(prismaMock.webhookEvent);
  resetNested(prismaMock.auditLog);
  resetNested(prismaMock.provider);
  resetNested(prismaMock.plan);
  prismaMock.$transaction.mockReset();
  prismaMock.$transaction.mockImplementation(async (callback: (tx: PrismaMock) => unknown) => callback(prismaMock));
  prismaMock.$queryRaw.mockReset();
}
