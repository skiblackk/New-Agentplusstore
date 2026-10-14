import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { createHash, createHmac, randomBytes } from "crypto";
import type { Response } from "express";
import webpush from "web-push";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = Number(process.env.PORT || 3000);
const app = express();
const httpServer = createServer(app);

app.use((req, res, next) => { const origin = req.headers.origin; if (origin) res.setHeader("Access-Control-Allow-Origin", origin); res.setHeader("Vary", "Origin"); res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization"); res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS"); if (req.method === "OPTIONS") return res.sendStatus(204); next(); });
app.use(express.json({ limit: "1mb" }));

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || "";
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const GROQ_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || "";
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const pushEnabled = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
if (pushEnabled) webpush.setVapidDetails("mailto:hello@agentplus.store", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);
const redisEnabled = Boolean(REDIS_URL && REDIS_TOKEN);
const backendMode = supabaseEnabled ? "supabase" : redisEnabled ? "redis" : "memory-fallback";

type Order = Record<string, unknown> & { id: string; timestamp?: string; status?: string };
type Visitor = Record<string, unknown> & { id: string };
type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

type SupabaseRow = { id?: string | number; payload?: Order | Visitor | WhatsAppClick; messages?: ChatMessage[]; token?: string; expires_at?: string };
type WhatsAppClick = { id: string; timestamp: string; service: string; visitorId?: string; page?: string; device?: string; referrer?: string; campaign?: string; source?: string; medium?: string; content?: string };
type Subscriber = { id: string; email: string; timestamp: string; source?: string };
type Article = { id: string; category: string; title: string; excerpt: string; body: string; date: string; readTime: string; createdAt: string; updatedAt?: string };
type PushSubscription = { endpoint: string; expirationTime?: number | null; keys: { p256dh: string; auth: string } };
type NotificationPreferences = { leadSources: string[]; quietHoursEnabled: boolean; quietStart: string; quietEnd: string; timezone: string };
type NotificationRecord = { id: string; leadId: string; title: string; body: string; source?: string; channel: "browser"; status: "sent" | "skipped" | "failed"; timestamp: string };
type PaymentConfig = { enabled: boolean; binanceId: string; walletAddress: string; network: string; instructions: string };
type Agent = { id: string; name: string; customerEmail?: string; company?: string; website?: string; instructions: string; knowledge: string; tone: string; tools: string[]; researchLevel: string; status: string; createdAt: string };
type KnowledgeItem = { id: string; agentId: string; title: string; content: string; source?: string; createdAt: string };
type Deployment = { id: string; agentId: string; website: string; status: string; publicKey: string; embedCode: string; createdAt: string };
type AnalyticsEvent = { id: string; sessionId?: string; eventName: string; service?: string; page?: string; source?: string; referrer?: string; utmSource?: string; utmMedium?: string; utmCampaign?: string; utmContent?: string; utmTerm?: string; deviceType?: string; browser?: string; os?: string; country?: string; metadata?: Record<string, unknown>; createdAt: string };
type ResearchReport = { id: string; title: string; query: string; market?: string; summary: string; strategy?: string; sources: Array<{ title: string; url: string }>; confidence: "high" | "medium" | "low"; createdAt: string; updatedAt?: string };
const defaultNotificationPreferences: NotificationPreferences = { leadSources: ["all"], quietHoursEnabled: false, quietStart: "22:00", quietEnd: "07:00", timezone: "Africa/Nairobi" };
const defaultPaymentConfig: PaymentConfig = { enabled: false, binanceId: "", walletAddress: "", network: "TRC20", instructions: "Send the exact USDT amount to the configured wallet, then submit your transaction hash for verification." };
const memory = { agents: [] as Agent[], knowledge: [] as KnowledgeItem[], deployments: [] as Deployment[], reports: [] as ResearchReport[], orders: [] as Order[], visitors: [] as Visitor[], whatsappClicks: [] as WhatsAppClick[], subscribers: [] as Subscriber[], articles: [] as Article[], pushSubscriptions: [] as Array<{ id: string; payload: PushSubscription; createdAt: string }>, notifications: [] as NotificationRecord[], analyticsEvents: [] as AnalyticsEvent[], notificationPreferences: defaultNotificationPreferences, paymentConfig: defaultPaymentConfig, atlas: [] as ChatMessage[], sessions: new Set<string>() };
const leadEventClients = new Set<Response>();

function broadcastLead(order: Order) {
  const payload = `event: lead\ndata: ${JSON.stringify(order)}\n\n`;
  leadEventClients.forEach((client) => {
    try { client.write(payload); } catch { leadEventClients.delete(client); }
  });
}

