import { ProvidersManager } from "@/components/admin/providers-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function AdminProvidersPage() {
  await requireAdmin();
  const providers = await prisma.provider.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Providers</CardTitle>
      </CardHeader>
      <CardContent>
        <ProvidersManager providers={providers} />
      </CardContent>
    </Card>
  );
}
