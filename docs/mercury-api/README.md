# Mercury API — Field Knowledge

An Understand Anything knowledge graph for Connective's Mercury Public API
(Sandbox) — the loan/CRM REST API used by Finhub's Mercury CRM integration.
Every documented endpoint and schema field, the 6 endpoints and ~20
Opportunity fields production has that the Swagger spec doesn't, known spec
bugs, and live-CRM-constrained enum values (statuses, contact categories,
panel lenders) pulled from Finhub's connected Mercury CRM on 2026-07-17.

Layered on top of that: the **field & UI-enum model** — 482 fields across 28
object schemas, all 32 enums (547 values) mapped to the UI control each one
implies, the 19 free-text fields that are constrained in practice anyway, and
the format/casing/writability traps that no enum describes. This is the half
you need to build a form against Mercury without shipping a dropdown that
can't express a value the server will happily store.

This is a hand-curated knowledge graph, not the output of Understand
Anything's normal source-analysis pipeline — the "codebase" being modelled
is an external API spec plus a wiki usage-guide export and a live data pull,
not TypeScript/JS source in this repo.

## Files

### Generated (do not hand-edit — re-run the scripts below)

- `knowledge-graph.json` — the knowledge graph (186 nodes, 460 edges, 12
  layers, 14 tour steps), validated against `@understand-anything/core`'s
  `validateGraph` with zero issues.
- `field-and-enum-reference.md` — the field & UI-enum model for humans:
  every enum with its values, control and hazards; the soft-enum table; the
  non-enum field hazards; and the full per-schema field inventory.
- `ui-enum-bindings.json` — the same model for machines. Includes a
  `fieldIndex` mapping `Schema.field` → `{ enum, control, optionCount,
  apiValidated }`, so a form builder doesn't have to invert anything.

### Source reference (inputs, committed for reproducibility)

- `mercury-api.openapi.json` — OpenAPI 3.1 live-audited contract
  (2026-07-18). 33 path templates, 53 operations, `x-evidence` on every path.
  Supersedes the Swagger 2.0 material for field-level questions, and fixes
  the `Address.country` YAML bug (Norway is the string `"NO"`, not `false`).
- `mercury-api.enumcatalog.json` — the 32 named enums and their 547 values.
- `mercury-api.types.live-audited.ts` — generated TypeScript types matching
  that contract.
- `live-audit-coverage.md` — what the read-only census actually covered, and
  what it explicitly does not establish (requiredness, writability,
  validation boundaries, pagination limits, several nested item shapes).
- `mercury-api-reference.md` — the earlier reference: endpoint catalog,
  schema definitions, notable spec issues, live CRM data, and usage guide.
- `mercury-api-types.ts` — the earlier generated TypeScript types.

## Regenerating

Both generators build from the committed source data rather than hand-typed
JSON, so a contract refresh flows straight through: drop in a new
`mercury-api.openapi.json` / `mercury-api.enumcatalog.json` and re-run.

```bash
node scripts/generate-mercury-field-enum-reference.mjs  # → *.md + ui-enum-bindings.json
node scripts/generate-mercury-api-graph.mjs             # → knowledge-graph.json
```

The field/enum derivation is shared between them
(`scripts/lib/mercury-field-enum-model.mjs`), so the graph and the reference
docs cannot disagree about what the contract says. That module is also where
the curated half lives — which control each enum implies, and what makes a
naive binding wrong on the wire.

The graph generator also writes `.understand-anything/knowledge-graph.json`
at the repo root (gitignored, local-preview only). Note that leaving that file
in place makes the dashboard dev server serve staleness data, which the
`vite-staleness` suite asserts 404s — delete `.understand-anything/` before
running `pnpm test`.

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
**KNOWLEDGE**. Enums are `schema` nodes (`enum:AuState`), soft enums and
field hazards are `concept` nodes.

Useful searches: a field name (`motorVehiceYear`, `webPassword`,
`transactionType`) jumps to the node documenting its quirk; a control name
(`typeahead`, `creatable-select`) collects every enum that needs it; and
`catalog-only` collects the three value sets that look like enums but aren't
enforced.
