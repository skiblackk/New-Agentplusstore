# AgentPlus Store

AgentPlus Store is a Vite/React storefront with an Express API deployed to Vercel. Its server-side data is stored in Supabase; do not expose the Supabase service-role key in a `VITE_` variable or client bundle.

## Local development

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm test
pnpm build
```

Copy `.env.example` to `.env.local` for local integrations. The repository tests that need external credentials are skipped unless their environment variables are supplied. Set `TEST_BASE_URL` to opt into the live browser-push endpoint smoke test.

## Supabase

The production Supabase project is `evjmldyntpadgcqxxlzp`. For a new database, apply `supabase/schema.sql`. The additive `supabase/production-repair-migration.sql` is the repair applied to the connected production project; it creates missing app tables plus the server-only rate-limit RPC without deleting existing data.

The API uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on the server. RLS is enabled on app tables and browser roles have no direct table policies; all data access goes through authenticated server routes.

## Vercel environment variables

Set server-side values in the `newagentplusstore` Vercel project:

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a strong unique `ADMIN_PASSWORD` are required for persistence and admin access.
- `GROQ_API_KEY` enables AI responses.
- `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` enable browser push; set both or neither.
- `VITE_FRONTEND_FORGE_API_KEY` and `VITE_FRONTEND_FORGE_API_URL` are map-provider settings. The `VITE_` key is client-visible, so use a restricted public key.
- `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID` are optional. Analytics only loads when both are set.

Never commit real `.env` files, Supabase service-role keys, admin passwords, Groq keys, or VAPID private keys.
