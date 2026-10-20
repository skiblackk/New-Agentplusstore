export type PricingCategory = "websites" | "agents" | "software";

export type PricingPackage = {
  id: string;
  category: PricingCategory;
  name: string;
  audience: string;
  price: string;
  priceNote: string;
  kes: string;
  scopeNote: string;
  features: string[];
  cta: string;
};

export const pricingPackages: PricingPackage[] = [
  {
    id: "starter-website",
    category: "websites",
    name: "Starter Website",
    audience: "For startups, entrepreneurs, and small businesses.",
    price: "Starting from $250",
    priceNote: "$250–$400 project estimate",
    kes: "≈ KSh 25,000",
    scopeNote: "Final price depends on pages, content, and launch requirements.",
    features: ["Up to 5 pages", "Responsive mobile and desktop design", "Professional layout and branding", "Contact form and WhatsApp integration", "Basic SEO setup", "Deployment and launch assistance"],
    cta: "Get Started",
  },
  {
    id: "business-website",
    category: "websites",
    name: "Business Website",
    audience: "For established businesses seeking a stronger online presence.",
    price: "Starting from $500",
    priceNote: "$500–$900 project estimate",
    kes: "≈ KSh 50,000",
    scopeNote: "Final price depends on page count, content, integrations, and animation depth.",
    features: ["Premium custom website design", "Up to 10 pages", "Professional animations and interactive elements", "SEO setup and analytics integration", "Lead capture and contact integrations", "Deployment and launch assistance"],
    cta: "Choose Business",
  },
  {
    id: "ai-integrated-website",
    category: "websites",
    name: "AI-Integrated Website",
    audience: "For businesses that want their websites to do more than display information.",
    price: "Starting from $1,000",
    priceNote: "$1,000–$2,000 project estimate",
    kes: "≈ KSh 100,000",
    scopeNote: "AI features, integrations, and dashboard scope are agreed before work begins.",
    features: ["Premium custom website", "AI-powered customer-care assistant", "Lead qualification and capture", "AI service recommendations", "Admin dashboard where included in scope", "Relevant business integrations", "Deployment and testing"],
    cta: "Build My AI Website",
  },
  {
    id: "ecommerce-website",
    category: "websites",
    name: "E-commerce Website",
    audience: "For businesses selling products online.",
    price: "Starting from $800",
    priceNote: "$800–$2,500+ project estimate",
    kes: "≈ KSh 80,000",
    scopeNote: "Payment providers, inventory depth, and catalogue size determine the final quote.",
    features: ["Product catalogue", "Shopping cart and checkout", "Order management", "M-Pesa or card payments where available", "Inventory functionality where required", "Responsive design", "Deployment and testing"],
    cta: "Start My Store",
  },
  {
    id: "starter-ai-agent",
    category: "agents",
    name: "Starter AI Agent",
    audience: "For businesses automating one defined task.",
    price: "From $750",
    priceNote: "Starting price; consultation required",
    kes: "≈ KSh 75,000",
    scopeNote: "One primary agent, one agreed workflow, and a basic integration.",
    features: ["One primary AI agent", "One agreed workflow", "Basic integration", "Deployment and testing", "Initial handover and documentation"],
    cta: "Get My AI Agent",
  },
  {
    id: "business-ai-agent",
    category: "agents",
    name: "Business AI Agent",
    audience: "For businesses needing more capable automation.",
    price: "From $1,500",
    priceNote: "Starting price; scope agreed in consultation",
    kes: "≈ KSh 150,000",
    scopeNote: "Multiple integrations and reporting are shaped around the agreed business workflow.",
    features: ["Business-specific AI workflows", "Multiple integrations as agreed", "Lead handling or customer support automation", "Reporting or dashboard functionality where required", "Testing and deployment"],
    cta: "Automate My Business",
  },
  {
    id: "premium-ai-agent",
    category: "agents",
    name: "Premium AI Agent",
    audience: "For more advanced business automation.",
    price: "From $3,000",
    priceNote: "Starting price; written scope required",
    kes: "≈ KSh 300,000",
    scopeNote: "Complex logic, integrations, monitoring, and reporting are quoted to scope.",
    features: ["Advanced AI workflows", "Multiple connected systems", "More complex business logic", "Monitoring and error handling", "Custom integrations and reporting according to scope"],
    cta: "Request Premium Agent",
  },
  {
    id: "custom-ai-systems",
    category: "agents",
    name: "Custom AI Systems",
    audience: "For complex, enterprise-oriented projects.",
    price: "$5,000–$25,000+",
    priceNote: "Custom quote based on requirements",
    kes: "≈ KSh 500,000–2,500,000+",
    scopeNote: "Complex projects require a consultation and written quote before implementation.",
    features: ["Multi-agent orchestration", "Advanced workflow automation", "Custom software integrations", "Business-specific dashboards", "Extensive testing and implementation", "Documentation and handover"],
    cta: "Request Custom Quote",
  },
  {
    id: "custom-web-applications",
    category: "software",
    name: "Custom Web Applications",
    audience: "For businesses that need custom software rather than a standard website.",
    price: "Custom quote based on requirements",
    priceNote: "$3,000–$15,000+ project estimate",
    kes: "≈ KSh 300,000–1,500,000+",
    scopeNote: "We quote after understanding the workflow, users, integrations, and delivery plan.",
    features: ["User accounts and permissions", "Business dashboards", "Database-backed workflows", "Reporting and analytics", "Third-party integrations", "AI automation and custom business logic"],
    cta: "Request Custom Quote",
  },
];

export const maintenancePackages = [
  { id: "website-care", name: "Website Care", audience: "Routine website maintenance and agreed support.", price: "$30–$75 / month", kes: "≈ KSh 3,000–7,500 / month", cta: "Discuss Website Care" },
  { id: "website-ai-support", name: "Website + AI Support", audience: "Websites with AI integrations and ongoing assistance.", price: "$100–$300 / month", kes: "≈ KSh 10,000–30,000 / month", cta: "Discuss AI Support" },
  { id: "advanced-automation-support", name: "Advanced Automation Support", audience: "Complex automation systems requiring ongoing technical support.", price: "From $300 / month", kes: "≈ KSh 30,000 / month", cta: "Discuss Automation Support" },
] as const;

export const pricingTabs = [
  { id: "websites" as const, label: "Websites", description: "Conversion-ready websites for a clearer digital presence." },
  { id: "agents" as const, label: "AI Agents", description: "Focused AI systems that take useful work off your team’s plate." },
  { id: "software" as const, label: "Custom Software", description: "Business applications for workflows that do not fit a template." },
];

export function packageForId(id: string) {
  return pricingPackages.find((item) => item.id === id) || pricingPackages[0];
}
