import { describe, expect, it, vi } from "vitest";

import { rateLimit, resetRateLimitStore } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests until the limit is reached", () => {
    resetRateLimitStore();
    const key = "test:ip";

    expect(rateLimit(key, 2, 1_000)).toEqual({ success: true });
    expect(rateLimit(key, 2, 1_000)).toEqual({ success: true });
    expect(rateLimit(key, 2, 1_000)).toEqual({ success: false, retryAfter: expect.any(Number) });
  });

  it("resets after the window expires", () => {
    resetRateLimitStore();
    vi.useFakeTimers({ now: 0 });

    const key = "window:test";
    expect(rateLimit(key, 1, 1_000)).toEqual({ success: true });
    expect(rateLimit(key, 1, 1_000)).toEqual({ success: false, retryAfter: 1_000 });

    vi.advanceTimersByTime(1_100);
    expect(rateLimit(key, 1, 1_000)).toEqual({ success: true });

    vi.useRealTimers();
  });
});
