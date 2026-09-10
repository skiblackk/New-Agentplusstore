import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = createServer(app);
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "1mb" }));

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || "";
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const GROQ_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || "";
const redisEnabled = Boolean(REDIS_URL && REDIS_TOKEN);

type Order = Record<string, unknown> & { id: string; timestamp?: string; status?: string };
type Visitor = Record<string, unknown> & { id: string };
type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

const memory = {
  orders: [] as Order[],
  visitors: [] as Visitor[],
  atlas: [] as ChatMessage[],
  sessions: new Set<string>(),
};

async function redis(...args: Array<string | number>) {
  if (!redisEnabled) throw new Error("Redis is not configured");
  const response = await fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  const payload = (await response.json()) as { result?: unknown; error?: string };
  if (!response.ok || payload.error) throw new Error(payload.error || `Redis ${response.status}`);
  return payload.result;
}

async function readList<T>(key: string, fallback: T[]): Promise<T[]> {
  if (!redisEnabled) return fallback;
  try {
    const rows = (await redis("LRANGE", key, 0, key.includes("orders") ? 499 : 999)) as string[];
    return (rows || []).map((row) => JSON.parse(row) as T);
  } catch {
    return fallback;
  }
}

async function writeList<T extends { id: string }>(key: string, values: T[], limit: number) {
  if (!redisEnabled) return;
  await redis("DEL", key);
  for (const value of [...values].reverse()) await redis("LPUSH", key, JSON.stringify(value));
  await redis("LTRIM", key, 0, limit - 1);
}

async function getOrders() { return readList<Order>("ap:orders", memory.orders); }
async function getVisitors() { return readList<Visitor>("ap:visitors", memory.visitors); }
async function saveOrders(values: Order[]) { memory.orders = values.slice(0, 500); if (redisEnabled) await writeList("ap:orders", memory.orders, 500); }
async function saveVisitors(values: Visitor[]) { memory.visitors = values.slice(0, 1000); if (redisEnabled) await writeList("ap:visitors", memory.visitors, 1000); }

async function getAtlas() {
  if (!redisEnabled) return memory.atlas;
  try { const raw = await redis("GET", "ap:atlas:memory") as string | null; return raw ? JSON.parse(raw) as ChatMessage[] : []; } catch { return []; }
}
async function saveAtlas(messages: ChatMessage[]) {
  memory.atlas = messages.slice(-60);
  if (redisEnabled) await redis("SET", "ap:atlas:memory", JSON.stringify(memory.atlas));
}

async function createSession(token: string) {
  memory.sessions.add(token);
  if (redisEnabled) await redis("SET", `ap:session:${token}`, "1", "EX", 60 * 60 * 24 * 30);
}
async function validSession(token: string) {
  if (!token) return false;
  if (memory.sessions.has(token)) return true;
  if (!redisEnabled) return false;
  try { return (await redis("GET", `ap:session:${token}`)) === "1"; } catch { return false; }
}
async function deleteSession(token: string) {
  memory.sessions.delete(token);
  if (redisEnabled) await redis("DEL", `ap:session:${token}`);
}

async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!(await validSession(token))) return res.status(401).json({ error: "Unauthorized" });
  next();
}

const ARIA = `You are Aria, the warm and concise sales assistant for AgentPlus, a Nairobi-based company building practical AI agents for businesses. Packages: Starter $500 one-time, Professional $1,500 one-time, Enterprise custom pricing. Ask about the visitor's business and bottleneck before recommending. Never ask for contact details; the form handles that. If ready to buy, emit ORDER_READY:{"requirements":"...","suggestedPackage":"...","suggestedPrice":"...","packageReasoning":"..."} on its own line. Never expose implementation details or claim unsupported capabilities. For human help, share https://wa.me/254729053520.`;
const ATLAS = `You are Atlas, the private AgentPlus admin copilot. Be direct and operational. Analyze dashboard data, help with project strategy, write production-ready AI-agent prompts, and flag stale leads or follow-up opportunities. Packages are Starter $500 one-time, Professional $1,500 one-time, Enterprise custom. End strategic responses with a clear Next step.`;

async function callGroq(messages: ChatMessage[], mode: "client" | "admin", dashboardContext?: unknown, searchResults?: unknown) {
  if (!GROQ_KEY) return mode === "admin"
    ? "Atlas is ready, but the server-side GROQ_API_KEY is not configured yet. Add it to enable the private admin copilot.\n\n**Next step:** Configure the key in the server environment."
    : "I’m here to help you find the right AgentPlus starting point. Tell me what is taking your team too much time—customer replies, lead capture, support, or operations—and I’ll recommend a package.";
  const system = mode === "admin" ? `${ATLAS}\n\nLIVE DASHBOARD DATA:\n${JSON.stringify(dashboardContext || {}, null, 2)}\n\nRESEARCH:\n${JSON.stringify(searchResults || {}, null, 2)}` : ARIA;
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "system", content: system }, ...messages], max_tokens: mode === "admin" ? 1400 : 600, temperature: 0.72 }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw new Error(`Groq ${response.status}`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return payload.choices?.[0]?.message?.content || "I’m having a moment—please try WhatsApp for the fastest response.";
}

