import type { FormEvent } from "react";
import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const methods = [
  ["WhatsApp", "Chat with us instantly", MessageCircle, "https://wa.me/254729053520?text=Hi%20AgentPlus%2C%20I%20want%20to%20learn%20more.", "Message us"],
  ["Email", "hello@agentplus.store", Mail, "mailto:hello@agentplus.store", "Send an email"],
  ["Phone", "+254 729 053520", Phone, "tel:+254729053520", "Call the team"],
  ["Office", "Nairobi, Kenya", MapPin, "https://maps.google.com/?q=Nairobi%2C%20Kenya", "Get directions"],
];

export default function Contact() {
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const name = String(form.get("name") || "").trim(); const email = String(form.get("email") || "").trim(); const message = String(form.get("message") || "").trim(); const response = await fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerName: name, customerEmail: email, requirements: message, suggestedPackage: "Contact form inquiry", suggestedPrice: "To be scoped", packageReasoning: "Submitted from the AgentPlus contact page", source: "contact-form" }) }); if (response.ok) { event.currentTarget.reset(); toast.success("Message sent", { description: "Your inquiry is now in the AgentPlus admin inbox. We’ll reply within 24 hours." }); } else toast.error("We couldn’t send your message", { description: "Please try WhatsApp or email us directly." }); };
  return <main className="subpage contact-page">
    <nav className="subpage-nav container"><Link href="/" className="brand"><img src="/agentplus-logo.png" alt="" aria-hidden="true" className="brand-mark-img" /><span>agent<span className="brand-plus">plus</span></span></Link><Link href="/" className="subpage-back">← Back home</Link></nav>
    <section className="subpage-hero container contact-hero"><div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Let’s make work lighter</div><h1>Have a good<br /><em>question?</em></h1><p>Tell us what is taking too much time. We’ll help you find the simplest place to start.</p></section>
    <section className="contact-content"><div className="container contact-grid"><div className="contact-methods">{methods.map(([title, description, Icon, href, label]) => <a className="contact-method" href={href as string} key={title as string}><div className="contact-method-icon"><Icon size={20} /></div><div><span>{title as string}</span><strong>{description as string}</strong><small>{label as string} <ArrowUpRight size={13} /></small></div></a>)}</div><form className="contact-form" onSubmit={submit}><div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Send a note</div><h2>Let’s talk<br /><em>momentum.</em></h2><label>Name<input name="name" placeholder="Your name" required /></label><label>Work email<input name="email" type="email" placeholder="you@company.com" required /></label><label>What can we help with?<textarea name="message" placeholder="Tell us a little about the workflow you want to improve" rows={4} required /></label><button className="button button-dark" type="submit">Send message <Send size={16} /></button></form></div></section>
  </main>;
}
