import { describe, expect, it } from "vitest";

describe("Supabase configuration", () => {
  it("accepts the configured server credentials", async () => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(url).toBeTruthy();
    expect(key).toBeTruthy();
    const response = await fetch(`${url!.replace(/\/$/, "")}/rest/v1/`, {
      headers: { apikey: key!, Authorization: `Bearer ${key!}` },
    });
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
    expect(response.status).toBeLessThan(500);
  }, 15_000);
});