app.get("/api/status", (_req, res) => res.json({ ok: true, redis: redisEnabled, groq: Boolean(GROQ_KEY), adminPassword: Boolean(ADMIN_PASSWORD), storage: redisEnabled ? "upstash" : "memory-fallback" }));

app.post("/api/admin-auth", async (req, res) => {
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!ADMIN_PASSWORD) return res.status(503).json({ ok: false, error: "ADMIN_PASSWORD is not configured" });
  if (password !== ADMIN_PASSWORD) return res.json({ ok: false });
  const token = randomBytes(32).toString("hex");
  await createSession(token);
  res.json({ ok: true, token });
});
app.delete("/api/admin-auth", async (req, res) => { const token = typeof req.body?.token === "string" ? req.body.token : ""; if (token) await deleteSession(token); res.json({ ok: true }); });

app.get("/api/orders", requireAuth, async (_req, res) => res.json({ orders: await getOrders() }));
app.post("/api/inquiries", async (req, res) => { const inquiry = req.body as Order; if (!inquiry?.requirements) return res.status(400).json({ error: "Missing requirements" }); const order = { ...inquiry, id: inquiry.id || `ord_${Date.now()}_${randomBytes(3).toString("hex")}`, timestamp: inquiry.timestamp || new Date().toISOString(), status: inquiry.status || "new", source: inquiry.source || "chatbot" }; await saveOrders([order, ...(await getOrders()).filter((row) => row.id !== order.id)]); res.json({ ok: true, id: order.id }); });
app.post("/api/orders", requireAuth, async (req, res) => { const order = req.body as Order; if (!order?.id) return res.status(400).json({ error: "Missing id" }); const rows = await getOrders(); await saveOrders([order, ...rows.filter((row) => row.id !== order.id)]); res.json({ ok: true }); });
app.patch("/api/orders", requireAuth, async (req, res) => { const { id, ...fields } = req.body as { id?: string } & Record<string, unknown>; if (!id) return res.status(400).json({ error: "Missing id" }); const rows = await getOrders(); await saveOrders(rows.map((row) => row.id === id ? { ...row, ...fields } : row)); res.json({ ok: true }); });
app.delete("/api/orders", requireAuth, async (req, res) => { const id = req.body?.id as string; if (!id) return res.status(400).json({ error: "Missing id" }); await saveOrders((await getOrders()).filter((row) => row.id !== id)); res.json({ ok: true }); });

app.get("/api/visitors", requireAuth, async (_req, res) => res.json({ visitors: await getVisitors() }));
app.delete("/api/visitors", requireAuth, async (req, res) => { const id = req.body?.id as string; if (!id) return res.status(400).json({ error: "Missing id" }); await saveVisitors((await getVisitors()).filter((row) => row.id !== id)); res.json({ ok: true }); });
app.post("/api/track", async (req, res) => { const visitor = req.body?.visitor as Visitor; if (!visitor?.id) return res.status(400).json({ error: "Missing visitor" }); await saveVisitors([visitor, ...(await getVisitors()).filter((row) => row.id !== visitor.id)]); res.json({ ok: true }); });

app.get("/api/atlas-memory", requireAuth, async (_req, res) => res.json({ messages: await getAtlas() }));
app.post("/api/atlas-memory", requireAuth, async (req, res) => { await saveAtlas(Array.isArray(req.body?.messages) ? req.body.messages : []); res.json({ ok: true }); });
app.delete("/api/atlas-memory", requireAuth, async (_req, res) => { memory.atlas = []; if (redisEnabled) await redis("DEL", "ap:atlas:memory"); res.json({ ok: true }); });

app.post("/api/chat", async (req, res) => { try { const { messages, mode = "client", dashboardContext, searchResults } = req.body as { messages?: ChatMessage[]; mode?: "client" | "admin"; dashboardContext?: unknown; searchResults?: unknown }; if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ error: "No messages" }); res.json({ content: await callGroq(messages, mode, dashboardContext, searchResults) }); } catch (error) { res.status(500).json({ error: String(error) }); } });

app.post("/api/search", requireAuth, async (req, res) => { const query = typeof req.body?.query === "string" ? req.body.query : ""; const url = typeof req.body?.url === "string" ? req.body.url : ""; if (!query && !url) return res.status(400).json({ error: "Provide query or url" }); try { if (url) { const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; AgentPlus/1.0)" }, signal: AbortSignal.timeout(6000) }); const html = await response.text(); const content = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000); return res.json({ type: "scrape", content }); } const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) }); const html = await response.text(); const results = Array.from(html.matchAll(/<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)).slice(0, 6).map((match) => ({ url: match[1], title: match[2].replace(/<[^>]+>/g, "").trim() })); res.json({ type: "search", results }); } catch (error) { res.status(500).json({ error: String(error) }); } });

const staticPath = process.env.NODE_ENV === "production" ? path.resolve(__dirname, "public") : path.resolve(__dirname, "..", "dist", "public");
app.use(express.static(staticPath));
app.get("*", (_req, res) => res.sendFile(path.join(staticPath, "index.html")));

server.listen(port, () => console.log(`Server running on http://localhost:${port}/ (redis=${redisEnabled}, groq=${Boolean(GROQ_KEY)})`));