async function supabaseRequest<T = SupabaseRow>(tablePath: string, init: RequestInit = {}) {
  if (!supabaseEnabled) throw new Error("Supabase is not configured");
  const headers = new Headers(init.headers);
  headers.set("apikey", SUPABASE_KEY);
  headers.set("Authorization", `Bearer ${SUPABASE_KEY}`);
  headers.set("Content-Type", "application/json");
  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${tablePath}`, { ...init, headers });
  if (!response.ok) throw new Error(`Supabase ${response.status}`);
  const text = await response.text();
  return (text ? JSON.parse(text) : []) as T;
}

async function redis(...args: Array<string | number>) {
  if (!redisEnabled) throw new Error("Redis is not configured");
  const response = await fetch(REDIS_URL, { method: "POST", headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify(args) });
  const payload = await response.json() as { result?: unknown; error?: string };
  if (!response.ok || payload.error) throw new Error(payload.error || `Redis ${response.status}`);
  return payload.result;
}


async function getCollection<T extends { id: string }>(table: string, memoryRows: T[]) { if (supabaseEnabled) { try { const rows = await supabaseRequest<Array<{ payload: T }>>(`${table}?select=payload&order=created_at.desc&limit=500`); return rows.map((row) => row.payload); } catch { /* schema may not be applied yet */ } } return memoryRows; }
async function saveCollectionItem<T extends { id: string }>(table: string, item: T, memoryRows: T[]) { const next = [item, ...memoryRows.filter((row) => row.id !== item.id)].slice(0, 500); if (table === "agentplus_agents") memory.agents = next as unknown as Agent[]; if (table === "agentplus_knowledge") memory.knowledge = next as unknown as KnowledgeItem[]; if (table === "agentplus_deployments") memory.deployments = next as unknown as Deployment[]; if (table === "agentplus_research_reports") memory.reports = next as unknown as ResearchReport[]; if (supabaseEnabled) { try { await supabaseRequest(table, { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: item.id, payload: item, created_at: (item as { createdAt?: string }).createdAt || new Date().toISOString() }) }); } catch { console.warn(`${table} is not ready; using fallback storage.`); } } }
async function deleteCollectionItem(table: string, id: string) { if (table === "agentplus_agents") memory.agents = memory.agents.filter((row) => row.id !== id); if (table === "agentplus_knowledge") memory.knowledge = memory.knowledge.filter((row) => row.id !== id); if (table === "agentplus_deployments") memory.deployments = memory.deployments.filter((row) => row.id !== id); if (table === "agentplus_research_reports") memory.reports = memory.reports.filter((row) => row.id !== id); if (supabaseEnabled) { try { await supabaseRequest(`${table}?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" }); } catch { /* fallback */ } } }
async function getOrders() {
  if (supabaseEnabled) { try { const rows = await supabaseRequest<Array<{ payload: Order }>>("agentplus_orders?select=payload&order=created_at.desc&limit=500"); return rows.map((row) => row.payload); } catch { /* schema may not be applied yet */ } }
  if (redisEnabled) { try { const rows = await redis("LRANGE", "ap:orders", 0, 499) as string[]; return (rows || []).map((row) => JSON.parse(row) as Order); } catch { /* fallback */ } }
  return memory.orders;
}
async function persistOrder(order: Order) {
  memory.orders = [order, ...memory.orders.filter((row) => row.id !== order.id)].slice(0, 500);
  if (supabaseEnabled) { try { await supabaseRequest("agentplus_orders", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: order.id, payload: order, created_at: order.timestamp || new Date().toISOString() }) }); return; } catch { console.warn("Supabase orders table is not ready; using fallback storage."); } }
  if (redisEnabled) { const rows = await getOrders(); await redis("DEL", "ap:orders"); for (const row of [order, ...rows.filter((value) => value.id !== order.id)].slice(0, 500).reverse()) await redis("LPUSH", "ap:orders", JSON.stringify(row)); }
}
async function deleteOrder(id: string) {
  memory.orders = memory.orders.filter((row) => row.id !== id);
  if (supabaseEnabled) { await supabaseRequest(`agentplus_orders?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" }); return; }
  if (redisEnabled) { const rows = (await getOrders()).filter((row) => row.id !== id); await redis("DEL", "ap:orders"); for (const row of rows.reverse()) await redis("LPUSH", "ap:orders", JSON.stringify(row)); }
}

async function getVisitors() {
  if (supabaseEnabled) { try { const rows = await supabaseRequest<Array<{ payload: Visitor }>>("agentplus_visitors?select=payload&order=created_at.desc&limit=1000"); return rows.map((row) => row.payload); } catch { /* schema may not be applied yet */ } }
  if (redisEnabled) { try { const rows = await redis("LRANGE", "ap:visitors", 0, 999) as string[]; return (rows || []).map((row) => JSON.parse(row) as Visitor); } catch { /* fallback */ } }
  return memory.visitors;
}
async function persistVisitor(visitor: Visitor) {
  memory.visitors = [visitor, ...memory.visitors.filter((row) => row.id !== visitor.id)].slice(0, 1000);
  if (supabaseEnabled) { try { await supabaseRequest("agentplus_visitors", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: visitor.id, payload: visitor, created_at: (visitor.timestamp as string) || new Date().toISOString() }) }); return; } catch { console.warn("Supabase visitors table is not ready; using fallback storage."); } }
  if (redisEnabled) { const rows = await getVisitors(); await redis("DEL", "ap:visitors"); for (const row of [visitor, ...rows.filter((value) => value.id !== visitor.id)].slice(0, 1000).reverse()) await redis("LPUSH", "ap:visitors", JSON.stringify(row)); }
}
async function deleteVisitor(id: string) {
  memory.visitors = memory.visitors.filter((row) => row.id !== id);
  if (supabaseEnabled) { await supabaseRequest(`agentplus_visitors?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" }); return; }
  if (redisEnabled) { const rows = (await getVisitors()).filter((row) => row.id !== id); await redis("DEL", "ap:visitors"); for (const row of rows.reverse()) await redis("LPUSH", "ap:visitors", JSON.stringify(row)); }
}

async function getAnalyticsEvents() {
  if (supabaseEnabled) { try { const rows = await supabaseRequest<Array<{ payload: AnalyticsEvent }>>("agentplus_analytics_events?select=payload&order=created_at.desc&limit=10000"); return rows.map((row) => row.payload); } catch { /* migration may not be applied yet */ } }
  return memory.analyticsEvents;
}
async function persistAnalyticsEvent(event: AnalyticsEvent) {
  memory.analyticsEvents = [event, ...memory.analyticsEvents.filter((row) => row.id !== event.id)].slice(0, 10000);
  if (supabaseEnabled) { try { await supabaseRequest("agentplus_analytics_events", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: event.id, payload: event, created_at: event.createdAt }) }); } catch { console.warn("Supabase analytics table is not ready; using fallback storage."); } }
}
function sourceLabel(value: unknown, referrer: unknown) { const source = String(value || "").trim().toLowerCase(); if (source) return source.replace(/[^a-z0-9_-]/g, ""); const ref = String(referrer || "").toLowerCase(); if (!ref) return "Direct"; if (ref.includes("google.")) return "Google"; if (ref.includes("facebook.")) return "Facebook"; if (ref.includes("instagram.")) return "Instagram"; if (ref.includes("tiktok.")) return "TikTok"; if (ref.includes("linkedin.")) return "LinkedIn"; if (ref.includes("wa.me") || ref.includes("whatsapp")) return "WhatsApp"; return "Other websites"; }
async function analyticsSnapshot() {
  const [events, orders, visitors] = await Promise.all([getAnalyticsEvents(), getOrders(), getVisitors()]);
  const now = Date.now(); const start = new Date(now - 30 * 86400000);
  const recentEvents = events.filter((event) => new Date(event.createdAt).getTime() >= start.getTime());
  const recentVisitors = visitors.filter((visitor) => new Date(String(visitor.timestamp || 0)).getTime() >= start.getTime());
  const recentOrders = orders.filter((order) => new Date(String(order.timestamp || 0)).getTime() >= start.getTime());
  const countBy = (items: Array<{ [key: string]: unknown }>, key: string) => Object.entries(items.reduce<Record<string, number>>((acc, item) => { const value = String(item[key] || "Unknown"); acc[value] = (acc[value] || 0) + 1; return acc; }, {})).sort((a,b) => b[1]-a[1]).slice(0, 12);
  const eventCount = (name: string) => recentEvents.filter((event) => event.eventName === name).length;
  const serviceViews = countBy(recentEvents.filter((event) => event.eventName === "service_viewed"), "service");
  const serviceLeads = countBy(recentOrders, "service");
  return { period: "30d", visitors: { today: visitors.filter((v) => String(v.timestamp || "").slice(0,10) === new Date().toISOString().slice(0,10)).length, month: recentVisitors.length, total: visitors.length }, pageViews: eventCount("page_view"), leads: recentOrders.length, orders: recentOrders.length, conversionRate: recentVisitors.length ? Math.round((recentOrders.length / recentVisitors.length) * 10000) / 100 : 0, trafficSources: countBy(recentEvents.filter((event) => event.eventName === "page_view"), "source"), devices: countBy(recentEvents.filter((event) => event.eventName === "page_view"), "deviceType"), countries: countBy(recentEvents.filter((event) => event.eventName === "page_view"), "country"), servicePerformance: serviceViews.map(([service, views]) => ({ service, views, leads: serviceLeads.find(([name]) => name === service)?.[1] || 0, orders: serviceLeads.find(([name]) => name === service)?.[1] || 0 })), funnel: { visitors: recentVisitors.length, serviceViews: eventCount("service_viewed"), ariaConversations: eventCount("aria_started"), quoteRequests: eventCount("quote_requested"), ordersStarted: eventCount("order_started"), ordersSubmitted: eventCount("order_submitted"), won: recentOrders.filter((order) => ["won", "paid", "completed", "closed"].includes(String(order.status))).length }, recentEvents: recentEvents.slice(0, 100) };
}

