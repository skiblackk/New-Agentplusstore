import { describe, expect, it } from "vitest";
import webpush from "web-push";

describe("browser push configuration", () => {
  it("accepts a valid VAPID key pair", () => {
    const { publicKey, privateKey } = webpush.generateVAPIDKeys();
    expect(publicKey).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(privateKey).toMatch(/^[A-Za-z0-9_-]{30,}$/);
    expect(() => webpush.setVapidDetails("mailto:hello@agentsplus.online", publicKey, privateKey)).not.toThrow();
  });

  const testBaseUrl = process.env.TEST_BASE_URL;
  describe.skipIf(!testBaseUrl)("live endpoint contract", () => {
    it("exposes the configured public key", async () => {
      const response = await fetch(`${testBaseUrl}/api/push/public-key`);
      expect(response.status).toBe(200);
      const body = await response.json() as { publicKey?: string };
      expect(body.publicKey).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    }, 15_000);
  });
});
