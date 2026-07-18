# Mercury API — Field Knowledge

An Understand Anything knowledge graph for Connective's Mercury Public API
(Sandbox) — the loan/CRM REST API used by Finhub's Mercury CRM integration.
Every documented endpoint and schema field, the 6 endpoints and ~20
Opportunity fields production has that the Swagger spec doesn't, known spec
bugs, and live-CRM-constrained enum values (statuses, contact categories,
panel lenders) pulled from Finhub's connected Mercury CRM on 2026-07-17.

This is a hand-curated knowledge graph, not the output of Understand
Anything's normal source-analysis pipeline — the "codebase" being modelled
is an external API spec plus a wiki usage-guide export and a live data pull,
not TypeScript/JS source in this repo.

## Files

- `mercury-api-reference.md` — source reference: endpoint catalog, schema
  definitions, notable spec issues, live CRM data, and usage guide.
- `mercury-api-types.ts` — source reference: generated TypeScript types for
  the API.
- `knowledge-graph.json` — the generated knowledge graph (123 nodes, 263
  edges, 10 layers, 10 tour steps), validated against
  `@understand-anything/core`'s `validateGraph` with zero issues.

## Regenerating

The graph is built by `scripts/generate-mercury-api-graph.mjs` from
structured data (not hand-typed JSON), so it's easy to extend if the API
reference material changes:

```bash
node scripts/generate-mercury-api-graph.mjs
```

This writes to `docs/mercury-api/knowledge-graph.json` (committed) and to
`.understand-anything/knowledge-graph.json` at the repo root (gitignored,
local-preview only).

## Previewing in the dashboard

`.understand-anything/` is gitignored and picked up automatically by the
dashboard dev server, so after regenerating you can preview it without
touching the repo's own self-analysis demo data at
`understand-anything-plugin/packages/dashboard/public/knowledge-graph.json`:

```bash
pnpm --filter @understand-anything/core build   # if not already built
node scripts/generate-mercury-api-graph.mjs
pnpm dev:dashboard
```

Open the printed `Dashboard URL` (includes an access token). Node types map
to dashboard filter categories as follows: `endpoint`/`schema` → **DATA**,
`domain`/`flow`/`step` → **DOMAIN**, `concept` → **CODE**, `claim`/`source` →
**KNOWLEDGE**. Try searching for a specific field name (e.g.
`motorVehiceYear`, `webPassword`, `leadSourceId`) to jump straight to the
node documenting its quirk.