async function getWhatsappClicks() {
  if (supabaseEnabled) { try { const rows = await supabaseRequest<Array<{ payload: WhatsAppClick }>>("agentplus_whatsapp_clicks?select=payload&order=created_at.desc&limit=5000"); return rows.map((row) => row.payload); } catch { /* schema may not be applied yet */ } }
  return memory.whatsappClicks;
}
async function persistWhatsappClick(click: WhatsAppClick) {
  memory.whatsappClicks = [click, ...memory.whatsappClicks].slice(0, 5000);
  if (supabaseEnabled) { try { await supabaseRequest("agentplus_whatsapp_clicks", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ id: click.id, payload: click, created_at: click.timestamp }) }); } catch { console.warn("Supabase WhatsApp clicks table is not ready; using fallback storage."); } }
}

async function getSettings<T>(key: string, fallback: T): Promise<T> {
  if (supabaseEnabled) { try { const rows = await supabaseRequest<Array<{ payload: T }>>(`agentplus_settings?id=eq.${encodeURIComponent(key)}&select=payload&limit=1`); return rows[0]?.payload || fallback; } catch { /* schema may not be applied yet */ } }
  return key === "notification_preferences" ? memory.notificationPreferences as T : memory.paymentConfig as T;
}
async function saveSettings<T>(key: string, payload: T) {
  if (key === "notification_preferences") memory.notificationPreferences = payload as NotificationPreferences; else memory.paymentConfig = payload as PaymentConfig;
  if (supabaseEnabled) { try { await supabaseRequest("agentplus_settings", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: key, payload, updated_at: new Date().toISOString() }) }); } catch { console.warn("Supabase settings table is not ready; using fallback storage."); } }
}
async function getNotificationHistory() {
  if (supabaseEnabled) { try { const rows = await supabaseRequest<Array<{ payload: NotificationRecord }>>("agentplus_notification_history?select=payload&order=created_at.desc&limit=100"); return rows.map((row) => row.payload); } catch { /* schema may not be applied yet */ } }
  return memory.notifications;
}
async function saveNotificationRecord(record: NotificationRecord) {
  memory.notifications = [record, ...memory.notifications].slice(0, 100);
  if (supabaseEnabled) { try { await supabaseRequest("agentplus_notification_history", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: record.id, payload: record, created_at: record.timestamp }) }); } catch { /* fallback */ } }
}
function isQuietHours(preferences: NotificationPreferences) {
  if (!preferences.quietHoursEnabled) return false;
  const now = new Intl.DateTimeFormat("en-GB", { timeZone: preferences.timezone || "Africa/Nairobi", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
  const current = Number(now.replace(":", "")); const start = Number(preferences.quietStart.replace(":", "")); const end = Number(preferences.quietEnd.replace(":", ""));
  return start <= end ? current >= start && current < end : current >= start || current < end;
}
async function getPushSubscriptions() {
  if (supabaseEnabled) { try { const rows = await supabaseRequest<Array<{ id: string; payload: PushSubscription }>>("agentplus_push_subscriptions?select=id,payload&limit=500"); return rows.map((row) => ({ id: row.id, payload: row.payload })); } catch { /* schema may not be applied yet */ } }
  return memory.pushSubscriptions;
}
async function persistPushSubscription(subscription: PushSubscription) {
  const id = createHash("sha256").update(subscription.endpoint).digest("hex").slice(0, 32);
  const row = { id, payload: subscription, createdAt: new Date().toISOString() };
  memory.pushSubscriptions = [row, ...memory.pushSubscriptions.filter((value) => value.id !== id)].slice(0, 500);
  if (supabaseEnabled) { try { await supabaseRequest("agentplus_push_subscriptions", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id, payload: subscription, created_at: row.createdAt }) }); return id; } catch { console.warn("Supabase push subscriptions table is not ready; using fallback storage."); } }
  return id;
}
async function deletePushSubscription(id: string) {
  memory.pushSubscriptions = memory.pushSubscriptions.filter((value) => value.id !== id);
  if (supabaseEnabled) { try { await supabaseRequest(`agentplus_push_subscriptions?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" }); } catch { /* fallback */ } }
}
async function sendLeadPush(order: Order) {
  const preferences = await getSettings("notification_preferences", defaultNotificationPreferences);
  const sourceAllowed = preferences.leadSources.includes("all") || preferences.leadSources.includes(String(order.source || "chatbot"));
  const title = "New AgentPlus lead"; const body = `${order.customerName || order.customerEmail || "A new inquiry"} is ready for follow-up.`;
  const base = { leadId: order.id, title, body, source: String(order.source || "chatbot"), channel: "browser" as const, timestamp: new Date().toISOString() };
  if (!pushEnabled || !sourceAllowed || isQuietHours(preferences)) { await saveNotificationRecord({ id: `notif_${Date.now()}_${randomBytes(3).toString("hex")}`, ...base, status: "skipped" }); return; }
  const subscriptions = await getPushSubscriptions(); const payload = JSON.stringify({ title, body, url: "/agentplus.admin", tag: `lead-${order.id}` }); let delivered = 0;
  await Promise.all(subscriptions.map(async ({ id, payload: subscription }) => { try { await webpush.sendNotification(subscription, payload, { TTL: 300 }); delivered += 1; } catch (error) { const statusCode = (error as { statusCode?: number }).statusCode; if (statusCode === 404 || statusCode === 410) await deletePushSubscription(id); } }));
  await saveNotificationRecord({ id: `notif_${Date.now()}_${randomBytes(3).toString("hex")}`, ...base, status: delivered ? "sent" : "failed" });
}
async function getSubscribers() {
  if (supabaseEnabled) { try { const rows = await supabaseRequest<Array<{ payload: Subscriber }>>("agentplus_subscribers?select=payload&order=created_at.desc&limit=1000"); return rows.map((row) => row.payload); } catch { /* schema may not be applied yet */ } }
  return memory.subscribers;
}
async function persistSubscriber(subscriber: Subscriber) {
  memory.subscribers = [subscriber, ...memory.subscribers.filter((row) => row.email !== subscriber.email)].slice(0, 1000);
  if (supabaseEnabled) { try { await supabaseRequest("agentplus_subscribers", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: subscriber.id, payload: subscriber, created_at: subscriber.timestamp }) }); return; } catch { console.warn("Supabase subscribers table is not ready; using fallback storage."); } }
}

async function getArticles() {
  if (supabaseEnabled) { try { const rows = await supabaseRequest<Array<{ payload: Article }>>("agentplus_articles?select=payload&order=created_at.desc&limit=500"); return rows.map((row) => row.payload); } catch { /* schema may not be applied yet */ } }
  return memory.articles;
}
async function persistArticle(article: Article) {
  memory.articles = [article, ...memory.articles.filter((row) => row.id !== article.id)];
  if (supabaseEnabled) { try { await supabaseRequest("agentplus_articles", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: article.id, payload: article, created_at: article.createdAt }) }); return; } catch { console.warn("Supabase articles table is not ready; using fallback storage."); } }
}
async function deleteArticle(id: string) {
  memory.articles = memory.articles.filter((row) => row.id !== id);
  if (supabaseEnabled) { try { await supabaseRequest(`agentplus_articles?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" }); } catch { /* fallback */ } }
}

async function getAtlas() {
  if (supabaseEnabled) { try { const rows = await supabaseRequest<Array<{ messages: ChatMessage[] }>>("agentplus_memory?id=eq.1&select=messages&limit=1"); return rows[0]?.messages || []; } catch { /* schema may not be applied yet */ } }
  if (redisEnabled) { try { const raw = await redis("GET", "ap:atlas:memory") as string | null; return raw ? JSON.parse(raw) as ChatMessage[] : []; } catch { /* fallback */ } }
  return memory.atlas;
}
async function saveAtlas(messages: ChatMessage[]) {
  memory.atlas = messages.slice(-60);
  if (supabaseEnabled) { try { await supabaseRequest("agentplus_memory", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: 1, messages: memory.atlas, updated_at: new Date().toISOString() }) }); return; } catch { console.warn("Supabase memory table is not ready; using fallback storage."); } }
  if (redisEnabled) await redis("SET", "ap:atlas:memory", JSON.stringify(memory.atlas));
}
async function clearAtlas() { memory.atlas = []; if (supabaseEnabled) await supabaseRequest("agentplus_memory?id=eq.1", { method: "DELETE" }); else if (redisEnabled) await redis("DEL", "ap:atlas:memory"); }
function issueSessionToken() {
  const payload = `${Date.now()}.${randomBytes(32).toString("hex")}`;
  const signature = createHmac("sha256", ADMIN_PASSWORD).update(payload).digest("hex");
  return `${payload}.${signature}`;
}
function validSignedSession(token: string) {
  if (!ADMIN_PASSWORD) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = createHmac("sha256", ADMIN_PASSWORD).update(payload).digest("hex");
  return parts[2] === expected && Number(parts[0]) > Date.now() - 30 * 24 * 60 * 60 * 1000;
}
async function createSession(token: string) {
  memory.sessions.add(token);
  if (supabaseEnabled) {
    try {
      await supabaseRequest("agentplus_sessions", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ token, expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }) });
      return;
    } catch (error) {
      console.warn("Supabase session storage unavailable; using in-memory session fallback.", String(error));
    }
  }
  if (redisEnabled) {
    try { await redis("SET", `ap:session:${token}`, "1", "EX", 60 * 60 * 24 * 30); } catch (error) { console.warn("Redis session storage unavailable; using in-memory session fallback.", String(error)); }
  }
}
async function validSession(token: string) {
  if (!token) return false;
  if (validSignedSession(token)) return true;
  if (memory.sessions.has(token)) return true;
  if (supabaseEnabled) { try { const rows = await supabaseRequest<Array<{ token: string }>>(`agentplus_sessions?token=eq.${encodeURIComponent(token)}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=token&limit=1`); return rows.length > 0; } catch { return false; } }
  if (redisEnabled) { try { return (await redis("GET", `ap:session:${token}`)) === "1"; } catch { return false; } }
  return false;
}
async function deleteSession(token: string) { memory.sessions.delete(token); if (supabaseEnabled) await supabaseRequest(`agentplus_sessions?token=eq.${encodeURIComponent(token)}`, { method: "DELETE" }); else if (redisEnabled) await redis("DEL", `ap:session:${token}`); }

