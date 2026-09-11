import { useState } from "react";
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
  const [selectedPost, setSelectedPost] = useState<(typeof posts)[number] | null>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const subscribe = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const response = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, source: "blog-newsletter" }) }); if (response.ok) { setSubscribed(true); setEmail(""); toast.success("You’re on the list", { description: "We’ll send the next AgentPlus field note to your inbox." }); } else toast.error("We couldn’t subscribe you", { description: "Please check the email and try again." }); };
  return <main className="subpage blog-page">
    <nav className="subpage-nav container"><Link href="/" className="brand"><span className="brand-mark"><span /><span /><span /></span><span>agent<span className="brand-plus">plus</span></span></Link><Link href="/" className="subpage-back">← Back home</Link></nav>
    <section className="subpage-hero container blog-hero"><div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> The AgentPlus field notes</div><h1>Thoughts on<br /><em>better work.</em></h1><p>Practical tips, insights, and stories about AI automation for teams building with intent.</p></section>
    <section className="blog-list"><div className="container"><div className="blog-grid">{posts.map(([category, title, excerpt, date, readTime], index) => <article className={`blog-card ${index === 0 ? "blog-featured" : ""}`} key={title as string}><span className="blog-category">{category as string}</span><h2>{title as string}</h2><p>{excerpt as string}</p><div className="blog-meta"><span><CalendarDays size={13} /> {date as string}</span><span><Clock3 size={13} /> {readTime as string}</span></div><button onClick={() => setSelectedPost([category, title, excerpt, date, readTime])}>Read article <ArrowUpRight size={15} /></button></article>)}</div></div></section>
    <section className="newsletter-section"><div className="container newsletter-inner"><div className="newsletter-icon"><Mail size={22} /></div><div><div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> One useful note at a time</div><h2>Stay a little<br /><em>ahead.</em></h2></div><form onSubmit={subscribe}><p>{subscribed ? "You’re subscribed. Watch your inbox for the next useful field note." : "Get the latest insights on AI automation and business growth delivered to your inbox."}</p><div className="newsletter-input"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required /><button className="button button-dark" type="submit">{subscribed ? "Subscribed" : "Subscribe"} <ArrowUpRight size={15} /></button></div></form></div></section>
    {selectedPost && <div className="article-overlay" role="dialog" aria-modal="true" aria-label={selectedPost[1] as string} onClick={() => setSelectedPost(null)}><article className="article-modal" onClick={(event) => event.stopPropagation()}><button className="article-close" onClick={() => setSelectedPost(null)} aria-label="Close article">×</button><span className="blog-category">{selectedPost[0] as string}</span><h2>{selectedPost[1] as string}</h2><div className="blog-meta"><span><CalendarDays size={13} /> {selectedPost[3] as string}</span><span><Clock3 size={13} /> {selectedPost[4] as string}</span></div><p className="article-lede">{selectedPost[2] as string}</p><p>Practical automation starts with one clear bottleneck. Map the handoffs, decide what “good” looks like, and give an AI teammate the context it needs to act consistently. The best systems do not replace your team—they give them more room for judgment, creativity, and better customer relationships.</p><p>Start small, measure the time saved, and expand the workflow only after the first useful win is repeatable. That is how AgentPlus helps ambitious teams move from “we should” to done.</p></article></div>}
  </main>;
}
