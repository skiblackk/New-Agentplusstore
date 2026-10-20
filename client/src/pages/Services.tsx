import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import PricingExperience from "@/components/PricingExperience";
import OrderDialog from "@/components/OrderDialog";
import type { PricingPackage } from "@/data/pricing";

export default function Services() {
  const [orderPackage, setOrderPackage] = useState<PricingPackage | null>(null);
  return <main className="subpage services-page">
    <nav className="subpage-nav container"><Link href="/" className="brand"><span className="brand-mark"><span /><span /><span /></span><span>agent<span className="brand-plus">plus</span></span></Link><Link href="/" className="subpage-back">← Back home</Link></nav>
    <section className="subpage-hero container"><div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> The AgentPlus catalog</div><h1>Digital systems for<br /><em>useful momentum.</em></h1><p>Choose a website, AI agent, custom software project, or ongoing support plan. Each package starts with a practical conversation about your business, customers, workflow, and next measurable outcome.</p><a className="button button-dark button-large" href="#catalog">Explore the catalog <ArrowUpRight size={18} /></a></section>
    <section className="service-grid-wrap" id="catalog"><div className="container"><PricingExperience onSelect={setOrderPackage} /></div></section>
    <section className="service-cta"><div className="container service-cta-inner"><div><div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Not sure where to begin?</div><h2>Start with the<br /><em>thing that repeats.</em></h2></div><div><p>AgentPlus will help you scope the first website, AI agent, or custom system worth building—without pretending every business needs the same package.</p><a className="button button-dark" href="mailto:hello@agentsplus.online">Talk to AgentPlus <ArrowUpRight size={17} /></a></div></div></section>
    {orderPackage && <OrderDialog packageData={orderPackage} close={() => setOrderPackage(null)} />}
  </main>;
}
