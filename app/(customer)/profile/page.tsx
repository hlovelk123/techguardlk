import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthSession } from "@/lib/auth";

export default async function ProfilePage() {
  const session = await getAuthSession();

  if (!session) {
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
          <Alert>
            <AlertDescription>
              Profile editing and two-factor authentication management will be available in a future update.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
