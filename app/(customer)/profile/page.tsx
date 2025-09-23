import { ProfileSettings } from "@/components/profile/profile-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await getAuthSession();

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your account details and security preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileSettings
            name={user.name}
            email={user.email}
            twoFactorEnabled={user.twoFactorEnabled}
          />
        </CardContent>
      </Card>
    </div>
  );
}
