import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, Mail, Search } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

type Article = { id: string; category: string; title: string; excerpt: string; body: string; date: string; readTime: string; createdAt?: string };
const fallbackArticles: Article[] = [
  ["Business Growth", "How AI agents can save your business 20 hours per week", "Discover how automated agents handle customer service, lead capture, and support—freeing your team to focus on growth.", "Feb 15, 2025", "5 min read"],
  ["Cost Savings", "The cost of manual customer service vs AI automation", "How automating customer interactions can reduce costs while improving response times and consistency.", "Feb 10, 2025", "6 min read"],
  ["Industry News", "Why African businesses are choosing AI automation", "A closer look at why teams across Kenya, Uganda, and Tanzania are adopting AI agents to scale faster.", "Feb 05, 2025", "7 min read"],
  ["Tutorials", "Getting started with WhatsApp business AI agents", "A practical guide to setting up your first WhatsApp AI agent and seeing results within 48 hours.", "Jan 28, 2025", "5 min read"],
  ["Strategy", "Lead capture best practices: converting more prospects", "Proven ways to improve your lead capture rate and qualify better prospects with AI-powered chatbots.", "Jan 20, 2025", "6 min read"],
  ["Customer Success", "Building customer loyalty with 24/7 AI support", "How instant, always-available support builds loyalty and increases repeat customers.", "Jan 15, 2025", "5 min read"],
].map(([category, title, excerpt, date, readTime], index) => ({ id: `fallback-${index}`, category, title, excerpt, body: "Practical automation starts with one clear bottleneck. Map the handoffs, decide what good looks like, and give an AI teammate the context it needs to act consistently. Start small, measure the time saved, and expand only after the first useful win is repeatable.", date, readTime }));

export default function Blog() {
  const [articles, setArticles] = useState<Article[]>(fallbackArticles);
  const [selectedPost, setSelectedPost] = useState<Article | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const pageSize = 3;
  useEffect(() => { fetch("/api/articles").then((response) => response.json()).then((data: { articles?: Article[] }) => { if (data.articles?.length) setArticles(data.articles); }).catch(() => undefined); }, []);
  const categories = useMemo(() => ["All", ...Array.from(new Set(articles.map((article) => article.category)))], [articles]);
  const filtered = useMemo(() => articles.filter((article) => (category === "All" || article.category === category) && `${article.title} ${article.excerpt} ${article.category}`.toLowerCase().includes(query.toLowerCase())), [articles, category, query]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const updateQuery = (value: string) => { setQuery(value); setPage(1); };
  const updateCategory = (value: string) => { setCategory(value); setPage(1); };
  const subscribe = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const response = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, source: "blog-newsletter" }) }); if (response.ok) { setSubscribed(true); setEmail(""); toast.success("You’re on the list", { description: "We’ll send the next AgentPlus field note to your inbox." }); } else toast.error("We couldn’t subscribe you", { description: "Please check the email and try again." }); };
  return <main className="subpage blog-page">
    <nav className="subpage-nav container"><Link href="/" className="brand"><img src="/agentplus-logo.png" alt="" aria-hidden="true" className="brand-mark-img" /><span>agent<span className="brand-plus">plus</span></span></Link><Link href="/" className="subpage-back">← Back home</Link></nav>
    <section className="subpage-hero container blog-hero"><div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> The AgentPlus field notes</div><h1>Thoughts on<br /><em>better work.</em></h1><p>Practical tips, insights, and stories about AI automation for teams building with intent.</p></section>
    <section className="blog-list"><div className="container"><div className="blog-toolbar"><div className="blog-search"><Search size={16} /><input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Search field notes" aria-label="Search articles" /></div><div className="blog-tags" aria-label="Filter by category">{categories.map((item) => <button className={category === item ? "active" : ""} onClick={() => updateCategory(item)} key={item}>{item}</button>)}</div></div>{visible.length ? <div className="blog-grid">{visible.map((article, index) => <article className={`blog-card ${index === 0 && page === 1 ? "blog-featured" : ""}`} key={article.id}><span className="blog-category">{article.category}</span><h2>{article.title}</h2><p>{article.excerpt}</p><div className="blog-meta"><span><CalendarDays size={13} /> {article.date}</span><span><Clock3 size={13} /> {article.readTime}</span></div><button onClick={() => setSelectedPost(article)}>Read article <ArrowUpRight size={15} /></button></article>)}</div> : <div className="blog-empty">No field notes match that search yet.</div>}<div className="blog-pagination"><span>{filtered.length} article{filtered.length === 1 ? "" : "s"}</span><div><button disabled={page === 1} onClick={() => setPage((value) => value - 1)} aria-label="Previous page"><ChevronLeft size={15} /></button><strong>{page} / {pageCount}</strong><button disabled={page === pageCount} onClick={() => setPage((value) => value + 1)} aria-label="Next page"><ChevronRight size={15} /></button></div></div></div></section>
    <section className="newsletter-section"><div className="container newsletter-inner"><div className="newsletter-icon"><Mail size={22} /></div><div><div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> One useful note at a time</div><h2>Stay a little<br /><em>ahead.</em></h2></div><form onSubmit={subscribe}><p>{subscribed ? "You’re subscribed. Watch your inbox for the next useful field note." : "Get the latest insights on AI automation and business growth delivered to your inbox."}</p><div className="newsletter-input"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required /><button className="button button-dark" type="submit">{subscribed ? "Subscribed" : "Subscribe"} <ArrowUpRight size={15} /></button></div></form></div></section>
    {selectedPost && <div className="article-overlay" role="dialog" aria-modal="true" aria-label={selectedPost.title} onClick={() => setSelectedPost(null)}><article className="article-modal" onClick={(event) => event.stopPropagation()}><button className="article-close" onClick={() => setSelectedPost(null)} aria-label="Close article">×</button><span className="blog-category">{selectedPost.category}</span><h2>{selectedPost.title}</h2><div className="blog-meta"><span><CalendarDays size={13} /> {selectedPost.date}</span><span><Clock3 size={13} /> {selectedPost.readTime}</span></div><p className="article-lede">{selectedPost.excerpt}</p><p>{selectedPost.body}</p></article></div>}
  </main>;
}
