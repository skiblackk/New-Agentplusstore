# AgentPlus pricing update plan

## Approach

Replace the stale homepage agent-only pricing cards with a shared, typed pricing catalog used by the homepage and `/services`. The catalog will contain Website, AI Agent, Custom Software, and Maintenance packages with USD starting prices, approximate KSh planning equivalents, scope notes, and CTA labels. The homepage will provide a working Websites / AI Agents / Custom Software switcher plus a maintenance section. Every CTA will open the existing `OrderDialog`, which will accept the selected package, display its starting price, collect the existing customer and project requirements, and submit to `/api/inquiries` for the existing admin inbox.

Update `/services` to present the five new professional service packages and reuse the same order flow. Update Aria and Atlas server prompts so their recommendations and quoted ranges match the visible catalog. Preserve the existing hero, agents, maps, authentication, admin dashboard, analytics, forms, and database contracts.

## Design

- **Chosen movement:** restrained dark editorial pricing, integrated into the existing AgentPlus charcoal/orange/violet visual language rather than a new visual system.
- **Core principles:** clear scope boundaries, comparable package cards, honest starting-price language, and low-friction consultation CTAs.
- **Interaction:** tabs update the visible package set; cards use existing reveal/hover motion; buttons open the real inquiry dialog with the selected package prefilled.
- **Typography and brand voice:** retain the existing Space Grotesk / DM Sans hierarchy and AgentPlus’s direct, practical tone.

## Structure

- `client/src/data/pricing.ts`: shared package types, pricing catalog, KSh planning conversion, and tab groups.
- `client/src/pages/Home.tsx`: pricing switcher, package cards, maintenance section, and real CTA wiring.
- `client/src/pages/Services.tsx`: service catalog using the same package data and order dialog.
- `client/src/components/OrderDialog.tsx`: generalized package metadata and truthful scope-aware form copy.
- `client/src/index.css`: responsive premium pricing-card, switcher, and maintenance styles.
- `server/index.ts`: current Aria and Atlas package knowledge update only.