async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) { const header = req.headers.authorization || ""; const token = header.startsWith("Bearer ") ? header.slice(7) : ""; if (!(await validSession(token))) return res.status(401).json({ error: "Unauthorized" }); next(); }

const ARIA = `You are Aria, AgentPlus's warm, adaptive front-desk customer-care and sales concierge. Your only job is customer care, explaining AgentPlus services, understanding a visitor’s business, recommending the right package, handling objections honestly, and helping the visitor place a new order. Do not conduct external market research or write research reports; Maxwell is the research agent. Packages: Starter Agent $400 one-time, Basic Agent $799 one-time, Premium Agent $1,500 one-time, Custom AI Agent $3,000-$25,000+ quotation. Match the visitor’s pace: if they are ready, recommend directly; if they are exploring, ask one useful question at a time; never repeat questions already answered. Never ask for name, email, or phone; the order form handles that. When the visitor is ready to buy, emit exactly one machine-readable line with valid JSON and no trailing text inside the JSON: ORDER_READY:{"requirements":"...","suggestedPackage":"...","suggestedPrice":"...","packageReasoning":"..."} followed by one natural closing sentence. Keep replies concise, human, and helpful. For human help, share https://wa.me/254729053520.`;
const DEMO = `You are Maxwell, AgentPlus's live-demo research and strategy agent. Your only job is agent work: conduct external market research using the supplied results, assess named companies, restaurants, competitors, customer segments, and locations, and turn evidence into a practical strategy. Name the publisher or business behind every material finding. Separate evidence, interpretation, recommendations, assumptions, confidence, metrics, and next experiment. Maxwell may explain which AgentPlus service could execute a strategy when relevant, but Aria handles customer care and orders. Never invent sources or claim an action happened when it did not. Do not call tools or emit tool-call JSON; write the final answer directly from the supplied research.`;

const ATLAS = `You are Atlas, the private AgentPlus admin mind. You remember the full conversation context supplied to you and speak directly to the founder as a senior AI engineer, business strategist, researcher, and project manager. Analyze live leads and visitors, flag stale opportunities, calculate conversion patterns, design client solutions, and write production-ready prompts for WhatsApp bots, web chatbots, support desks, booking bots, lead generation, and operations. Packages are Starter Agent $400 one-time, Basic Agent $799 one-time, Premium Agent $1,500 one-time, Custom AI Agent $3,000-$25,000+ quotation. Be direct, specific, and low-fluff. End strategy responses with **Next step:** and one concrete action.`;

async function callGroq(messages: ChatMessage[], mode: "client" | "admin", dashboardContext?: unknown, searchResults?: unknown, systemOverride?: string) {
  if (!GROQ_KEY) return mode === "admin" ? "Atlas is ready, but GROQ_API_KEY is not configured.\n\n**Next step:** Add the server-side Groq key to enable live reasoning." : "I’m here to help you find the right AgentPlus starting point. Tell me what is taking your team too much time—customer replies, lead capture, support, or operations—and I’ll recommend a package.";
  const cleanMessages = messages.map((message) => ({ role: message.role, content: message.content }));
  const system = systemOverride || (mode === "admin" ? `${ATLAS}\n\nLIVE DASHBOARD DATA:\n${JSON.stringify(dashboardContext || {}, null, 2)}\n\nRESEARCH:\n${JSON.stringify(searchResults || {}, null, 2)}` : searchResults ? `${DEMO}\n\nLIVE RESEARCH SOURCES:\n${JSON.stringify(searchResults, null, 2)}` : ARIA);
  const request = (prompt: string, temperature: number) => fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` }, body: JSON.stringify({ model: "openai/gpt-oss-120b", messages: [{ role: "system", content: prompt }, ...cleanMessages], max_tokens: mode === "admin" ? 1800 : 900, temperature }), signal: AbortSignal.timeout(25_000) });
  let response = await request(system, 0.72);
  if (!response.ok) { const detail = await response.text(); if (detail.includes("called a tool") || detail.includes("tool_use_failed")) response = await request(`${system}\n\nIMPORTANT: Do not call tools, browse, or emit tool-call JSON. Use only the supplied research results and write the final answer directly.`, 0.35); else throw new Error(`Groq ${response.status}: ${detail.slice(0, 500)}`); }
  if (!response.ok) { const detail = await response.text(); throw new Error(`Groq ${response.status}: ${detail.slice(0, 500)}`); }
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return payload.choices?.[0]?.message?.content || "I’m having a moment—please try WhatsApp for the fastest response.";
}

app.get("/api/status", (_req, res) => res.json({ ok: true, backend: backendMode, supabase: supabaseEnabled, redis: redisEnabled, groq: Boolean(GROQ_KEY), adminPassword: Boolean(ADMIN_PASSWORD), browserPush: pushEnabled }));
app.get("/api/maps-script", async (req, res) => {
  const key = process.env.VITE_FRONTEND_FORGE_API_KEY || "";
  if (!key) return res.status(503).type("text/plain").send("Maps is not configured.");
  const libraries = typeof req.query.libraries === "string" ? req.query.libraries : "marker,places,geocoding,geometry";
  const version = typeof req.query.v === "string" ? req.query.v : "weekly";
  const forgeOrigin = process.env.FORGE_MAP_ORIGIN || "https://3000-i9v1qpo2vbn113o4ggl1v-d5218780.us3.manus.computer";
  try {
    const upstream = await fetch(`https://forge.manus.ai/v1/maps/proxy/maps/api/js?key=${encodeURIComponent(key)}&v=${encodeURIComponent(version)}&libraries=${encodeURIComponent(libraries)}`, { headers: { Origin: forgeOrigin, Referer: `${forgeOrigin}/` }, signal: AbortSignal.timeout(20_000) });
    const body = await upstream.text();
    res.status(upstream.status).setHeader("Content-Type", upstream.headers.get("content-type") || "application/javascript; charset=utf-8").setHeader("Cache-Control", "public, max-age=3600").send(body);
  } catch (error) { res.status(502).type("text/plain").send(`Maps proxy unavailable: ${String(error)}`); }
});
app.post("/api/admin-auth", async (req, res) => { const password = typeof req.body?.password === "string" ? req.body.password : ""; if (!ADMIN_PASSWORD) return res.status(503).json({ ok: false, error: "ADMIN_PASSWORD is not configured" }); if (password !== ADMIN_PASSWORD) return res.json({ ok: false }); const token = issueSessionToken(); await createSession(token); res.json({ ok: true, token }); });
app.delete("/api/admin-auth", async (req, res) => { const token = typeof req.body?.token === "string" ? req.body.token : ""; if (token) await deleteSession(token); res.json({ ok: true }); });

