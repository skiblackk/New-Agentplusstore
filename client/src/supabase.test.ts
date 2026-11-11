import { describe, expect, it } from "vitest";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

describe.skipIf(!supabaseUrl || !supabaseKey)("Supabase configuration", () => {
  it("accepts the configured server credentials", async () => {
    const response = await fetch(`${supabaseUrl!.replace(/\/$/, "")}/rest/v1/`, {
      headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey!}` },
    });
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
    expect(response.status).toBeLessThan(500);
  }, 15_000);
});
