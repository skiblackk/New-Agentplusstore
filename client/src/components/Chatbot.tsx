import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Bot, ChevronDown, Send, Sparkles, X } from "lucide-react";

type Recommendation = { requirements: string; suggestedPackage: string; suggestedPrice: string; packageReasoning: string };
type Message = { role: "user" | "assistant"; content: string };
function extractOrderRecommendation(reply: string): { recommendation: Recommendation | null; cleanReply: string } {
  const marker = reply.indexOf("ORDER_READY:");
  if (marker < 0) return { recommendation: null, cleanReply: reply.trim() };
  const tail = reply.slice(marker + "ORDER_READY:".length).trim();
  const start = tail.indexOf("{");
  if (start < 0) return { recommendation: null, cleanReply: reply.slice(0, marker).trim() };
  let depth = 0;
  let end = -1;
  let quoted = false;
  let escaped = false;
  for (let index = start; index < tail.length; index += 1) {
    const character = tail[index];
    if (escaped) { escaped = false; continue; }
    if (character === "\\" && quoted) { escaped = true; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (quoted) continue;
    if (character === "{") depth += 1;
    if (character === "}") { depth -= 1; if (depth === 0) { end = index + 1; break; } }
  }
  if (end < 0) return { recommendation: null, cleanReply: reply.slice(0, marker).trim() };
  try {
    const parsed = JSON.parse(tail.slice(start, end)) as Recommendation;
    if (!parsed.requirements || !parsed.suggestedPackage) return { recommendation: null, cleanReply: reply.slice(0, marker).trim() };
    return { recommendation: parsed, cleanReply: reply.slice(0, marker).trim() || "I’m ready to help you get started." };
  } catch { return { recommendation: null, cleanReply: reply.slice(0, marker).trim() }; }
}
const welcome: Message = { role: "assistant", content: "Hi — I’m Aria, AgentPlus’s customer-care concierge. I can explain our services, help you choose the right AI agent, answer pricing questions, and help you place an order. What would you like AgentPlus to improve for your business?" };
function whatsappUrl(service: string) { return `https://wa.me/254729053520?text=${encodeURIComponent(`Hi AgentPlus, I’m interested in ${service}. I’d like to learn how it could help my business.`)}`; }
function trackAnalytics(eventName: string, service?: string) { const params = new URLSearchParams(window.location.search); void fetch("/api/analytics/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventName, service, page: window.location.pathname, sessionId: localStorage.getItem("agentplus_visitor_id") || undefined, referrer: document.referrer, utmSource: params.get("utm_source") || undefined, utmMedium: params.get("utm_medium") || undefined, utmCampaign: params.get("utm_campaign") || undefined, deviceType: /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop" }) }).catch(() => undefined); }
function trackWhatsApp(service: string) { const params = new URLSearchParams(window.location.search); void fetch("/api/whatsapp-click", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ service, visitorId: localStorage.getItem("agentplus_visitor_id") || undefined, page: window.location.pathname, device: /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop", referrer: document.referrer, campaign: params.get("utm_campaign") || "Direct", source: params.get("utm_source") || document.referrer || "Direct", medium: params.get("utm_medium") || "none", content: params.get("utm_content") || undefined }) }).catch(() => undefined); }
export default function Chatbot() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (open && !sessionStorage.getItem("agentplus_aria_started")) {
      sessionStorage.setItem("agentplus_aria_started", "1");
      trackAnalytics("aria_started");
    }
  }, [open]);

  return (
    <>
      <button
        className={`chat-launcher ${open ? "is-open" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close Aria customer care" : "Open Aria customer care"}
      >
        {open ? <X size={21} /> : <img className="chat-launcher-logo" src="/aria-logo.jpg" alt="" aria-hidden="true" />}
        <span>{open ? "Close" : "Ask Aria"}</span>
      </button>
      {open && (
        <aside className="chat-panel" aria-label="Aria customer care">
          <div className="chat-header">
            <div className="chat-avatar">
              <img src="/aria-logo.jpg" alt="Aria AI Agent by AgentPlus" />
            </div>
            <div>
              <strong>Aria</strong>
              <span>Customer care · ready to help</span>
            </div>
            <a
              className="chat-human-link"
              href={whatsappUrl("AgentPlus")}
              onClick={() => trackWhatsApp("AgentPlus")}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
            <button onClick={() => setOpen(false)} aria-label="Close">
              <ChevronDown size={18} />
            </button>
          </div>
          <iframe
            className="retell-orb-frame"
            src="https://agent.retellai.com/orb/agent_79afac06a3ca9951c7495cbc19?token=6a4cf1e8a12c8099278a87883dd1bc42"
            title="Talk to Aria with Retell AI"
            allow="microphone; autoplay"
            loading="lazy"
          />
        </aside>
      )}
    </>
  );
}
