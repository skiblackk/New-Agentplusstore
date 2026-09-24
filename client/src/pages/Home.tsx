import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import Chatbot from "@/components/Chatbot";
import DemoLab from "@/components/DemoLab";
import OrderDialog from "@/components/OrderDialog";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Command,
  Inbox,
  Menu,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Workflow,
  X,
  Zap,
} from "lucide-react";

const agents = [
  {
    icon: Search,
    name: "Scout",
    category: "Research",
    description: "Turn a question into a clear, cited point of view before your next meeting.",
    accent: "lime",
    meta: "3.2 hrs saved / week",
  },
  {
    icon: Inbox,
    name: "Triage",
    category: "Inbox",
    description: "Sort, summarize, and route the messages that keep your best work stuck in draft.",
    accent: "lilac",
    meta: "42% faster replies",
  },
  {
    icon: Workflow,
    name: "Relay",
    category: "Operations",
    description: "Move information between your tools with a calm, reliable layer of automation.",
    accent: "peach",
    meta: "18 workflows live",
  },
];

const faqs = [
  {
    question: "What is an AgentPlus agent?",
    answer:
      "An agent is a focused AI teammate with a job description, context, and a repeatable way of working. Start with a template, then teach it the details that make your business yours.",
  },
  {
    question: "Do I need to know how to code?",
    answer:
      "No. AgentPlus is designed for operators, founders, and teams who want leverage without another technical project. You can start from a ready-made agent and customize it in plain language.",
  },
  {
    question: "Can I cancel or change plans?",
    answer:
      "Absolutely. Plans are flexible, and you can move between them as your team grows. Your agents and workflows stay yours.",
  },
  {
    question: "Is my company data secure?",
    answer:
      "AgentPlus is built around least-privilege access, clear permissions, and transparent connections. You choose what an agent can see and do.",
  },
];


