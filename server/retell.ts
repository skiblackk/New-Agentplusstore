import { createHmac, timingSafeEqual } from "node:crypto";

export type RetellCall = Record<string, unknown>;
export type RetellWebhookEvent = { event: string; call: RetellCall | null };

export function verifyRetellSignature(rawBody: Buffer, header: string, apiKey: string, nowMs = Date.now()): boolean {
  if (!rawBody.length || !apiKey || !header) return false;
  const parts = Object.fromEntries(header.split(",").map((part) => {
    const separator = part.indexOf("=");
    return separator < 0 ? ["", ""] : [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
  }));
  const timestamp = parts.v;
  const digest = parts.d;
  if (!timestamp || !/^\d+$/.test(timestamp) || !digest || !/^[a-f\d]{64}$/i.test(digest)) return false;
  const numericTimestamp = Number(timestamp);
  const timestampMs = numericTimestamp < 1_000_000_000_000 ? numericTimestamp * 1000 : numericTimestamp;
  if (!Number.isFinite(timestampMs) || Math.abs(nowMs - timestampMs) > 5 * 60 * 1000) return false;

  const expected = createHmac("sha256", apiKey).update(rawBody).update(timestamp).digest();
  const received = Buffer.from(digest, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function extractRetellWebhook(payload: unknown): RetellWebhookEvent {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return { event: "", call: null };
  const root = payload as Record<string, unknown>;
  const data = root.data && typeof root.data === "object" && !Array.isArray(root.data)
    ? root.data as Record<string, unknown>
    : null;
  const rawCall = root.call ?? data?.call ?? root.data ?? null;
  const call = rawCall && typeof rawCall === "object" && !Array.isArray(rawCall)
    ? rawCall as RetellCall
    : null;
  const event = typeof root.event === "string" ? root.event : typeof data?.event === "string" ? data.event : "";
  return { event, call };
}

function textFromValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(textFromValue).filter(Boolean).join(" ");
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  for (const key of ["text", "content", "transcript", "message"]) {
    const text = textFromValue(record[key]);
    if (text) return text;
  }
  return "";
}

export function formatRetellTranscript(call: RetellCall, maxLength = 30_000): string {
  const direct = typeof call.transcript === "string" ? call.transcript.trim() : "";
  if (direct) return direct.slice(0, maxLength);
  if (!Array.isArray(call.transcript_with_tool_calls)) return "";

  const lines = call.transcript_with_tool_calls.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const turn = entry as Record<string, unknown>;
    const content = textFromValue(turn.content ?? turn.text ?? turn.message);
    if (!content) return [];
    const role = String(turn.role ?? turn.speaker ?? "").toLowerCase();
    const label = role === "user" || role === "caller" ? "Client" : role === "agent" || role === "assistant" ? "AgentPlusAI" : role || "Call";
    return [`${label}: ${content}`];
  });
  return lines.join("\n").slice(0, maxLength);
}

export function retellOrderIntent(transcript: string, analysis: unknown): "likely" | "review" {
  if (analysis && typeof analysis === "object" && !Array.isArray(analysis)) {
    const custom = (analysis as Record<string, unknown>).custom_analysis_data;
    if (custom && typeof custom === "object" && !Array.isArray(custom)) {
      const value = (custom as Record<string, unknown>).order_intent;
      if (value === true || value === "yes" || value === "likely" || value === "order") return "likely";
      if (value === false || value === "no") return "review";
    }
  }
  return /\b(place|make|submit|buy|purchase|order|book|sign me up|ready to buy)\b/i.test(transcript) ? "likely" : "review";
}
