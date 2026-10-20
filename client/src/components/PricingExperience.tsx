import { useState } from "react";
import { ArrowUpRight, Bot, Check, Code2, Globe2, Wrench } from "lucide-react";
import { maintenancePackages, pricingPackages, pricingTabs, type PricingCategory, type PricingPackage } from "@/data/pricing";

const categoryIcons = { websites: Globe2, agents: Bot, software: Code2 } satisfies Record<PricingCategory, typeof Globe2>;

export function PricingPackageCard({ packageData, onSelect, featured = false }: { packageData: PricingPackage; onSelect: (packageData: PricingPackage) => void; featured?: boolean }) {
  const Icon = categoryIcons[packageData.category];
  return <article className={`pricing-package-card ${featured ? "is-featured" : ""}`}>
    {featured && <span className="pricing-featured-badge">Recommended starting point</span>}
    <div className="pricing-card-top"><div className="pricing-card-icon"><Icon size={19} /></div><span>{packageData.audience}</span></div>
    <h3>{packageData.name}</h3>
    <p className="pricing-scope">{packageData.scopeNote}</p>
    <div className="pricing-price"><strong>{packageData.price}</strong><span>{packageData.priceNote}</span></div>
    <div className="pricing-kes">{packageData.kes} <small>planning equivalent · USD/KSh may vary</small></div>
    <ul>{packageData.features.map((feature) => <li key={feature}><Check size={15} /> {feature}</li>)}</ul>
    <button className={`button ${featured ? "button-lime" : "button-outline"}`} onClick={() => onSelect(packageData)}>{packageData.cta} <ArrowUpRight size={15} /></button>
  </article>;
}

export default function PricingExperience({ onSelect, compact = false }: { onSelect: (packageData: PricingPackage) => void; compact?: boolean }) {
  const [active, setActive] = useState<PricingCategory>("websites");
  const visible = pricingPackages.filter((item) => item.category === active);
  return <div className={`pricing-experience ${compact ? "is-compact" : ""}`}>
    <div className="pricing-tabs" role="tablist" aria-label="AgentPlus service categories">
      {pricingTabs.map((tab) => <button type="button" role="tab" aria-selected={active === tab.id} className={active === tab.id ? "active" : ""} onClick={() => setActive(tab.id)} key={tab.id}><span>{tab.label}</span><small>{tab.description}</small></button>)}
    </div>
    <div className="pricing-tab-heading"><div><span className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> AgentPlus packages</span><h3>{pricingTabs.find((tab) => tab.id === active)?.description}</h3></div><p>Prices are starting points for clear scope. Every project begins with a short consultation and written requirements.</p></div>
    <div className="pricing-package-grid">{visible.map((item, index) => <PricingPackageCard packageData={item} onSelect={onSelect} featured={active === "websites" && index === 1} key={item.id} />)}</div>
    {!compact && <section className="maintenance-pricing"><div><span className="eyebrow eyebrow-dark"><Wrench size={14} /> Ongoing care</span><h3>Keep the useful work moving.</h3><p>Optional support plans for websites, AI integrations, and automation systems. Scope and response expectations are agreed before activation.</p></div><div className="maintenance-grid">{maintenancePackages.map((item) => <article key={item.id}><strong>{item.name}</strong><p>{item.audience}</p><b>{item.price}</b><small>{item.kes} · approximate planning equivalent</small><button className="text-button" onClick={() => onSelect({ id: item.id, category: "software", name: item.name, audience: item.audience, price: item.price, priceNote: "Monthly support plan; scope agreed in consultation", kes: item.kes, scopeNote: "Support scope, response expectations, and included hours are agreed before activation.", features: ["Ongoing support", "Planned maintenance", "Scope agreed with AgentPlus"], cta: item.cta })}>{item.cta} <ArrowUpRight size={14} /></button></article>)}</div></section>}
  </div>;
}
