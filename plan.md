# AgentPlus website plan

## Existing pricing work

Replace the stale homepage agent-only pricing cards with a shared, typed pricing catalog used by the homepage and `/services`. The catalog contains Website, AI Agent, Custom Software, and Maintenance packages with USD starting prices, approximate KSh planning equivalents, scope notes, and CTA labels. The homepage provides a working Websites / AI Agents / Custom Software switcher plus maintenance section. Every CTA opens the existing `OrderDialog`, which accepts the selected package, displays its starting price, collects customer and project requirements, and submits to `/api/inquiries` for the existing admin inbox.

Update `/services` to present the new professional service packages and reuse the same order flow. Update Aria and Atlas prompts so their recommendations match the visible catalog. Preserve existing pages, maps, authentication, dashboard, analytics, forms, and database contracts.

## Voice assistant and transcript capture

Replace the non-working hosted Retell orb iframe with Retell's documented website voice widget, loaded from Retell's official widget script and configured with the agent ID in `shared/retell.ts`, a browser-safe Retell voice public key, and AgentPlus title/logo/button styling. The widget itself supplies the call control; do not offer an “Open separately” link. If the public key is not configured, show an honest setup state rather than a blank iframe or fake working call. Do not hide Retell attribution with CSS; official white-labeling requires Retell's own white-label token.

Add a public `/api/retell/webhook` endpoint that captures the exact raw request body, verifies `X-Retell-Signature` with HMAC-SHA256 and the server-only Retell API key, rejects stale timestamps and unrelated agent IDs, and accepts transcript updates/final analyzed calls only. Use the shared agent ID, read dynamic variables from Retell's documented payload, and look up existing calls directly by ID rather than scanning a capped inbox. Upsert each conversation by Retell call ID into the existing Supabase-backed `agentplus_orders` persistence, with source `retell-voice`, the full transcript in requirements, available summary/contact data, and preserved admin status on later transcript updates. Require Supabase persistence before acknowledging an event; return a retryable error rather than fall back to an in-memory or non-atomic Redis write.

The existing admin lead inbox is the operator view: show voice calls as clearly labeled voice leads with their transcripts, and refresh it on transcript-update events over the existing authenticated SSE stream. Voice requests that contain an order remain recorded in that same lead/order workflow; the inbox must not imply an order was confirmed solely because a caller discussed buying.

## Configuration dependency

The share-orb URL/token does not provide the documented widget public key, webhook signature key, or permission to remove Retell branding. Required server-side setting: `RETELL_API_KEY` with Retell webhook signing support. Required browser-safe setting: `VITE_RETELL_VOICE_PUBLIC_KEY`, restricted to the AgentPlus domains. Retell must send `transcript_updated` and `call_analyzed` events to `https://agentsplus.online/api/retell/webhook`. The existing `SUPABASE_URL`, service-role key, and `agentplus_orders` table must be usable; no webhook data is acknowledged until the Supabase upsert succeeds. Never place the private API key in frontend code, commit it, or request it in chat. Until these account-side values are configured, the new widget and durable transcript capture cannot be verified as live.

## Design and existing project structure

- **Chosen movement:** restrained dark editorial design in the existing AgentPlus charcoal/orange visual language.
- **Core principles:** honest setup feedback, trustworthy attribution, visible conversation history, and an uncluttered call entry.
- **Interaction:** Retell's official widget owns call start/end; voice webhook events update a single durable lead rather than creating duplicate orders.
- **Typography and brand voice:** retain Space Grotesk / DM Sans and AgentPlus's direct, practical tone.
- `client/src/components/AgentPlusVoice.tsx` and its CSS own widget loading and setup/error state.
- `client/src/pages/Home.tsx` keeps the AgentPlusAI voice entry in the hero.
- `shared/retell.ts` owns the agent ID used on both sides; `server/retell.ts` owns Retell signature and payload helpers; `server/index.ts` owns the webhook route and persistence.
- `client/src/pages/Admin.tsx` uses the existing lead inbox and SSE stream for transcript display/refresh.
- `.env.example` and `README.md` document variable names and Retell webhook setup without values.
