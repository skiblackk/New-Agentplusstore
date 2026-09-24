import { ArrowUpRight, BarChart3, Bot, Check, Clock3, Globe2, LayoutDashboard, MapPin, MessageCircle, Megaphone, Package, PanelTop, ReceiptText, ShoppingBag, WalletCards } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const services = [
  ["WhatsApp Agent", "Auto-reply to messages, capture leads, and manage conversations 24/7", MessageCircle, "$500"],
  ["Web Chatbot", "Answer FAQs and qualify leads instantly while visitors are still browsing", Globe2, "$1,500"],
  ["Google Maps Optimization", "Get discovered by local customers with an optimized listing", MapPin, "$500"],
  ["AI Customer Support", "Handle support queries across channels with a trained AI layer", Clock3, "$1,500"],
  ["Lead Analytics Dashboard", "See lead quality, response times, and conversions in one place", BarChart3, "$500"],
  ["AI Website Builder", "Create a professional, mobile-ready presence without the technical lift", PanelTop, "$1,500"],
  ["Business Management Dashboard", "Track sales, purchases, expenses, and profits from one system", LayoutDashboard, "$500"],
  ["Inventory & Sales Tracking", "Monitor stock levels and sales performance in real time", Package, "$500"],
  ["MPESA Payment Integration", "Accept secure MPESA payments directly from your website", WalletCards, "$500"],
  ["Automated Billing System", "Create invoices, automate reminders, and manage subscriptions", ReceiptText, "$500"],
  ["AI Marketing Tools", "Generate content, schedule posts, and launch campaigns with less effort", Megaphone, "$500"],
  ["AI Business Assistant", "Get smart insights and automated reports powered by AI", Bot, "$1,500"],
  ["Multi-Branch Management", "Manage locations with unified systems and staff tracking", ShoppingBag, "$1,500"],
];
const number = "254729053520";
function contactUrl(service: string) { return `https://wa.me/${number}?text=${encodeURIComponent(`Hi AgentPlus, I’m interested in ${service}. Please help me understand the best setup for my business.`)}`; }

export default function Services() {
  const openContact = (service = "AgentPlus services") => { window.open(contactUrl(service), "_blank", "noopener,noreferrer"); toast.success("Opening WhatsApp", { description: "The AgentPlus team is ready to help." }); };
  return <main className="subpage services-page">
    <nav className="subpage-nav container"><Link href="/" className="brand"><img src="/agentplus-logo.png" alt="" aria-hidden="true" className="brand-mark-img" /><span>agent<span className="brand-plus">plus</span></span></Link><Link href="/" className="subpage-back">← Back home</Link></nav>
    <section className="subpage-hero container"><div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> The AgentPlus catalog</div><h1>Practical tools for<br /><em>real bottlenecks.</em></h1><p>From customer conversations to back-office systems, choose a focused AI layer that helps your business move with more clarity and less overhead.</p><button className="button button-dark button-large" onClick={() => openContact()}>Find my starting point <ArrowUpRight size={18} /></button></section>
    <section className="service-grid-wrap"><div className="container"><div className="service-grid">{services.map(([title, description, Icon, price], index) => <article className="service-card" key={title as string}><div className="service-card-top"><span className="service-index">{String(index + 1).padStart(2, "0")}</span><div className="service-icon"><Icon size={20} /></div><ArrowUpRight className="service-arrow" size={17} /></div><h2>{title as string}</h2><p>{description as string}</p><div className="service-card-bottom"><span><Check size={14} /> Built to launch fast</span><strong>{price as string}<small> one-time</small></strong></div><button className="service-action" onClick={() => openContact(title as string)}>Discuss this service <ArrowUpRight size={14} /></button></article>)}</div></div></section>
    <section className="service-cta"><div className="container service-cta-inner"><div><div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Not sure where to begin?</div><h2>Start with the<br /><em>thing that repeats.</em></h2></div><div><p>We’ll help you find the first workflow worth giving a second brain.</p><button className="button button-dark" onClick={() => openContact()}>Talk to AgentPlus <ArrowUpRight size={17} /></button></div></div></section>
  </main>;
}
