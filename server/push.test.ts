import { describe, expect, it } from "vitest";
import webpush from "web-push";

describe("browser push configuration", () => {
  it("accepts the configured VAPID key pair and exposes only the public key contract", async () => {
    const publicKey = process.env.VAPID_PUBLIC_KEY || "";
    const privateKey = process.env.VAPID_PRIVATE_KEY || "";
    expect(publicKey).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(privateKey).toMatch(/^[A-Za-z0-9_-]{30,}$/);
    expect(() => webpush.setVapidDetails("mailto:hello@agentplus.store", publicKey, privateKey)).not.toThrow();
    const response = await fetch(`${process.env.TEST_BASE_URL || "http://localhost:3000"}/api/push/public-key`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ publicKey });
  });
});