app.get("/api/articles", async (_req, res) => res.json({ articles: await getArticles() }));
app.get("/api/articles/manage", requireAuth, async (_req, res) => res.json({ articles: await getArticles() }));
app.post("/api/articles", requireAuth, async (req, res) => { const body = req.body || {}; if (!body.title || !body.category || !body.excerpt || !body.body) return res.status(400).json({ error: "Title, category, excerpt, and body are required" }); const now = new Date().toISOString(); const article: Article = { id: `art_${Date.now()}_${randomBytes(3).toString("hex")}`, category: String(body.category).slice(0, 80), title: String(body.title).slice(0, 180), excerpt: String(body.excerpt).slice(0, 500), body: String(body.body).slice(0, 10000), date: String(body.date || new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })), readTime: String(body.readTime || "5 min read").slice(0, 40), createdAt: now }; await persistArticle(article); res.json({ ok: true, article }); });
app.patch("/api/articles", requireAuth, async (req, res) => { const body = req.body || {}; if (!body.id) return res.status(400).json({ error: "Missing id" }); const existing = (await getArticles()).find((article) => article.id === body.id); if (!existing) return res.status(404).json({ error: "Article not found" }); const article = { ...existing, ...body, updatedAt: new Date().toISOString() } as Article; await persistArticle(article); res.json({ ok: true, article }); });
app.delete("/api/articles", requireAuth, async (req, res) => { if (!req.body?.id) return res.status(400).json({ error: "Missing id" }); await deleteArticle(String(req.body.id)); res.json({ ok: true }); });


app.get("/api/research-reports", requireAuth, async (_req, res) => res.json({ reports: await getCollection("agentplus_research_reports", memory.reports) }));
app.post("/api/research-reports", requireAuth, async (req, res) => { const body = req.body || {}; if (!body.title || !body.query || !body.summary) return res.status(400).json({ error: "Title, query, and summary are required" }); const report: ResearchReport = { id: `report_${Date.now()}_${randomBytes(3).toString("hex")}`, title: String(body.title).slice(0, 180), query: String(body.query).slice(0, 500), market: String(body.market || "").slice(0, 120), summary: String(body.summary).slice(0, 20000), strategy: String(body.strategy || "").slice(0, 20000), sources: Array.isArray(body.sources) ? body.sources.filter((source: { title?: unknown; url?: unknown }) => source && typeof source.url === "string").slice(0, 30).map((source: { title?: unknown; url: string }) => ({ title: String(source.title || source.url).slice(0, 240), url: source.url.slice(0, 1000) })) : [], confidence: ["high", "medium", "low"].includes(body.confidence) ? body.confidence : "medium", createdAt: new Date().toISOString() }; await saveCollectionItem("agentplus_research_reports", report, memory.reports); res.json({ ok: true, report }); });
app.patch("/api/research-reports", requireAuth, async (req, res) => { const body = req.body || {}; const existing = (await getCollection("agentplus_research_reports", memory.reports)).find((report) => report.id === body.id); if (!existing) return res.status(404).json({ error: "Research report not found" }); const report = { ...existing, ...body, updatedAt: new Date().toISOString() } as ResearchReport; await saveCollectionItem("agentplus_research_reports", report, memory.reports); res.json({ ok: true, report }); });
app.delete("/api/research-reports", requireAuth, async (req, res) => { if (!req.body?.id) return res.status(400).json({ error: "Missing id" }); await deleteCollectionItem("agentplus_research_reports", String(req.body.id)); res.json({ ok: true }); });
app.get("/api/orders", requireAuth, async (_req, res) => res.json({ orders: await getOrders() }));
app.get("/api/customers", requireAuth, async (_req, res) => { const orders = await getOrders(); const byEmail = new Map<string, Record<string, unknown>>(); orders.forEach((order) => { const email = String(order.customerEmail || order.customerName || order.id); if (!byEmail.has(email)) byEmail.set(email, { id: email, name: order.customerName, email: order.customerEmail, company: order.companyName, website: order.website, package: order.suggestedPackage, status: order.status, paymentStatus: order.paymentStatus || (order.source === "binance-payment" ? "pending" : "not started") }); }); res.json({ customers: Array.from(byEmail.values()) }); });
app.get("/api/agents", requireAuth, async (_req, res) => res.json({ agents: await getCollection("agentplus_agents", memory.agents) }));
app.post("/api/agents", requireAuth, async (req, res) => { const body = req.body || {}; if (!body.name || !body.instructions) return res.status(400).json({ error: "Agent name and system instructions are required" }); const agent: Agent = { id: `agent_${Date.now()}_${randomBytes(3).toString("hex")}`, name: String(body.name).slice(0, 120), customerEmail: String(body.customerEmail || "").slice(0, 160), company: String(body.company || "").slice(0, 160), website: String(body.website || "").slice(0, 240), instructions: String(body.instructions).slice(0, 10000), knowledge: String(body.knowledge || "").slice(0, 10000), tone: String(body.tone || "professional"), tools: Array.isArray(body.tools) ? body.tools.map(String).slice(0, 20) : [], researchLevel: String(body.researchLevel || "basic"), status: "draft", createdAt: new Date().toISOString() }; await saveCollectionItem("agentplus_agents", agent, memory.agents); res.json({ ok: true, agent }); });
app.patch("/api/agents", requireAuth, async (req, res) => { const body = req.body || {}; const existing = (await getCollection("agentplus_agents", memory.agents)).find((agent) => agent.id === body.id); if (!existing) return res.status(404).json({ error: "Agent not found" }); const agent = { ...existing, ...body, updatedAt: new Date().toISOString() } as Agent; await saveCollectionItem("agentplus_agents", agent, memory.agents); res.json({ ok: true, agent }); });
app.delete("/api/agents", requireAuth, async (req, res) => { if (!req.body?.id) return res.status(400).json({ error: "Missing id" }); await deleteCollectionItem("agentplus_agents", String(req.body.id)); res.json({ ok: true }); });
app.get("/api/knowledge", requireAuth, async (req, res) => { const rows = await getCollection("agentplus_knowledge", memory.knowledge); res.json({ knowledge: rows.filter((item) => !req.query.agentId || item.agentId === req.query.agentId) }); });
app.post("/api/knowledge", requireAuth, async (req, res) => { const body = req.body || {}; if (!body.agentId || !body.title || !body.content) return res.status(400).json({ error: "Agent, title, and content are required" }); const item: KnowledgeItem = { id: `know_${Date.now()}_${randomBytes(3).toString("hex")}`, agentId: String(body.agentId), title: String(body.title).slice(0, 180), content: String(body.content).slice(0, 20000), source: String(body.source || "manual"), createdAt: new Date().toISOString() }; await saveCollectionItem("agentplus_knowledge", item, memory.knowledge); res.json({ ok: true, item }); });
app.delete("/api/knowledge", requireAuth, async (req, res) => { if (!req.body?.id) return res.status(400).json({ error: "Missing id" }); await deleteCollectionItem("agentplus_knowledge", String(req.body.id)); res.json({ ok: true }); });
app.get("/api/deployments", requireAuth, async (_req, res) => res.json({ deployments: await getCollection("agentplus_deployments", memory.deployments) }));
app.post("/api/deployments", requireAuth, async (req, res) => { const body = req.body || {}; if (!body.agentId || !body.website) return res.status(400).json({ error: "Agent and customer website are required" }); const publicKey = randomBytes(16).toString("hex"); const deployment: Deployment = { id: `dep_${Date.now()}_${randomBytes(3).toString("hex")}`, agentId: String(body.agentId), website: String(body.website).slice(0, 240), status: "ready", publicKey, embedCode: `<script src="${req.protocol}://${req.get("host")}/agent.js" data-agent="${publicKey}" defer></script>`, createdAt: new Date().toISOString() }; await saveCollectionItem("agentplus_deployments", deployment, memory.deployments); res.json({ ok: true, deployment }); });
app.get("/api/embed/:publicKey", async (req, res) => { const deployments = await getCollection("agentplus_deployments", memory.deployments); const deployment = deployments.find((item) => item.publicKey === req.params.publicKey); if (!deployment) return res.status(404).json({ error: "Agent not found" }); const agents = await getCollection("agentplus_agents", memory.agents); const agent = agents.find((item) => item.id === deployment.agentId); if (!agent) return res.status(404).json({ error: "Agent not found" }); res.json({ agent: { id: agent.id, name: agent.name, tone: agent.tone, researchLevel: agent.researchLevel }, deployment: { website: deployment.website } }); });

