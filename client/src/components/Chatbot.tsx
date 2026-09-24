import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AlertTriangle, Bot, ChevronDown, ExternalLink, MessageCircle, Search, Send, Sparkles, X } from "lucide-react";

type Source = { title: string; url: string };
type Message = { role: "user" | "assistant"; content: string; sources?: Source[]; researchUsed?: boolean; systemNotice?: boolean };
type Recommendation = { requirements: string; suggestedPackage: string; suggestedPrice: string; packageReasoning: string };

const welcome: Message = { role: "assistant", content: "Hi, I’m Aria from AgentPlus 👋 Tell me a bit about your business and what’s eating up your team’s time — customer replies, lead capture, support, or operations — and I’ll help you find the right AI agent for it." };

function whatsappUrl(service: string) {
  return `https://wa.me/254729053520?text=${encodeURIComponent(`Hi AgentPlus, I’m interested in ${service}. I’d like to learn how it could help my business.`)}`;
}

function trackWhatsApp(service: string) {
  const params = new URLSearchParams(window.location.search);
  void fetch("/api/whatsapp-click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service,
      visitorId: localStorage.getItem("agentplus_visitor_id") || undefined,
      page: window.location.pathname,
      device: /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
      referrer: document.referrer,
      campaign: params.get("utm_campaign") || "Direct",
      source: params.get("utm_source") || document.referrer || "Direct",
      medium: params.get("utm_medium") || "none",
      content: params.get("utm_content") || undefined,
    }),
  }).catch(() => undefined);
}

