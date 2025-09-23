export function signupWelcomeTemplate({ name }: { name?: string }) {
  return `
    <h1>Welcome to TechGuard</h1>
    <p>Hi ${name ?? "there"},</p>
    <p>Thanks for creating a TechGuard account. You can now browse plans, provision seats, and manage billing from your dashboard.</p>
  `;
}

export function orderReceiptTemplate({
  planName,
  amount,
}: {
  planName: string;
  amount: string;
}) {
  return `
    <h1>Thanks for your purchase</h1>
    <p>You have successfully purchased <strong>${planName}</strong>.</p>
    <p>Total charged: <strong>${amount}</strong>.</p>
    <p>You can manage your subscription from your TechGuard dashboard.</p>
  `;
}

export function emailVerificationTemplate({ verifyUrl }: { verifyUrl: string }) {
  return `
    <h1>Verify your email</h1>
    <p>Thanks for joining TechGuard. Confirm your email address by clicking the button below.</p>
    <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#1d4ed8;color:#fff;text-decoration:none;font-weight:600">Verify email</a></p>
  `;
}

export function passwordResetTemplate({ resetUrl }: { resetUrl: string }) {
  return `
    <h1>Reset your password</h1>
    <p>We received a request to reset your TechGuard password. Use the button below to set a new password.</p>
    <p><a href="${resetUrl}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#1d4ed8;color:#fff;text-decoration:none;font-weight:600">Reset password</a></p>
    <p>If you did not request this change, you can safely ignore this email.</p>
  `;
}
