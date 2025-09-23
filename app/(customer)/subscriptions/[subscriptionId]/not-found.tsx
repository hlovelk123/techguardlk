import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SubscriptionNotFound() {
  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Subscription not found</CardTitle>
        <CardDescription>
          We couldn&apos;t locate that subscription in your account. It may have been canceled or moved.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/dashboard">Return to dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