function ResearchAnswer({ content }: { content: string }) {
  return (
    <div className="research-answer">
      {content.split("\n").map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div className="research-space" key={index} />;
        if (/^#{1,3}\s/.test(trimmed)) return <h4 key={index}>{trimmed.replace(/^#{1,3}\s*/, "")}</h4>;
        if (/^\*\*\d+\./.test(trimmed) || /^\d+\./.test(trimmed)) return <div className="research-step" key={index}>{trimmed.replace(/^\*\*/, "").replace(/\*\*$/, "")}</div>;
        if (/^\|/.test(trimmed)) return <div className="research-table-line" key={index}>{trimmed}</div>;
        return <div key={index}>{line}</div>;
      })}
    </div>
  );
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [lead, setLead] = useState({ name: "", email: "", phone: "" });
  const [submitted, setSubmitted] = useState(false);
  const [aiOffline, setAiOffline] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  async function send() {
    const content = input.trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) });
      const data = (await response.json()) as { content?: string; error?: string; sources?: Source[]; researchUsed?: boolean; aiAvailable?: boolean };
      const notConfigured = data.aiAvailable === false;
      setAiOffline(notConfigured);
      if (notConfigured) {
        setMessages([...next, { role: "assistant", content: "Aria’s AI connection isn’t set up on this deployment yet, so I can’t have a real conversation right now — but the team is one message away.", systemNotice: true }]);
        return;
      }
      const reply = data.content || data.error || "I’m having a moment — try WhatsApp for the fastest response.";
      const marker = reply.indexOf("ORDER_READY:");
      if (marker >= 0) {
        try {
          setRecommendation(JSON.parse(reply.slice(marker + 12).trim()));
        } catch {
          /* keep the reply as-is */
        }
      }
      const visibleReply = reply.replace(/ORDER_READY:[\s\S]*$/, "").trim();
      setMessages([...next, { role: "assistant", content: visibleReply, sources: data.sources, researchUsed: data.researchUsed }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "I couldn’t send that — please try again or reach us on WhatsApp.", systemNotice: true }]);
    } finally {
      setLoading(false);
    }
  }

  async function submitLead(event: FormEvent) {
    event.preventDefault();
    if (!recommendation || !lead.name || !lead.email) return;
    const response = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: lead.name,
        customerEmail: lead.email,
        customerPhone: lead.phone,
        requirements: recommendation.requirements,
        suggestedPackage: recommendation.suggestedPackage,
        suggestedPrice: recommendation.suggestedPrice,
        packageReasoning: recommendation.packageReasoning,
        source: "chatbot",
      }),
    });
    if (response.ok) setSubmitted(true);
  }

  const recommendedWhatsApp = recommendation ? whatsappUrl(recommendation.suggestedPackage) : "";

  return (
    <>
      <button className={`chat-launcher ${open ? "is-open" : ""}`} onClick={() => setOpen((value) => !value)} aria-label={open ? "Close Aria chat" : "Ask Aria"}>
        {open ? <X size={21} /> : <MessageCircle size={21} />}
        <span>{open ? "Close" : "Ask Aria"}</span>
      </button>
      {open && (
        <aside className="chat-panel" aria-label="Aria, AgentPlus assistant">
          <div className="chat-header">
            <div className="chat-avatar"><Sparkles size={16} /></div>
            <div>
              <strong>Aria</strong>
              <span>{aiOffline ? "Limited mode · use WhatsApp" : "Customer care · online now"}</span>
            </div>
            <a className="chat-human-link" href={whatsappUrl(recommendation?.suggestedPackage || "AgentPlus")} onClick={() => trackWhatsApp(recommendation?.suggestedPackage || "AgentPlus")} target="_blank" rel="noreferrer">WhatsApp</a>
            <button onClick={() => setOpen(false)} aria-label="Close"><ChevronDown size={18} /></button>
          </div>
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div className={`chat-message ${message.role} ${message.systemNotice ? "system-notice" : ""} ${loading && message.role === "assistant" && index === messages.length - 1 ? "typing-message" : ""}`} key={`${message.role}-${index}`}>
                {message.systemNotice && <div className="notice-label"><AlertTriangle size={12} /> Connection notice</div>}
                {message.role === "assistant" ? <ResearchAnswer content={message.content} /> : <div>{message.content}</div>}
                {message.researchUsed && message.sources?.length ? (
                  <div className="aria-sources">
                    <strong><Search size={12} /> Sources named in this brief</strong>
                    {message.sources.map((source) => (
                      <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>
                        <span>
                          <b>{source.title || "External source"}</b>
                          <small>
                            {(() => {
                              try {
                                return new URL(source.url).hostname.replace("www.", "");
                              } catch {
                                return "External research";
                              }
                            })()}
                          </small>
                        </span>
                        <ExternalLink size={11} />
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {loading && (
              <div className="chat-message assistant chat-loading">
                <span /><span /><span />
              </div>
            )}
            {aiOffline && (
              <div className="chat-message system-notice">
                <div className="notice-label"><AlertTriangle size={12} /> Connection notice</div>
                <div>The team hasn’t connected Aria’s AI engine yet on this deployment. Message us directly and a real person will help right away.</div>
                <a className="chat-human-link chat-human-link-inline" href={whatsappUrl("AgentPlus")} onClick={() => trackWhatsApp("AgentPlus")} target="_blank" rel="noreferrer">Message us on WhatsApp</a>
              </div>
            )}
            {recommendation && (
              <div className="aria-whatsapp-offer">
                <div>
                  <strong>Ready to make this real?</strong>
                  <small>Aria recommends {recommendation.suggestedPackage} · {recommendation.suggestedPrice}</small>
                </div>
                <a href={recommendedWhatsApp} onClick={() => trackWhatsApp(recommendation.suggestedPackage)} target="_blank" rel="noreferrer">Continue on WhatsApp <Send size={13} /></a>
              </div>
            )}
            {recommendation && !submitted && (
              <form className="chat-lead-form" onSubmit={submitLead}>
                <strong>Want the team to follow up?</strong>
                <input placeholder="Your name" value={lead.name} onChange={(event) => setLead({ ...lead, name: event.target.value })} required />
                <input type="email" placeholder="Work email" value={lead.email} onChange={(event) => setLead({ ...lead, email: event.target.value })} required />
                <input placeholder="Phone / WhatsApp (optional)" value={lead.phone} onChange={(event) => setLead({ ...lead, phone: event.target.value })} />
                <button className="button button-dark" type="submit">Send my inquiry <Send size={14} /></button>
              </form>
            )}
            {submitted && (
              <div className="chat-success"><Bot size={17} /> Thanks — the AgentPlus team will be in touch within 24 hours.</div>
            )}
          </div>
          <div className="chat-composer">
            <input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void send(); }} placeholder="Tell Aria what your business needs…" />
            <button onClick={() => void send()} aria-label="Send message"><Search size={16} /></button>
          </div>
        </aside>
      )}
    </>
  );
}
