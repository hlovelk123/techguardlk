import "dotenv/config";

import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const providers = [
  {
    name: "MusicPlus",
    plans: [
      {
        name: "MusicPlus Solo",
        description: "Single seat access to premium music streaming without ads.",
        interval: "month" as const,
        priceCents: 9900,
        seatCapacityPerPurchase: 1,
      },
      {
        name: "MusicPlus Family",
        description: "Family bundle with up to five listeners and parental controls.",
        interval: "month" as const,
        priceCents: 19900,
        seatCapacityPerPurchase: 5,
      },
    ],
  },
  {
    name: "StreamMax",
    plans: [
      {
        name: "StreamMax Essentials",
        description: "HD streaming with two simultaneous devices and curated channels.",
        interval: "month" as const,
        priceCents: 15900,
        seatCapacityPerPurchase: 2,
      },
      {
        name: "StreamMax Premier",
        description: "4K streaming, premium sports add-ons, and five device seats.",
        interval: "month" as const,
        priceCents: 25900,
        seatCapacityPerPurchase: 5,
      },
    ],
  },
  {
    name: "NewsPro",
    plans: [
      {
        name: "NewsPro Insider",
        description: "Daily briefings, investigative reports, and analyst Q&As.",
        interval: "month" as const,
        priceCents: 12900,
        seatCapacityPerPurchase: 3,
      },
      {
        name: "NewsPro Enterprise",
        description: "Company-wide access with compliance archives and alerts.",
        interval: "year" as const,
        priceCents: 99900,
        seatCapacityPerPurchase: 25,
      },
    ],
  },
];

async function main() {
  const adminEmail = "admin@example.com";
  const adminPassword = "Admin123!";

  const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "TechGuard Admin",
      hashedPassword: hashedAdminPassword,
      role: Role.admin,
      emailVerified: new Date(),
      deletedAt: null,
    },
    create: {
      email: adminEmail,
      name: "TechGuard Admin",
      hashedPassword: hashedAdminPassword,
      role: Role.admin,
      emailVerified: new Date(),
    },
  });

  console.info(`Seed: ensured admin user ${adminUser.email}`);

  for (const provider of providers) {
    const dbProvider = await prisma.provider.upsert({
      where: { name: provider.name },
      update: { isActive: true },
      create: {
        name: provider.name,
        isActive: true,
      },
    });

    console.info(`Seed: provider ${dbProvider.name}`);

    for (const plan of provider.plans) {
      await prisma.plan.upsert({
        where: {
          providerId_name: {
            providerId: dbProvider.id,
            name: plan.name,
          },
        },
        update: {
          description: plan.description,
          interval: plan.interval,
          priceCents: plan.priceCents,
          seatCapacityPerPurchase: plan.seatCapacityPerPurchase,
          isActive: true,
        },
        create: {
          providerId: dbProvider.id,
          name: plan.name,
          description: plan.description,
          interval: plan.interval,
          priceCents: plan.priceCents,
          seatCapacityPerPurchase: plan.seatCapacityPerPurchase,
        },
      });

      console.info(`Seed: plan ${plan.name}`);
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed error", error);
    await prisma.$disconnect();
    process.exit(1);
  });
