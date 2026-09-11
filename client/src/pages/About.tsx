import { ArrowUpRight, CheckCircle2, HeartHandshake, Lightbulb, ShieldCheck, Target } from "lucide-react";
import { Link } from "wouter";

const values = [
  ["Affordable", "Enterprise-grade AI solutions at prices ambitious businesses can actually work with.", Target],
  ["Simple", "Clear enough for a busy operator to start without a technical project or long onboarding.", Lightbulb],
  ["Reliable", "Focused agents, transparent permissions, and support when a workflow really matters.", ShieldCheck],
  ["Local", "Built with the realities of African teams, customers, channels, and payment systems in mind.", HeartHandshake],
];

export default function About() {
  return <main className="subpage about-page">
    <nav className="subpage-nav container"><Link href="/" className="brand"><span className="brand-mark"><span /><span /><span /></span><span>agent<span className="brand-plus">plus</span></span></Link><Link href="/" className="subpage-back">← Back home</Link></nav>
    <section className="subpage-hero container about-hero"><div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> The people behind the agents</div><h1>AI that feels<br /><em>within reach.</em></h1><p>AgentPlus exists to make practical AI automation accessible to businesses that are building the future from Nairobi to everywhere.</p></section>
    <section className="about-mission"><div className="container about-mission-grid"><div><span className="mission-number">01 / OUR MISSION</span><h2>Make room for<br /><em>better work.</em></h2></div><div><p>We believe every business, regardless of size or budget, deserves access to world-class technology that saves time, reduces costs, and creates momentum.</p><p>AgentPlus turns that belief into focused agents and systems that handle the repetitive work, so teams can spend more energy on the decisions only they can make.</p><Link className="text-button dark-button" href="/services">Explore the catalog <ArrowUpRight size={16} /></Link></div></div></section>
    <section className="section about-values"><div className="container"><div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> What we stand for</div><h2>Useful beats<br /><em>impressive.</em></h2><div className="values-grid">{values.map(([title, description, Icon]) => <article className="about-value-card" key={title as string}><Icon size={24} /><h3>{title as string}</h3><p>{description as string}</p><CheckCircle2 size={16} className="value-check" /></article>)}</div></div></section>
  </main>;
}