function PaymentDialog({ packageName, config, close }: { packageName: string; config: PaymentConfig; close: () => void }) { const [email, setEmail] = useState(""); const [name, setName] = useState(""); const [hash, setHash] = useState(""); const [sending, setSending] = useState(false); const [sent, setSent] = useState(false); const price = packageName === "Starter Agent" ? "$400" : packageName === "Basic Agent" ? "$799" : packageName === "Premium Agent" ? "$1,500" : "$3,000+"; const submit = async (event: FormEvent) => { event.preventDefault(); setSending(true); const response = await fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerName: name, customerEmail: email, requirements: `Payment pending for ${packageName}. Binance transaction hash: ${hash}`, suggestedPackage: packageName, suggestedPrice: price, packageReasoning: "Customer submitted a manual Binance USDT payment for admin verification.", source: "binance-payment", paymentStatus: "pending", transactionHash: hash }) }); setSending(false); if (response.ok) setSent(true); }; return <div className="payment-backdrop" role="dialog" aria-modal="true" aria-label="Binance USDT payment"><div className="payment-dialog"><button className="payment-close" onClick={close} aria-label="Close payment dialog"><X size={18} /></button><span className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Manual payment</span><h2>Pay for {packageName} with USDT.</h2><p>Send <strong>{price}</strong> in USDT, then submit the transaction hash below. Your payment stays pending until AgentPlus verifies it.</p><div className="payment-details"><span>Binance Pay ID</span><strong>{config.binanceId || "Not configured"}</strong><span>Wallet · {config.network}</span><strong className="wallet-address">{config.walletAddress || "Not configured"}</strong></div><p className="payment-instructions">{config.instructions}</p>{sent ? <div className="payment-success">Payment details submitted. AgentPlus will verify the transaction and contact you.</div> : <form onSubmit={submit} className="payment-form"><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Work email" /><input required value={hash} onChange={(event) => setHash(event.target.value)} placeholder="Binance transaction hash" /><button className="button button-dark" disabled={sending}>{sending ? "Submitting…" : "Submit for verification"}</button></form>}</div></div>; }

function BrandMark() {
  return (
    <img src="/agentplus-logo.png" alt="" aria-hidden="true" className="brand-mark-img" />
  );
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

const WHATSAPP_NUMBER = "254729053520";
function whatsappUrl(service: string) { return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi AgentPlus, I’m interested in the ${service} package. I’d like to learn how it could help my business.`)}`; }
type PaymentConfig = { enabled: boolean; binanceId: string; walletAddress: string; network: string; instructions: string };

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [paymentPackage, setPaymentPackage] = useState<string | null>(null);
  const [orderPackage, setOrderPackage] = useState<"Starter Agent" | "Basic Agent" | "Premium Agent" | "Custom AI Agent" | null>(null);

  useEffect(() => { void fetch("/api/payment-config").then((response) => response.json()).then((data: { config?: PaymentConfig }) => setPaymentConfig(data.config || null)).catch(() => undefined);
  }, []);
  useEffect(() => {
    const revealTargets = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -40px" },
    );

    revealTargets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const storageKey = "agentplus_visitor_id";
    const visitorId = localStorage.getItem(storageKey) || `vis_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(storageKey, visitorId);
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor: {
        id: visitorId,
        timestamp: new Date().toISOString(),
        device: /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
        browser: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        pagesVisited: [{ page: window.location.pathname, title: document.title, time: new Date().toISOString(), duration: 0 }],
        servicesViewed: [],
        duration: 0,
        referrer: document.referrer,
      } }),
    }).catch(() => undefined);
  }, []);

  const goTo = (id: string) => {
    setMenuOpen(false);
    scrollToId(id);
  };

  const openWhatsApp = (service = "AgentPlus") => {
    const visitorId = localStorage.getItem("agentplus_visitor_id") || undefined;
    const params = new URLSearchParams(window.location.search);
    void fetch("/api/whatsapp-click", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ service, visitorId, page: window.location.pathname, device: /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop", referrer: document.referrer, campaign: params.get("utm_campaign") || "Direct", source: params.get("utm_source") || document.referrer || "Direct", medium: params.get("utm_medium") || "none", content: params.get("utm_content") || undefined }) }).catch(() => undefined);
    window.open(whatsappUrl(service), "_blank", "noopener,noreferrer");
    toast.success("Opening WhatsApp", { description: "The AgentPlus team is ready to help." });
  };
  const showDemo = () => openWhatsApp("a tailored AgentPlus rollout");
    const openOrder = (packageName: "Starter Agent" | "Basic Agent" | "Premium Agent" | "Custom AI Agent") => setOrderPackage(packageName);

  const startFree = () => {
    goTo("plans");
    toast("Choose your starting point", {
      description: "Review the AgentPlus packages and contact the team about the right fit.",
    });
  };

  return (
    <main className="site-shell">
      <header className="site-header">
        <div className="container nav-inner">
          <button className="brand" onClick={() => goTo("top")} aria-label="AgentPlus home">
            <BrandMark />
            <span>agent<span className="brand-plus">plus</span></span>
          </button>

          <nav className={`desktop-nav ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation">
            <button onClick={() => goTo("why")}>Why AgentPlus</button>
            <button onClick={() => goTo("agents")}>Agents</button>
            <a href="/services">Services</a>
            <button onClick={() => goTo("plans")}>Pricing</button>
            <button onClick={() => goTo("faq")}>FAQ</button>
          </nav>

          <div className="nav-actions">
            <button className="button button-small button-lime" onClick={startFree}>Get started <ArrowUpRight size={15} /></button>
            <button className="mobile-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Close navigation" : "Open navigation"}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <section className="hero-section" id="top">
        <div className="hero-grid container">
          <div className="hero-copy">
            <div className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> AI agents for the work that matters</div>
            <h1>Give your work <em>a second brain.</em></h1>
            <p className="hero-lede">AgentPlus gives ambitious teams practical AI teammates that think clearly, move quickly, and get better with every handoff.</p>
            <div className="hero-actions">
              <button className="button button-lime button-large" onClick={startFree}>Explore the agents <ArrowUpRight size={18} /></button>
              <button className="text-button light-button" onClick={showDemo}><span className="play-icon">▶</span> Talk through a rollout</button>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack" aria-hidden="true">
                <span className="avatar avatar-one">M</span>
                <span className="avatar avatar-two">J</span>
                <span className="avatar avatar-three">A</span>
                <span className="avatar avatar-four">R</span>
              </div>
              <div><strong>4,000+ operators</strong><span>already working with more leverage</span></div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="hero-image-wrap">
              <div className="hero-image agentplus-hero-art" role="img" aria-label="Abstract AgentPlus AI agent visualization"><div className="hero-glow" /><div className="hero-sphere"><span className="hero-sphere-ring ring-a" /><span className="hero-sphere-ring ring-b" /><span className="hero-sphere-core" /></div><span className="hero-orbit-dot dot-a" /><span className="hero-orbit-dot dot-b" /><span className="hero-orbit-dot dot-c" /></div>
              <div className="visual-label label-top"><span className="status-dot" /> agent online</div>
              <div className="visual-label label-bottom"><span className="label-number">01</span><span>Scout / active</span><ArrowUpRight size={14} /></div>
            </div>
            <div className="floating-card floating-card-top"><span className="mini-icon mini-icon-lilac"><Sparkles size={15} /></span><span><b>One clear next step.</b><small>Scout found 12 useful signals</small></span></div>
            <div className="floating-card floating-card-bottom"><span className="mini-icon mini-icon-lime"><Zap size={15} /></span><span><b>Work, in motion.</b><small>3 tasks routed while you slept</small></span></div>
          </div>
        </div>
        <div className="hero-ticker"><div className="container ticker-inner"><span>BUILT FOR THE MESSY MIDDLE</span><span className="ticker-line" /><span>BETTER QUESTIONS. FASTER FOLLOW-THROUGH.</span><ArrowDownRight size={17} /></div></div>
      </section>

      <DemoLab />

      <section className="proof-strip">
        <div className="container proof-inner">
          <span className="proof-caption">A little more room to think</span>
          <div className="logo-row"><span>northstar</span><span>WILD / KIND</span><span className="logo-serif">Forma</span><span>fieldnotes<span className="logo-dot">.</span></span><span>Arc / Labs</span></div>
        </div>
      </section>

      <section className="section light-section why-section" id="why">
        <div className="container">
          <div className="section-heading split-heading" data-reveal>
            <div><div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Not another AI tab</div><h2>Less prompting.<br /><em>More momentum.</em></h2></div>
            <div className="heading-aside"><p>Most AI tools give you a blank chat box. AgentPlus gives you a point of view, a playbook, and a place to start.</p><button className="text-button dark-button" onClick={() => goTo("agents")}>Meet the agent lineup <ArrowUpRight size={16} /></button></div>
          </div>
          <div className="value-grid" data-reveal="stagger">
            <article className="value-card value-card-tall"><div className="card-number">01</div><div className="value-art art-command"><Command size={27} /><div className="command-lines"><span /><span /><span /></div></div><h3>Start with<br />a sharp brief.</h3><p>Skip the blank page. Every agent begins with a clear job and the context to do it well.</p><span className="card-arrow"><ArrowUpRight size={18} /></span></article>
            <article className="value-card"><div className="card-number">02</div><div className="value-art art-flow"><div className="flow-node active"><Circle size={9} fill="currentColor" /></div><div className="flow-connector" /><div className="flow-node"><Circle size={9} fill="currentColor" /></div><div className="flow-connector" /><div className="flow-node"><Circle size={9} fill="currentColor" /></div></div><h3>Keep the<br />thread moving.</h3><p>Agents turn loose ends into the next useful action, without adding another meeting.</p><span className="card-arrow"><ArrowUpRight size={18} /></span></article>
            <article className="value-card"><div className="card-number">03</div><div className="value-art art-shield"><ShieldCheck size={30} /><span>your rules<br />your context</span></div><h3>Make it<br />feel like you.</h3><p>Teach your preferences once. Your agent gets more useful every time you work together.</p><span className="card-arrow"><ArrowUpRight size={18} /></span></article>
          </div>
        </div>
      </section>

      <section className="section dark-section agents-section" id="agents">
        <div className="container">
          <div className="section-heading split-heading agents-heading" data-reveal><div><div className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> The AgentPlus lineup</div><h2>Small team.<br /><em>Big output.</em></h2></div><div className="heading-aside"><p>Pick a specialist for the work that slows you down, then make it your own. No prompt gymnastics required.</p><button className="text-button light-button" onClick={showDemo}>See how it works <ArrowUpRight size={16} /></button></div></div>
          <div className="agents-grid" data-reveal="stagger">{agents.map((agent) => { const Icon = agent.icon; return <article className={`agent-card agent-${agent.accent}`} key={agent.name}><div className="agent-card-top"><div className="agent-icon"><Icon size={21} /></div><span className="agent-category">{agent.category}</span><ArrowUpRight className="agent-arrow" size={18} /></div><div className="agent-illustration"><div className="illustration-core"><Icon size={31} /></div><div className="illustration-orbit orbit-a" /><div className="illustration-orbit orbit-b" /></div><h3>{agent.name}</h3><p>{agent.description}</p><div className="agent-meta"><span className="agent-live"><span /> Ready to run</span><span>{agent.meta}</span></div><button className="agent-action" onClick={() => openWhatsApp(agent.name)} aria-label={`Discuss ${agent.name} agent`}>Discuss {agent.name} <ArrowUpRight size={14} /></button></article> })}</div>
        </div>
      </section>

      <section className="section light-section steps-section">
        <div className="container steps-layout" data-reveal><div className="steps-intro"><div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Your way in</div><h2>From “we should”<br />to <em>done.</em></h2><p>AgentPlus is designed to get you from curiosity to compounding momentum in one afternoon.</p><button className="button button-dark" onClick={startFree}>Build your first agent <ArrowUpRight size={17} /></button></div><div className="steps-list"><div className="step-item"><span className="step-index">01</span><div><h3>Choose your starting point</h3><p>Pick an agent that matches the bottleneck on your desk right now.</p></div><ChevronRight size={20} /></div><div className="step-item"><span className="step-index">02</span><div><h3>Give it your context</h3><p>Add your voice, your references, and the “how we do things here” details.</p></div><ChevronRight size={20} /></div><div className="step-item"><span className="step-index">03</span><div><h3>Let the work compound</h3><p>Use it in the flow of your week. Your agent gets smarter with every useful handoff.</p></div><ChevronRight size={20} /></div></div></div>
      </section>

      <section className="section plans-section" id="plans">
        <div className="container"><div className="plans-header" data-reveal><div><div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Clear packages, practical outcomes</div><h2>Start with a<br /><em>useful win.</em></h2></div><p className="plans-note">Every package includes setup assistance and one month of free updates. Need a tailored rollout? We can structure installments around your implementation.</p></div><div className="plans-grid" data-reveal="stagger"><article className="plan-card"><div className="plan-label">For small businesses</div><h3>Starter Agent</h3><p>One focused AI system to get your first workflow moving.</p><div className="plan-price"><strong>$400</strong><span>one-time</span></div><button className="button button-outline" onClick={() => openOrder("Starter Agent")}>Order Starter · $400 <ArrowUpRight size={16} /></button><ul><li><Check size={16} /> WhatsApp AI Agent</li><li><Check size={16} /> Basic lead capture</li><li><Check size={16} /> Email support</li><li><Check size={16} /> Setup assistance</li></ul></article><article className="plan-card plan-featured"><div className="featured-badge">Most popular</div><div className="plan-label">For growing businesses</div><h3>Basic Agent</h3><p>A connected set of agents for comprehensive customer and lead workflows.</p><div className="plan-price"><strong>$799</strong><span>one-time</span></div><button className="button button-lime" onClick={() => openOrder("Basic Agent")}>Order Basic · $799 <ArrowUpRight size={16} /></button><ul><li><Check size={16} /> Everything in Starter</li><li><Check size={16} /> Web AI Chatbot</li><li><Check size={16} /> Google Maps optimization</li><li><Check size={16} /> Analytics + custom training</li></ul></article><article className="plan-card"><div className="plan-label">For large-scale operations</div><h3>Premium Agent</h3><p>Custom integrations, multiple agents, and a dedicated path to scale.</p><div className="plan-price"><strong>$1,500</strong><span>one-time</span></div><button className="button button-outline" onClick={() => openOrder("Premium Agent")}>Order Premium · $1,500 <ArrowUpRight size={16} /></button><ul><li><Check size={16} /> Everything in Professional</li><li><Check size={16} /> Multiple AI agents</li><li><Check size={16} /> Custom integrations</li><li><Check size={16} /> Dedicated account manager</li></ul></article></div><article className="custom-plan-card" data-reveal><div><div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Need something bigger?</div><h3>Custom AI Agents</h3><p>Multiple agents, CRM and WhatsApp integrations, internal systems, or a complete custom deployment.</p></div><div><strong>$3,000 – $25,000+</strong><span>built around your business</span><button className="button button-dark" onClick={() => openOrder("Custom AI Agent")}>Request custom agent <ArrowUpRight size={15} /></button></div></article></div>
      </section>

      <section className="section quote-section"><div className="container quote-layout" data-reveal><div className="quote-mark">“</div><blockquote>AgentPlus feels less like another tool and more like the calm, capable operator I wish I had hired six months ago.</blockquote><div className="quote-author"><span className="quote-avatar">N</span><span><strong>Nia Collins</strong><small>Founder, The Field Office</small></span></div></div></section>

      <section className="section faq-section" id="faq"><div className="container faq-layout" data-reveal><div><div className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> A few good questions</div><h2>Good to<br /><em>know.</em></h2><p>Still curious? <button className="inline-link" onClick={showDemo}>Talk to a human <ArrowUpRight size={14} /></button></p></div><div className="faq-list">{faqs.map((faq, index) => <div className={`faq-item ${openFaq === index ? "is-open" : ""}`} key={faq.question}><button className="faq-question" onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}><span>{faq.question}</span>{openFaq === index ? <Minus size={18} /> : <Plus size={18} />}</button>{openFaq === index && <p className="faq-answer">{faq.answer}</p>}</div>)}</div></div></section>

      <section className="final-cta"><div className="container final-cta-inner" data-reveal><div className="final-cta-copy"><div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Make room for better work</div><h2>Your next<br /><em>good idea</em><br />is waiting.</h2><button className="button button-dark button-large" onClick={startFree}>Explore your starting point <ArrowUpRight size={18} /></button></div><div className="cta-scribble" aria-hidden="true"><svg viewBox="0 0 320 280" fill="none"><path d="M25 195C72 239 137 265 205 245C270 226 308 168 286 114C263 57 185 36 135 59C91 80 74 124 89 160C107 203 171 214 214 187C252 162 258 111 231 85" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M213 76L230 84L221 101" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="90" cy="160" r="5" fill="currentColor" /><circle cx="205" cy="245" r="5" fill="currentColor" /></svg></div></div></section>

      <footer className="site-footer"><div className="container footer-top"><button className="brand footer-brand" onClick={() => goTo("top")}><BrandMark /><span>agent<span className="brand-plus">plus</span></span></button><div className="footer-links"><div><span className="footer-label">Explore</span><button onClick={() => goTo("why")}>Why AgentPlus</button><button onClick={() => goTo("agents")}>Agents</button><a href="/services">Services</a><button onClick={() => goTo("plans")}>Pricing</button></div><div><span className="footer-label">Company</span><a href="/about">About</a><a href="/blog">Field notes</a><a href="/contact">Contact</a></div><div><span className="footer-label">Say hello</span><a href="mailto:hello@agentplus.store">hello@agentplus.store</a><a href="#faq">FAQ</a><a href="#top">Back to top ↑</a></div></div></div><div className="container footer-bottom"><span>© 2026 AgentPlus</span><span>Built for better work, not more work.</span><div><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div></div></footer>
      <Chatbot />
      {paymentPackage && paymentConfig?.enabled && <PaymentDialog packageName={paymentPackage} config={paymentConfig} close={() => setPaymentPackage(null)} />}
      {orderPackage && <OrderDialog packageName={orderPackage} close={() => setOrderPackage(null)} />}
    </main>
  );
}
