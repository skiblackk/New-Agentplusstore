import { ArrowUpRight, CheckCircle2, HeartHandshake, Lightbulb, ShieldCheck, Target } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";

const values = [
  ["Affordable", "Enterprise-grade AI solutions at prices ambitious businesses can actually work with.", Target],
  ["Simple", "Clear enough for a busy operator to start without a technical project or long onboarding.", Lightbulb],
  ["Reliable", "Focused agents, transparent permissions, and support when a workflow really matters.", ShieldCheck],
  ["Local", "Built with the realities of African teams, customers, channels, and payment systems in mind.", HeartHandshake],
];

const founderSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Joshua Musumbi",
  jobTitle: "Founder & CEO",
  url: "https://agentsplus.online/about",
  worksFor: {
    "@type": "Organization",
    name: "AgentPlus",
    url: "https://agentsplus.online/",
    foundingDate: "2025",
  },
  knowsAbout: ["AI agents", "automation", "software solutions"],
};

export default function About() {
  useEffect(() => {
    document.title = "Joshua Musumbi — Founder & CEO of AgentPlus";
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute("content", "Meet Joshua Musumbi, Founder and CEO of AgentPlus, an AI and automation company building practical agents, websites, and software solutions.");
  }, []);

  return <main className="subpage about-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(founderSchema) }} />
    <nav className="subpage-nav container"><Link href="/" className="brand"><span className="brand-mark"><span /><span /><span /></span><span>agent<span className="brand-plus">plus</span></span></Link><Link href="/" className="subpage-back">← Back home</Link></nav>
    <section className="subpage-hero container about-hero"><div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> The people behind the agents</div><h1>AI that feels<br /><em>within reach.</em></h1><p>Founded in 2025 by Joshua Musumbi, AgentPlus makes practical AI automation accessible to businesses building the future from Nairobi to everywhere.</p></section>
    <section className="about-mission"><div className="container about-mission-grid"><div><span className="mission-number">01 / OUR MISSION</span><h2>Make room for<br /><em>better work.</em></h2></div><div><p>We believe every business, regardless of size or budget, deserves access to world-class technology that saves time, reduces costs, and creates momentum.</p><p>AgentPlus turns that belief into focused agents and systems that handle the repetitive work, so teams can spend more energy on the decisions only they can make.</p><Link className="text-button dark-button" href="/services">Explore the catalog <ArrowUpRight size={16} /></Link></div></div></section>
    <section className="founder-section"><div className="container founder-grid"><div><span className="mission-number">02 / THE FOUNDER</span><h2>Joshua<br /><em>Musumbi.</em></h2><p className="founder-role">Founder &amp; CEO, AgentPlus</p></div><div className="founder-copy"><div className="founder-specialties">AI Agents <span>·</span> Automation <span>·</span> Software Solutions</div><p>Joshua Musumbi is the Founder and CEO of AgentPlus, an AI and automation company focused on helping businesses work smarter through intelligent agents, modern websites, and custom software solutions.</p><p>His vision is to make practical AI technology accessible to businesses looking to improve productivity, customer experience, and growth.</p></div></div></section>
    <section className="section about-values"><div className="container"><div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> What we stand for</div><h2>Useful beats<br /><em>impressive.</em></h2><div className="values-grid">{values.map(([title, description, Icon]) => <article className="about-value-card" key={title as string}><Icon size={24} /><h3>{title as string}</h3><p>{description as string}</p><CheckCircle2 size={16} className="value-check" /></article>)}</div></div></section>
  </main>;
}
