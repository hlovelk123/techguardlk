import { PlansManager } from "@/components/admin/plans-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function AdminPlansPage() {
  await requireAdmin();
  const plans = await prisma.plan.findMany({
    include: {
      provider: true,
    },
    orderBy: { createdAt: "desc" },
  });
  const providers = await prisma.provider.findMany({ where: { isActive: true } });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plans</CardTitle>
      </CardHeader>
      <CardContent>
        <PlansManager plans={plans} providers={providers} />
      </CardContent>
    </Card>
  );
}