app.get("/api/push/public-key", (_req, res) => pushEnabled ? res.json({ publicKey: VAPID_PUBLIC_KEY }) : res.status(503).json({ error: "Browser push is not configured" }));
app.get("/api/notification-preferences", requireAuth, async (_req, res) => res.json({ preferences: await getSettings("notification_preferences", defaultNotificationPreferences) }));
app.patch("/api/notification-preferences", requireAuth, async (req, res) => { const body = req.body || {}; const preferences: NotificationPreferences = { leadSources: Array.isArray(body.leadSources) && body.leadSources.length ? body.leadSources.map(String).slice(0, 20) : ["all"], quietHoursEnabled: Boolean(body.quietHoursEnabled), quietStart: String(body.quietStart || "22:00"), quietEnd: String(body.quietEnd || "07:00"), timezone: String(body.timezone || "Africa/Nairobi") }; await saveSettings("notification_preferences", preferences); res.json({ ok: true, preferences }); });
app.get("/api/notification-history", requireAuth, async (_req, res) => res.json({ notifications: await getNotificationHistory() }));
app.get("/api/payment-config", async (_req, res) => { const config = await getSettings("payment_config", defaultPaymentConfig); res.json({ config: { enabled: config.enabled, binanceId: config.binanceId, walletAddress: config.walletAddress, network: config.network, instructions: config.instructions } }); });
app.get("/api/payment-config/manage", requireAuth, async (_req, res) => res.json({ config: await getSettings("payment_config", defaultPaymentConfig) }));
app.patch("/api/payment-config", requireAuth, async (req, res) => { const body = req.body || {}; const config: PaymentConfig = { enabled: Boolean(body.enabled), binanceId: String(body.binanceId || "").slice(0, 120), walletAddress: String(body.walletAddress || "").slice(0, 180), network: String(body.network || "TRC20").slice(0, 30), instructions: String(body.instructions || defaultPaymentConfig.instructions).slice(0, 1000) }; await saveSettings("payment_config", config); res.json({ ok: true, config }); });
app.post("/api/push/subscribe", requireAuth, async (req, res) => {
  const subscription = req.body?.subscription as PushSubscription;
  if (!pushEnabled) return res.status(503).json({ error: "Browser push is not configured" });
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) return res.status(400).json({ error: "Invalid push subscription" });
  const id = await persistPushSubscription(subscription);
  res.json({ ok: true, id });
});
app.delete("/api/push/subscribe", requireAuth, async (req, res) => {
  if (req.body?.id) await deletePushSubscription(String(req.body.id));
  res.json({ ok: true });
});
app.get("/api/admin/lead-events", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!(await validSession(token))) return res.status(401).end();
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" });
  res.write(`event: ready\ndata: ${JSON.stringify({ connectedAt: new Date().toISOString() })}\n\n`);
  leadEventClients.add(res);
  const heartbeat = setInterval(() => { try { res.write(`event: heartbeat\ndata: ${Date.now()}\n\n`); } catch { clearInterval(heartbeat); leadEventClients.delete(res); } }, 25_000);
  req.on("close", () => { clearInterval(heartbeat); leadEventClients.delete(res); });
});
app.get("/api/subscribers", requireAuth, async (_req, res) => res.json({ subscribers: await getSubscribers() }));
app.post("/api/subscribe", async (req, res) => { const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : ""; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Valid email required" }); const subscriber: Subscriber = { id: `sub_${Date.now()}_${randomBytes(3).toString("hex")}`, email, timestamp: new Date().toISOString(), source: typeof req.body?.source === "string" ? req.body.source.slice(0, 120) : "blog" }; try { await persistSubscriber(subscriber); res.json({ ok: true }); } catch (error) { res.status(500).json({ error: String(error) }); } });
app.post("/api/inquiries", async (req, res) => { const inquiry = req.body as Order; if (!inquiry?.requirements) return res.status(400).json({ error: "Missing requirements" }); let attribution: Record<string, unknown> = {}; const visitorId = typeof inquiry.visitorId === "string" ? inquiry.visitorId : ""; if (visitorId) { const visitor = (await getVisitors()).find((item) => item.id === visitorId); if (visitor) { const pages = Array.isArray(visitor.pagesVisited) ? visitor.pagesVisited as Array<{ page?: string }> : []; attribution = { source: visitor.source || sourceLabel(visitor.utmSource, visitor.referrer), campaign: visitor.campaign || visitor.utmCampaign, landingPage: visitor.landingPage || pages[0]?.page, device: visitor.device, country: visitor.country, visitorId }; } } const order = { ...attribution, ...inquiry, id: inquiry.id || `ord_${Date.now()}_${randomBytes(3).toString("hex")}`, timestamp: inquiry.timestamp || new Date().toISOString(), status: inquiry.status || "new", source: inquiry.source || String(attribution.source || "chatbot"), service: inquiry.service || inquiry.suggestedPackage || "Other", orderEvents: [{ event: "order_submitted", timestamp: new Date().toISOString() }] }; try { await persistOrder(order); await persistAnalyticsEvent({ id: `evt_${Date.now()}_${randomBytes(3).toString("hex")}`, sessionId: visitorId || undefined, eventName: "order_submitted", service: String(order.service), source: String(order.source), createdAt: new Date().toISOString(), metadata: { orderId: order.id, source: order.source } }); broadcastLead(order); void sendLeadPush(order); res.json({ ok: true, id: order.id }); } catch (error) { res.status(500).json({ error: String(error) }); } });
app.post("/api/orders", requireAuth, async (req, res) => { const order = req.body as Order; if (!order?.id) return res.status(400).json({ error: "Missing id" }); await persistOrder(order); res.json({ ok: true }); });
app.patch("/api/orders", requireAuth, async (req, res) => { const { id, ...fields } = req.body as { id?: string } & Record<string, unknown>; if (!id) return res.status(400).json({ error: "Missing id" }); const order = (await getOrders()).find((row) => row.id === id); if (order) await persistOrder({ ...order, ...fields }); res.json({ ok: true }); });
app.delete("/api/orders", requireAuth, async (req, res) => { const id = req.body?.id as string; if (!id) return res.status(400).json({ error: "Missing id" }); await deleteOrder(id); res.json({ ok: true }); });

app.get("/api/visitors", requireAuth, async (_req, res) => res.json({ visitors: await getVisitors() }));
app.delete("/api/visitors", requireAuth, async (req, res) => { const id = req.body?.id as string; if (!id) return res.status(400).json({ error: "Missing id" }); await deleteVisitor(id); res.json({ ok: true }); });
app.post("/api/track", async (req, res) => { const visitor = req.body?.visitor as Visitor; if (!visitor?.id) return res.status(400).json({ error: "Missing visitor" }); try { await persistVisitor(visitor); res.json({ ok: true }); } catch (error) { res.status(500).json({ error: String(error) }); } });
app.post("/api/analytics/events", async (req, res) => { const body = req.body || {}; if (!body.eventName || typeof body.eventName !== "string") return res.status(400).json({ error: "eventName is required" }); const event: AnalyticsEvent = { id: `evt_${Date.now()}_${randomBytes(3).toString("hex")}`, sessionId: typeof body.sessionId === "string" ? body.sessionId.slice(0, 120) : undefined, eventName: body.eventName.slice(0, 80), service: typeof body.service === "string" ? body.service.slice(0, 120) : undefined, page: typeof body.page === "string" ? body.page.slice(0, 240) : undefined, source: sourceLabel(body.utmSource, body.referrer), referrer: typeof body.referrer === "string" ? body.referrer.slice(0, 500) : undefined, utmSource: typeof body.utmSource === "string" ? body.utmSource.slice(0, 100) : undefined, utmMedium: typeof body.utmMedium === "string" ? body.utmMedium.slice(0, 100) : undefined, utmCampaign: typeof body.utmCampaign === "string" ? body.utmCampaign.slice(0, 160) : undefined, utmContent: typeof body.utmContent === "string" ? body.utmContent.slice(0, 160) : undefined, utmTerm: typeof body.utmTerm === "string" ? body.utmTerm.slice(0, 160) : undefined, deviceType: typeof body.deviceType === "string" ? body.deviceType.slice(0, 40) : undefined, browser: typeof body.browser === "string" ? body.browser.slice(0, 100) : undefined, os: typeof body.os === "string" ? body.os.slice(0, 100) : undefined, country: typeof body.country === "string" ? body.country.slice(0, 100) : undefined, metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : undefined, createdAt: new Date().toISOString() }; try { await persistAnalyticsEvent(event); res.json({ ok: true, id: event.id }); } catch (error) { res.status(500).json({ error: String(error) }); } });
app.get("/api/analytics", requireAuth, async (_req, res) => res.json(await analyticsSnapshot()));
app.post("/api/whatsapp-click", async (req, res) => { const body = req.body || {}; const click: WhatsAppClick = { id: `wa_${Date.now()}_${randomBytes(3).toString("hex")}`, timestamp: new Date().toISOString(), service: typeof body.service === "string" ? body.service.slice(0, 80) : "General", visitorId: typeof body.visitorId === "string" ? body.visitorId.slice(0, 120) : undefined, page: typeof body.page === "string" ? body.page.slice(0, 120) : undefined, device: typeof body.device === "string" ? body.device.slice(0, 40) : undefined, referrer: typeof body.referrer === "string" ? body.referrer.slice(0, 240) : undefined, campaign: typeof body.campaign === "string" ? body.campaign.slice(0, 100) : "Direct", source: typeof body.source === "string" ? body.source.slice(0, 160) : "Direct", medium: typeof body.medium === "string" ? body.medium.slice(0, 80) : "none", content: typeof body.content === "string" ? body.content.slice(0, 120) : undefined }; try { await persistWhatsappClick(click); res.json({ ok: true }); } catch (error) { res.status(500).json({ error: String(error) }); } });
app.get("/api/whatsapp-clicks", requireAuth, async (_req, res) => res.json({ clicks: await getWhatsappClicks() }));

app.get("/api/atlas-memory", requireAuth, async (_req, res) => res.json({ messages: await getAtlas() }));
app.post("/api/atlas-memory", requireAuth, async (req, res) => { await saveAtlas(Array.isArray(req.body?.messages) ? req.body.messages : []); res.json({ ok: true }); });
app.delete("/api/atlas-memory", requireAuth, async (_req, res) => { await clearAtlas(); res.json({ ok: true }); });
app.post("/api/chat", async (req, res) => { try { const { messages, mode = "client", dashboardContext, searchResults, researchMode = "quick" } = req.body as { messages?: ChatMessage[]; mode?: "client" | "admin"; dashboardContext?: unknown; searchResults?: unknown; researchMode?: "quick" | "research" | "strategy" }; if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ error: "No messages" }); if (mode === "client" && researchMode !== "quick") { const query = messages[messages.length - 1]?.content || ""; const sources = await searchWeb(query); const strategyPrompt = researchMode === "strategy" ? `You are Aria, AgentPlus's research strategist. Answer the visitor's actual question, then turn the external findings into a practical strategy. Separate: 1) what the sources say, 2) what it means for this business, 3) a prioritized strategy with 3-5 actions, 4) metrics to track, 5) risks and assumptions, and 6) the next 7-day step. Name the publisher or company for every material finding using a clear “Source: [name]” label. For local research, name each restaurant, company, or place exactly as returned by Google Maps before describing its rating, address, category, or observed signal. Cite source titles and URLs naturally. Do not invent facts, do not claim certainty when the sources are weak, and do not pressure the visitor to buy. Only mention AgentPlus packages if the visitor asks for implementation, pricing, or help executing the strategy.` : `You are Aria, AgentPlus's external market research assistant. Answer the visitor's question using the live research results below. Distinguish sourced facts from your analysis, cite sources naturally, call out gaps or conflicting signals, and ask one useful follow-up if the question is too broad. Do not use canned sales lines or push a package unless the visitor asks about implementation or pricing.`; const content = await callGroq(messages, "client", undefined, { sources }, `${strategyPrompt}\n\nLIVE EXTERNAL RESEARCH RESULTS:\n${JSON.stringify(sources, null, 2)}`); return res.json({ content, sources, researchUsed: true, researchMode }); } const liveContext = mode === "admin" ? await analyticsSnapshot() : dashboardContext; res.json({ content: await callGroq(messages, mode, liveContext, searchResults), researchUsed: false, researchMode }); } catch (error) { res.status(500).json({ error: String(error) }); } });
async function searchWeb(query: string) {
  const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, { headers: { "User-Agent": "Mozilla/5.0 (compatible; AgentPlus/1.0)" }, signal: AbortSignal.timeout(8000) });
  const html = await response.text();
  return Array.from(html.matchAll(/<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)).slice(0, 6).map((match) => ({ url: match[1], title: match[2].replace(/<[^>]+>/g, "").trim() }));
}

