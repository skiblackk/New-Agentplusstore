import { useState } from "react";
import { ArrowUpRight, Search, Sparkles } from "lucide-react";

type Source = { title: string; url: string };
type Message = { role: "user" | "assistant"; content: string; sources?: Source[] };

const prompts = [
  "Research website development companies in Nairobi and show me how to compete.",
  "What should an AI-powered customer support agent do for a growing business?",
  "Give me a 30-day strategy to turn more website visitors into qualified leads.",
];

export default function DemoLab() {
  const [mode, setMode] = useState<"quick" | "research">("quick");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const send = async (value = input) => {
    const content = value.trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next); setInput(""); setLoading(true);
    try {
      const response = await fetch("/api/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, messages: next }) });
      const data = await response.json() as { content?: string; sources?: Source[]; error?: string };
      setMessages([...next, { role: "assistant", content: data.content || data.error || "The demo is unavailable right now.", sources: data.sources }]);
    } catch { setMessages([...next, { role: "assistant", content: "The demo could not connect. Please try again or talk to Aria below." }]); }
    finally { setLoading(false); }
  };
  return <section className="demo-lab section" id="demo"><div className="container"><div className="demo-header"><div><div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Try an AgentPlus agent free</div><h2>Ask a sharper<br /><em>next question.</em></h2></div><p>Experience the same practical thinking we build into customer agents. Quick Answer is fast. Research Power searches the live web before it responds.</p></div><div className="demo-card"><div className="demo-toolbar"><div className="demo-modes"><button className={mode === "quick" ? "active" : ""} onClick={() => setMode("quick")}><Sparkles size={15} /> Quick Answer</button><button className={mode === "research" ? "active" : ""} onClick={() => setMode("research")}><Search size={15} /> Research Power</button></div><span className="demo-free-badge">Free live demo</span></div><div className="demo-body"><div className="demo-prompts">{prompts.map((prompt) => <button key={prompt} onClick={() => void send(prompt)}>{prompt}<ArrowUpRight size={14} /></button>)}</div><div className="demo-thread">{messages.length ? messages.map((message, index) => <article className={`demo-message ${message.role}`} key={`${message.role}-${index}`}><span>{message.role === "user" ? "You" : "AgentPlus"}</span><p>{message.content}</p>{message.sources?.length ? <div className="demo-sources"><strong>Sources</strong>{message.sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>{source.title || source.url}</a>)}</div> : null}</article>) : <div className="demo-empty"><Sparkles size={20} /><strong>Start with a business question.</strong><span>Ask about strategy, customers, competitors, marketing, or the work you want to automate.</span></div>}{loading && <div className="demo-message assistant"><span>AgentPlus</span><p className="demo-typing">Thinking with {mode === "research" ? "live sources" : "a clear point of view"}…</p></div>}</div></div><form className="demo-composer" onSubmit={(event) => { event.preventDefault(); void send(); }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder={mode === "research" ? "Ask what you want researched…" : "Ask a business question…"} /><button className="button button-dark" type="submit" disabled={loading}>Ask agent <ArrowUpRight size={15} /></button></form></div></div></section>;
}
