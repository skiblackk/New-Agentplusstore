import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowUpRight, Check, X } from "lucide-react";
import { toast } from "sonner";
import type { PricingPackage } from "@/data/pricing";

const requirements = ["Customer Support", "Sales", "Lead Generation", "Competitor Research", "Market Research", "Marketing", "Booking/Appointments", "FAQ", "Product Recommendations", "Other"];

export default function OrderDialog({ packageData, close }: { packageData: PricingPackage; close: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const isWebsite = packageData.category === "websites";
  const isMaintenance = packageData.id.includes("support") || packageData.id === "website-care";
  const projectLabel = isMaintenance ? "support plan" : isWebsite ? "website project" : packageData.category === "agents" ? "AI agent project" : "software project";
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams(window.location.search);
    const body = {
      visitorId: localStorage.getItem("agentplus_visitor_id") || undefined,
      customerName: String(form.get("name") || ""), companyName: String(form.get("company") || ""), customerEmail: String(form.get("email") || ""), customerPhone: String(form.get("phone") || ""), website: String(form.get("website") || ""), industry: String(form.get("industry") || ""), country: String(form.get("country") || ""),
      requirements: `Selected package: ${packageData.name}\nWhat we do: ${form.get("business")}\nCustomers/users: ${form.get("customers")}\nProblems to solve: ${form.get("problems")}\nDesired outcome: ${form.get("capabilities")}\nRequirements: ${selected.join(", ")}\nAdditional: ${form.get("additional")}`,
      suggestedPackage: packageData.name, suggestedPrice: packageData.price, packageReasoning: `${packageData.category} ${projectLabel}; starting price shown on the public AgentPlus catalog.`, source: params.get("utm_source") || "pricing-form", campaign: params.get("utm_campaign") || undefined, status: "new",
    };
    try {
      const response = await fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (response.ok) setSent(true); else toast.error("We couldn't submit the request", { description: "Please try WhatsApp or email us directly." });
    } catch { toast.error("We couldn't submit the request", { description: "Please try WhatsApp or email us directly." }); }
    setSending(false);
  };
  return <div className="order-backdrop" role="dialog" aria-modal="true" aria-label={`${packageData.name} inquiry form`}><div className="order-dialog"><button className="order-close" onClick={close} aria-label="Close"><X size={18} /></button>{sent ? <div className="order-success"><div className="order-success-icon"><Check size={22} /></div><span className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Request received</span><h2>Your next step is in motion.</h2><p>AgentPlus has received your {packageData.name} request. We’ll review the requirements and contact you within 24 hours.</p><button className="button button-dark" onClick={close}>Back to AgentPlus <ArrowUpRight size={15} /></button></div> : <><div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Build with AgentPlus</div><h2>{packageData.name}</h2><div className="order-price">{packageData.price} <span>{packageData.priceNote}</span></div><p className="order-scope-note">{packageData.scopeNote}</p><form className="order-form" onSubmit={submit}><div className="order-grid"><input name="name" required placeholder="Your name" /><input name="company" required placeholder="Company name" /><input name="email" required type="email" placeholder="Work email" /><input name="phone" required placeholder="Phone / WhatsApp" /><input name="website" placeholder="Company website" /><input name="industry" required placeholder="Industry" /><input name="country" required placeholder="Country" /></div><textarea name="business" required placeholder="What does your company do?" /><textarea name="customers" required placeholder="Who are your customers or users?" /><textarea name="problems" required placeholder={`What should this ${projectLabel} help you solve?`} /><textarea name="capabilities" required placeholder="What should the final system be able to do?" /><div className="requirement-picker"><span>Useful requirements</span><div>{requirements.map((item) => <button type="button" className={selected.includes(item) ? "active" : ""} key={item} onClick={() => setSelected(selected.includes(item) ? selected.filter((value) => value !== item) : [...selected, item])}>{selected.includes(item) && <Check size={12} />}{item}</button>)}</div></div><textarea name="additional" placeholder="Tell us anything else you want AgentPlus to consider." /><button className="button button-dark" type="submit" disabled={sending}>{sending ? "Submitting request…" : `${packageData.cta} · ${packageData.price}`} <ArrowUpRight size={15} /></button><small>Submitting an inquiry starts a consultation. Payment is requested only after requirements are confirmed in writing.</small></form></>}</div></div>;
}
