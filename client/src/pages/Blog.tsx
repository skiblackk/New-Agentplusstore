import type { FormEvent } from "react";
import { ArrowUpRight, CalendarDays, Clock3, Mail } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const posts = [
  ["Business Growth", "How AI agents can save your business 20 hours per week", "Discover how automated agents handle customer service, lead capture, and support—freeing your team to focus on growth.", "Feb 15, 2025", "5 min read"],
  ["Cost Savings", "The cost of manual customer service vs AI automation", "How automating customer interactions can reduce costs while improving response times and consistency.", "Feb 10, 2025", "6 min read"],
  ["Industry News", "Why African businesses are choosing AI automation", "A closer look at why teams across Kenya, Uganda, and Tanzania are adopting AI agents to scale faster.", "Feb 05, 2025", "7 min read"],
  ["Tutorials", "Getting started with WhatsApp business AI agents", "A practical guide to setting up your first WhatsApp AI agent and seeing results within 48 hours.", "Jan 28, 2025", "5 min read"],
  ["Strategy", "Lead capture best practices: converting more prospects", "Proven ways to improve your lead capture rate and qualify better prospects with AI-powered chatbots.", "Jan 20, 2025", "6 min read"],
  ["Customer Success", "Building customer loyalty with 24/7 AI support", "How instant, always-available support builds loyalty and increases repeat customers.", "Jan 15, 2025", "5 min read"],
];

export default function Blog() {
  const subscribe = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); toast.success("You’re on the list", { description: "We’ll send the next AgentPlus field note to your inbox." }); };
  return <main className="subpage blog-page">
    <nav className="subpage-nav container"><Link href="/" className="brand"><span className="brand-mark"><span /><span /><span /></span><span>agent<span className="brand-plus">plus</span></span></Link><Link href="/" className="subpage-back">← Back home</Link></nav>
    <section className="subpage-hero container blog-hero"><div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> The AgentPlus field notes</div><h1>Thoughts on<br /><em>better work.</em></h1><p>Practical tips, insights, and stories about AI automation for teams building with intent.</p></section>
    <section className="blog-list"><div className="container"><div className="blog-grid">{posts.map(([category, title, excerpt, date, readTime], index) => <article className={`blog-card ${index === 0 ? "blog-featured" : ""}`} key={title as string}><span className="blog-category">{category as string}</span><h2>{title as string}</h2><p>{excerpt as string}</p><div className="blog-meta"><span><CalendarDays size={13} /> {date as string}</span><span><Clock3 size={13} /> {readTime as string}</span></div><button onClick={() => toast("Article coming soon", { description: "We’re polishing this field note for publication." })}>Read article <ArrowUpRight size={15} /></button></article>)}</div></div></section>
    <section className="newsletter-section"><div className="container newsletter-inner"><div className="newsletter-icon"><Mail size={22} /></div><div><div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> One useful note at a time</div><h2>Stay a little<br /><em>ahead.</em></h2></div><form onSubmit={subscribe}><p>Get the latest insights on AI automation and business growth delivered to your inbox.</p><div className="newsletter-input"><input type="email" placeholder="you@company.com" required /><button className="button button-dark" type="submit">Subscribe <ArrowUpRight size={15} /></button></div></form></div></section>
  </main>;
}
