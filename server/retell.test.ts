import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { extractRetellWebhook, formatRetellTranscript, retellOrderIntent, verifyRetellSignature } from "./retell.js";

describe("Retell webhook helpers", () => {
  const key = "test-retell-key";
  const now = Date.now();

  function signed(rawBody: Buffer, timestampSeconds = Math.floor(now / 1000)) {
    const timestamp = String(timestampSeconds);
    const digest = createHmac("sha256", key).update(rawBody).update(timestamp).digest("hex");
    return `v=${timestamp},d=${digest}`;
  }

  it("accepts the exact body and a fresh valid signature", () => {
    const body = Buffer.from('{"event":"transcript_updated"}');
    expect(verifyRetellSignature(body, signed(body), key, now)).toBe(true);
  });

  it("rejects modified bodies, wrong keys, and stale timestamps", () => {
    const body = Buffer.from('{"event":"transcript_updated"}');
    expect(verifyRetellSignature(Buffer.from(`${body.toString()} `), signed(body), key, now)).toBe(false);
    expect(verifyRetellSignature(body, signed(body), "wrong-key", now)).toBe(false);
    expect(verifyRetellSignature(body, signed(body, Math.floor(now / 1000) - 301), key, now)).toBe(false);
  });

  it("extracts Retell's event and call payload", () => {
    const result = extractRetellWebhook({ event: "transcript_updated", call: { call_id: "call-1" } });
    expect(result.event).toBe("transcript_updated");
    expect(result.call?.call_id).toBe("call-1");
  });

  it("formats transcript turns with client and assistant labels", () => {
    const transcript = formatRetellTranscript({ transcript_with_tool_calls: [
      { role: "user", content: "I need a website" },
      { role: "agent", content: "What kind of business do you run?" },
    ] });
    expect(transcript).toBe("Client: I need a website\nAgentPlusAI: What kind of business do you run?");
  });

  it("keeps direct transcripts and marks likely order intent for review", () => {
    expect(formatRetellTranscript({ transcript: "  I want to order a site.  " })).toBe("I want to order a site.");
    expect(retellOrderIntent("I am ready to buy", null)).toBe("likely");
    expect(retellOrderIntent("Tell me about your services", null)).toBe("review");
    expect(retellOrderIntent("No purchase", { custom_analysis_data: { order_intent: "no" } })).toBe("review");
  });
});
