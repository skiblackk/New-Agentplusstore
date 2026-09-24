import { useRef, useState } from "react";
import { AlertTriangle, ArrowUpRight, ExternalLink, Globe2, MapPin, Search, Sparkles } from "lucide-react";
import { MapView } from "@/components/Map";

type Source = { title: string; url: string };
type Business = { name?: string; address?: string; rating?: number; userRatingsTotal?: number; types?: string[]; url?: string; placeId?: string; location?: { lat: number; lng: number } };
type Message = { role: "user" | "assistant"; content: string; sources?: Source[]; researchUsed?: boolean; systemNotice?: boolean };

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
  const mapRef = useRef<google.maps.Map | null>(null);

  const searchNearby = () => {
    if (!mapRef.current || !window.google?.maps?.places) {
      setMapError("The map is still loading. Try again in a moment.");
      return;
    }
    setMapError("");
    const service = new window.google.maps.places.PlacesService(mapRef.current);
    service.textSearch({ query: `${businessType} in ${locationQuery}` }, (results, status) => {
      if (status !== "OK" || !results?.length) {
        setMapError("No nearby businesses were found for that search. Try a broader area or category.");
        setNearby([]);
        return;
      }
      const businesses = results.slice(0, 12).map((place) => ({
        name: place.name,
        address: place.formatted_address,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        types: place.types,
        url: place.url,
        placeId: place.place_id,
        location: place.geometry?.location ? { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() } : undefined,
      }));
      setNearby(businesses);
      const bounds = new window.google.maps.LatLngBounds();
      businesses.forEach((business) => { if (business.location) bounds.extend(business.location); });
      if (!bounds.isEmpty()) mapRef.current?.fitBounds(bounds);
    });
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
      const mapSources = (data.maps?.businesses || []).filter((business) => business.url).map((business) => ({ title: `${business.name || "Nearby business"} on Google Maps`, url: business.url as string }));
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
                <p>Use Google Maps data to inspect a local sample. Google Earth links are available through the map’s satellite and street-view controls; Aria uses the returned places as observed signals, not proof of business quality.</p>
              </div>
              <Globe2 size={28} />
            </div>
            <div className="geo-controls">
              <input value={businessType} onChange={(event) => setBusinessType(event.target.value)} placeholder="Business type" aria-label="Business type" />
              <input value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} placeholder="Area or city" aria-label="Area or city" />
              <button className="button button-dark" onClick={searchNearby}><Search size={14} /> Find nearby businesses</button>
            </div>
            <div className="geo-map-wrap">
              <MapView className="demo-map" initialCenter={{ lat: -1.286389, lng: 36.817223 }} initialZoom={11} onMapReady={(map) => { mapRef.current = map; setMapReady(true); setMapError(""); }} onError={(message) => { setMapReady(true); setMapError(message); }} />
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
                  <p>{message.content}</p>
                  {message.role === "assistant" && !message.systemNotice && (
                    <div className={`research-status ${message.researchUsed ? "live" : "general"}`}>
                      {message.researchUsed ? "Answered using live web sources" : "Live web search was unavailable for this question — answered from general knowledge"}
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