app.post("/api/embed/:publicKey/chat", async (req, res) => {
  try {
    const deployments = await getCollection("agentplus_deployments", memory.deployments);
    const deployment = deployments.find((item) => item.publicKey === req.params.publicKey);
    if (!deployment) return res.status(404).json({ error: "Agent not found" });
    const agents = await getCollection("agentplus_agents", memory.agents);
    const agent = agents.find((item) => item.id === deployment.agentId);
    if (!agent) return res.status(404).json({ error: "Agent not found" });
    const messages = Array.isArray(req.body?.messages) ? req.body.messages.filter((item: ChatMessage) => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string").slice(-20) as ChatMessage[] : [];
    if (!messages.length) return res.status(400).json({ error: "Ask the agent a question first." });
    const latest = messages[messages.length - 1].content;
    const shouldResearch = Boolean(req.body?.research) || agent.researchLevel !== "basic";
    const sources = shouldResearch ? await searchWeb(latest) : [];
    const knowledge = (await getCollection("agentplus_knowledge", memory.knowledge)).filter((item) => item.agentId === agent.id);
    const system = `You are ${agent.name}, an embedded AI agent for ${agent.company || "the customer business"}. Answer the visitor's actual question directly and honestly. Do not use canned sales lines, do not pretend to have done work you did not do, and do not push a purchase when the visitor only needs information. Use the business instructions and knowledge below as your primary context. If live research is included, distinguish researched facts from your reasoning and cite source titles/URLs naturally. If you do not know, say what is missing and ask one useful follow-up question. Only recommend an AgentPlus package when the visitor is clearly asking for implementation, pricing, automation, or next steps; explain why the recommendation fits, and offer a no-pressure handoff.

BUSINESS INSTRUCTIONS:
${agent.instructions}

BUSINESS KNOWLEDGE:
${agent.knowledge}
${knowledge.length ? `\nKNOWLEDGE BASE ENTRIES:\n${knowledge.map((item) => `${item.title}: ${item.content}`).join("\n\n")}` : ""}
\nLIVE RESEARCH RESULTS:\n${JSON.stringify(sources, null, 2)}`;
    const content = await callGroq(messages, "client", undefined, sources, system);
    res.json({ content, sources, researchUsed: shouldResearch });
  } catch (error) {
    console.error("Embedded agent error", error);
    res.status(500).json({ error: "The agent could not complete that answer right now." });
  }
});
app.post("/api/demo", async (req, res) => { try { const { messages, mode = "quick", locationContext } = req.body as { messages?: ChatMessage[]; mode?: "quick" | "research"; locationContext?: { query?: string; center?: { lat: number; lng: number }; businesses?: Array<Record<string, unknown>> } }; if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ error: "No messages" }); if (mode === "research" || locationContext?.businesses?.length) { const query = messages[messages.length - 1]?.content || locationContext?.query || ""; const sources = await searchWeb(query); if (!sources.length && !locationContext?.businesses?.length) return res.status(502).json({ error: "Live research returned no sources. Try a more specific question." }); const mapPrompt = locationContext?.businesses?.length ? `\n\nGOOGLE MAPS NEARBY BUSINESS CONTEXT (retrieved from the visitor's selected area):\n${JSON.stringify(locationContext, null, 2)}\nUse this to compare nearby businesses, identify patterns, gaps, positioning, and practical opportunities. Treat ratings, names, addresses, and categories as observed map data, not proof of business quality. Include Google Maps/Earth links when useful.` : ""; const researchPrompt = `You are the AgentPlus free demo research analyst. Answer the visitor's actual question using live external research${locationContext?.businesses?.length ? " and the Google Maps nearby-business context" : ""}. Separate sourced facts, observed local signals, and your analysis. Name the publisher/company behind each web finding and name each restaurant/company/place behind each map signal. Do not invent facts, do not overstate what map ratings prove, and clearly state when the sample is incomplete. When useful, provide a concise competitive read, opportunity gaps, recommended positioning, 3-5 actions, metrics, and a next 7-day experiment. Do not push a package unless the visitor asks about implementation or pricing.${mapPrompt}`; const content = await callGroq(messages, "client", undefined, { webSources: sources, locationContext }, `${researchPrompt}\n\nLIVE WEB SOURCES:\n${JSON.stringify(sources, null, 2)}`); return res.json({ content, sources, maps: locationContext || null, researchUsed: true }); } res.json({ content: await callGroq(messages, "client"), researchUsed: false }); } catch (error) { console.error("Demo research error", error); res.status(500).json({ error: "The live demo could not complete this request." }); } });
app.post("/api/search", requireAuth, async (req, res) => { const query = typeof req.body?.query === "string" ? req.body.query : ""; const url = typeof req.body?.url === "string" ? req.body.url : ""; if (!query && !url) return res.status(400).json({ error: "Provide query or url" }); try { if (url) { const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; AgentPlus/1.0)" }, signal: AbortSignal.timeout(6000) }); const html = await response.text(); return res.json({ type: "scrape", content: html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000) }); } const results = await searchWeb(query); res.json({ type: "search", results }); } catch (error) { res.status(500).json({ error: String(error) }); } });

async function startServer() {
  if (process.env.NODE_ENV === "production") {
    const staticPath = path.resolve(__dirname, "public");
    app.use(express.static(staticPath));
    app.get("*", (_req, res) => res.sendFile(path.join(staticPath, "index.html")));
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({ server: { middlewareMode: true, hmr: { server: httpServer } }, appType: "spa" });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => { try { const template = await vite.transformIndexHtml(req.originalUrl, await (await import("fs/promises")).readFile(path.resolve(__dirname, "..", "client", "index.html"), "utf-8")); res.status(200).set({ "Content-Type": "text/html" }).end(template); } catch (error) { vite.ssrFixStacktrace(error as Error); next(error); } });
  }
  httpServer.listen(port, "0.0.0.0", () => { console.log(`AgentPlus server running on http://localhost:${port}/ (backend=${backendMode}, groq=${Boolean(GROQ_KEY)})`); console.log(`➜ Local:   http://localhost:${port}/`); console.log(`➜ Network: http://0.0.0.0:${port}/`); });
}
export default app;

if (!process.env.VERCEL) {
  startServer().catch((error) => { console.error(error); process.exit(1); });
}
