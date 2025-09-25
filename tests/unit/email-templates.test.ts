import { describe, expect, it } from "vitest";

import {
  emailVerificationTemplate,
  orderReceiptTemplate,
  passwordResetTemplate,
  signupWelcomeTemplate,
} from "@/lib/email-templates";

describe("email templates", () => {
  it("renders signup welcome", () => {
    const html = signupWelcomeTemplate({ name: "Alex" });
    expect(html).toContain("Welcome to TechGuard");
    expect(html).toContain("Alex");
  });

  it("renders order receipt", () => {
    const html = orderReceiptTemplate({ planName: "Pro", amount: "$10.00" });
    expect(html).toContain("Pro");
    expect(html).toContain("$10.00");
  });

  it("renders verification link", () => {
    const html = emailVerificationTemplate({ verifyUrl: "https://example.com/verify" });
    expect(html).toContain("https://example.com/verify");
  });

  it("renders password reset", () => {
    const html = passwordResetTemplate({ resetUrl: "https://example.com/reset" });
    expect(html).toContain("https://example.com/reset");
  });
});
