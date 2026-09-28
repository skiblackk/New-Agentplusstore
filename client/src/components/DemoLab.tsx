import { Fragment, type ReactNode, useState } from "react";
import { AlertTriangle, ArrowUpRight, ExternalLink, Globe2, MapPin, Search, Sparkles } from "lucide-react";
import { MapView } from "@/components/Map";

type Source = { title: string; url: string };
type Business = { name?: string; address?: string; rating?: number; userRatingsTotal?: number; types?: string[]; url?: string; placeId?: string; location?: { lat: number; lng: number } };
type Message = { role: "user" | "assistant"; content: string; sources?: Source[]; researchUsed?: boolean; systemNotice?: boolean };

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => part.startsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : <Fragment key={index}>{part}</Fragment>);
}

function formatResearch(content: string) {
  const lines = content.replace(/\\r/g, "").split("\\n");
  const blocks: React.ReactNode[] = [];
  let table: string[][] = [];

  const flushTable = () => {
    if (!table.length) return;
    blocks.push(<div className="research-table" key={`table-${blocks.length}`}>
      <div className="research-table-head">{table[0].map((cell, index) => <span key={index}>{renderInline(cell)}</span>)}</div>
      {table.slice(1).map((row, rowIndex) => <div className="research-table-row" key={rowIndex}>{row.map((cell, index) => <span key={index}>{renderInline(cell)}</span>)}</div>)}
    </div>);
    table = [];
  };

  lines.forEach((line, index) => {
    const clean = line.trim();
    if (clean.startsWith("|") && clean.endsWith("|")) {
      const cells = clean.slice(1, -1).split("|").map((cell) => cell.trim());
      if (!cells.every((cell) => /^:?-{2,}:?$/.test(cell))) table.push(cells);
      return;
    }
    flushTable();
    const heading = clean.replace(/^#{1,4}\\s*/, "").match(/^\\*\\*(.+?)\\*\\*$/);
    const bullet = clean.match(/^[-•]\\s+(.*)$/);
    if (!clean) blocks.push(<div key={`space-${index}`} className="research-spacer" />);
    else if (heading) blocks.push(<h4 key={index}>{heading[1]}</h4>);
    else if (bullet) blocks.push(<div key={index} className="research-bullet"><span />{renderInline(bullet[1])}</div>);
    else blocks.push(<p key={index}>{renderInline(clean)}</p>);
  });
  flushTable();
  return blocks;
}

const prompts = [
  "Research website development companies in Nairobi and show me how to compete.",
  "Assess AI customer support opportunities for growing businesses.",
  "Build a 30-day strategy to turn more website visitors into qualified leads.",
];

export default function DemoLab() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationQuery, setLocationQuery] = useState("Nairobi");
  const [businessType, setBusinessType] = useState("AI companies");
  const [nearby, setNearby] = useState<Business[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [aiOffline, setAiOffline] = useState(false);
  const searchNearby = async () => {
    setMapError("");
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=12&addressdetails=1&q=${encodeURIComponent(`${businessType} in ${locationQuery}`)}`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("OpenStreetMap search failed");
      const results = (await response.json()) as Array<{ place_id: number; display_name: string; lat: string; lon: string; type?: string }>;
      if (!results.length) {
        setMapError("No nearby businesses were found for that search. Try a broader area or category.");
        setNearby([]);
        return;
      }
      setNearby(results.map((place) => ({ name: place.display_name.split(",")[0], address: place.display_name, types: place.type ? [place.type] : [], placeId: String(place.place_id), url: `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}#map=18/${place.lat}/${place.lon}`, location: { lat: Number(place.lat), lng: Number(place.lon) } })));
    } catch {
      setMapError("OpenStreetMap search is unavailable right now. Please try again.");
      setNearby([]);
    }
  };

  const send = async (value = input) => {
    const content = value.trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const locationContext = nearby.length ? { query: `${businessType} in ${locationQuery}`, businesses: nearby } : undefined;
      const response = await fetch("/api/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "research", messages: next, locationContext }) });
      const data = (await response.json()) as { content?: string; sources?: Source[]; error?: string; maps?: { businesses?: Business[] }; researchUsed?: boolean; aiAvailable?: boolean };
      const notConfigured = data.aiAvailable === false;
      setAiOffline(notConfigured);
      if (notConfigured) {
        setMessages([...next, { role: "assistant", content: "This demo’s AI connection isn’t set up yet on this deployment, so it can’t research anything right now. Message the AgentPlus team on WhatsApp and they’ll walk you through it live.", systemNotice: true }]);
        return;
      }
      const mapSources = (data.maps?.businesses || []).filter((business) => business.url).map((business) => ({ title: `${business.name || "Nearby business"} on OpenStreetMap`, url: business.url as string }));
      setMessages([...next, { role: "assistant", content: data.content || data.error || "The demo is unavailable right now.", sources: [...(data.sources || []), ...mapSources], researchUsed: data.researchUsed }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "The demo could not connect. Please try again or talk to Aria below.", systemNotice: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="demo-lab section" id="demo">
      <div className="container">
        <div className="demo-header">
          <div>
            <div className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Research intelligence, free</div>
            <h2>See the market<br /><em>more clearly.</em></h2>
          </div>
          <p>The AgentPlus demo researches the live web and nearby businesses, then arranges the evidence into named sources, market signals, opportunities, and a practical strategy.</p>
        </div>
        <div className="demo-card">
          <div className="demo-toolbar">
            <div className="research-demo-label"><Search size={15} /><strong>Research Power</strong><span>live sources + local business signals</span></div>
            <span className="demo-free-badge">Free live demo</span>
          </div>
          <div className="geo-research">
            <div className="geo-heading">
              <div>
                <span className="geo-kicker"><MapPin size={13} /> Local market intelligence</span>
                <h3>See the opportunity around you.</h3>
                <p>Use OpenStreetMap data to inspect a local sample. The map and search stay live without a paid maps key; Aria uses returned places as observed signals, not proof of business quality.</p>
              </div>
              <Globe2 size={28} />
            </div>
            <div className="geo-controls">
              <input value={businessType} onChange={(event) => setBusinessType(event.target.value)} placeholder="Business type" aria-label="Business type" />
              <input value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} placeholder="Area or city" aria-label="Area or city" />
              <button className="button button-dark" onClick={searchNearby}><Search size={14} /> Find nearby businesses</button>
            </div>
            <div className="geo-map-wrap">
              <MapView className="demo-map" initialCenter={{ lat: -1.286389, lng: 36.817223 }} initialZoom={11} markers={nearby.flatMap((business) => business.location ? [{ ...business.location, name: business.name, address: business.address, url: business.url }] : [])} onMapReady={() => { setMapReady(true); setMapError(""); }} />
              {!mapReady && <div className="map-overlay">Loading map intelligence…</div>}
            </div>
            {mapError && <div className="geo-error"><AlertTriangle size={13} /> {mapError}</div>}
            {nearby.length > 0 && (
              <div className="nearby-list">
                <strong>{nearby.length} nearby businesses observed</strong>
                {nearby.slice(0, 6).map((business) => (
                  <a href={business.url} target="_blank" rel="noreferrer" key={business.placeId || business.name}>
                    <span><MapPin size={12} />{business.name}</span>
                    <small>{business.rating ? `${business.rating}★ · ${business.userRatingsTotal || 0} reviews` : "No public rating"} · {business.address || "Address unavailable"}</small>
                    <ExternalLink size={12} />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="demo-body">
            <div className="demo-prompts">
              {prompts.map((prompt) => (
                <button key={prompt} onClick={() => void send(prompt)}>{prompt}<ArrowUpRight size={14} /></button>
              ))}
              <button onClick={() => { setInput(`Assess the ${businessType} market around ${locationQuery}, identify gaps, and give me a practical strategy.`); }}>Assess this mapped market <ArrowUpRight size={14} /></button>
            </div>
            <div className="demo-thread">
              {messages.length ? messages.map((message, index) => (
                <article className={`demo-message ${message.role} ${message.systemNotice ? "system-notice" : ""}`} key={`${message.role}-${index}`}>
                  <span>{message.role === "user" ? "You" : message.systemNotice ? "Connection notice" : "AgentPlus"}</span>
                  <div className="research-answer">{message.role === "assistant" && !message.systemNotice ? formatResearch(message.content) : <p>{message.content}</p>}</div>
                  {message.role === "assistant" && !message.systemNotice && (
                    <div className={`research-status ${message.researchUsed ? "live" : "general"}`}>
                      {message.researchUsed ? "Verified with live web sources + OpenStreetMap signals" : "Live sources were unavailable — this answer is clearly marked as general guidance"}
                    </div>
                  )}
                  {message.sources?.length ? (
                    <div className="demo-sources">
                      <strong>Sources & map evidence</strong>
                      {message.sources.slice(0, 10).map((source) => (
                        <a href={source.url} target="_blank" rel="noreferrer" key={`${source.url}-${source.title}`}>{source.title || source.url}</a>
                      ))}
                    </div>
                  ) : null}
                </article>
              )) : (
                <div className="demo-empty"><Sparkles size={20} /><strong>Start with a business question.</strong><span>Ask about strategy, customers, competitors, marketing, or automate a local market scan above.</span></div>
              )}
              {loading && <div className="demo-message assistant"><span>AgentPlus</span><p className="demo-typing">Thinking with live sources and market signals…</p></div>}
              {aiOffline && (
                <div className="demo-message system-notice">
                  <span>Connection notice</span>
                  <p>This demo’s AI connection isn’t set up on this deployment yet, so live research can’t run right now. Message the AgentPlus team on WhatsApp and they’ll help directly.</p>
                  <a className="button button-dark" href="https://wa.me/254729053520" target="_blank" rel="noreferrer">Message us on WhatsApp</a>
                </div>
              )}
            </div>
          </div>
          <form className="demo-composer" onSubmit={(event) => { event.preventDefault(); void send(); }}>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about a market, area, competitor, or strategy…" />
            <button className="button button-dark" type="submit" disabled={loading}>Ask agent <ArrowUpRight size={15} /></button>
          </form>
        </div>
      </div>
    </section>
  );
}
