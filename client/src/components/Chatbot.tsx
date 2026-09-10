import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Bot, ChevronDown, MessageCircle, Send, Sparkles, X } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };
type Recommendation = { requirements: string; suggestedPackage: string; suggestedPrice: string; packageReasoning: string };

const welcome: Message = { role: "assistant", content: "Hi — I’m Aria from AgentPlus. What is taking your team too much time right now: customer replies, lead capture, support, or operations?" };
const quickReplies = ["I need more leads", "Automate customer support", "Tell me about pricing"];
function whatsappUrl(service: string) { return `https://wa.me/254729053520?text=${encodeURIComponent(`Hi AgentPlus, I’m interested in ${service}. I’d like to learn how it could help my business.`)}`; }
function trackWhatsApp(service: string) { const params = new URLSearchParams(window.location.search); void fetch("/api/whatsapp-click", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ service, visitorId: localStorage.getItem("agentplus_visitor_id") || undefined, page: window.location.pathname, device: /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop", referrer: document.referrer, campaign: params.get("utm_campaign") || "Direct", source: params.get("utm_source") || document.referrer || "Direct", medium: params.get("utm_medium") || "none", content: params.get("utm_content") || undefined }) }).catch(() => undefined); }

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [lead, setLead] = useState({ name: "", email: "", phone: "" });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  async function send(prompt?: string) {
    const content = (prompt ?? input).trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next); setInput(""); setLoading(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) });
      const data = await response.json() as { content?: string; error?: string };
      const reply = data.content || data.error || "I’m unable to answer right now. Please reach us on WhatsApp.";
      const marker = reply.indexOf("ORDER_READY:");
      if (marker >= 0) {
        try { const parsed = JSON.parse(reply.slice(marker + 12).trim()); setRecommendation(parsed); } catch { /* keep the natural reply */ }
      }
      const visibleReply = reply.replace(/ORDER_READY:[\s\S]*$/, "").trim();
      for (let index = 0; index < visibleReply.length; index += 3) {
        await new Promise((resolve) => window.setTimeout(resolve, 16));
        setMessages([...next, { role: "assistant", content: visibleReply.slice(0, index + 3) }]);
      }
    } catch { setMessages([...next, { role: "assistant", content: "I’m having a moment. You can reach the team directly on WhatsApp: +254 729 053520." }]); }
    finally { setLoading(false); }
  }

  async function submitLead(event: FormEvent) {
    event.preventDefault();
    if (!recommendation || !lead.name || !lead.email) return;
    const response = await fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerName: lead.name, customerEmail: lead.email, customerPhone: lead.phone, requirements: recommendation.requirements, suggestedPackage: recommendation.suggestedPackage, suggestedPrice: recommendation.suggestedPrice, packageReasoning: recommendation.packageReasoning, source: "chatbot" }) });
    if (response.ok) setSubmitted(true);
  }

  return <>
    <button className={`chat-launcher ${open ? "is-open" : ""}`} onClick={() => setOpen((value) => !value)} aria-label={open ? "Close Aria chat" : "Open Aria chat"}>{open ? <X size={21} /> : <MessageCircle size={21} />}<span>{open ? "Close" : "Ask Aria"}</span></button>
    {open && <aside className="chat-panel" aria-label="AgentPlus assistant"><div className="chat-header"><div className="chat-avatar"><Sparkles size={16} /></div><div><strong>Aria</strong><span>AgentPlus concierge · online</span></div><a className="chat-human-link" href={whatsappUrl(recommendation?.suggestedPackage || "AgentPlus")} onClick={() => trackWhatsApp(recommendation?.suggestedPackage || "AgentPlus")} target="_blank" rel="noreferrer">WhatsApp</a><button onClick={() => setOpen(false)} aria-label="Close"><ChevronDown size={18} /></button></div><div className="chat-messages">{messages.map((message, index) => <div className={`chat-message ${message.role} ${loading && message.role === "assistant" && index === messages.length - 1 ? "typing-message" : ""}`} key={`${message.role}-${index}`}>{message.content}</div>)}{loading && <div className="chat-message assistant chat-loading"><span /><span /><span /></div>}{messages.length === 1 && !loading && <div className="quick-replies">{quickReplies.map((reply) => <button key={reply} onClick={() => void send(reply)}>{reply}</button>)}</div>}{recommendation && !submitted && <form className="chat-lead-form" onSubmit={submitLead}><strong>Want the team to follow up?</strong><input placeholder="Your name" value={lead.name} onChange={(event) => setLead({ ...lead, name: event.target.value })} required /><input type="email" placeholder="Work email" value={lead.email} onChange={(event) => setLead({ ...lead, email: event.target.value })} required /><input placeholder="Phone / WhatsApp (optional)" value={lead.phone} onChange={(event) => setLead({ ...lead, phone: event.target.value })} /><button className="button button-dark" type="submit">Send my inquiry <Send size={14} /></button></form>}{submitted && <div className="chat-success"><Bot size={17} /> Thanks — the AgentPlus team will be in touch within 24 hours.</div>}</div><div className="chat-composer"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void send(); }} placeholder="Tell me what you want to improve…" /><button onClick={() => void send()} aria-label="Send message"><Send size={16} /></button></div></aside>}
  </>;
}
