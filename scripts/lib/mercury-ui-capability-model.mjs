/**
 * Mercury API — UI capability & documentation-conflict model.
 *
 * The field/enum model (mercury-field-enum-model.mjs) answers "what values does
 * this field accept?". This one answers the two questions either side of it:
 *
 *   1. Which Mercury Nexus UI surfaces have a public API behind them at all, and
 *      at what evidence level — so a client doesn't promise a screen it can't reach.
 *   2. Where the published guides and the contract disagree about a literal value,
 *      field name or default — the conflicts that produce a request the wire
 *      rejects even though it matches the documentation.
 *
 * The conflicts are *checked at generate time* against the committed contract
 * rather than asserted from prose. If a contract refresh resolves one, the
 * generator reports it as resolved instead of repeating a stale claim.
 *
 * Sources (all committed under docs/mercury-api/):
 *   mercury-ui-to-public-api-mapping.json  — capability registry (UI area → API resource, status)
 *   mercury-ui-to-public-api-mapping.md    — the human-readable map it summarises
 *   connective-mercury-research-report.md  — the wiki/API research pass the conflicts come from
 *   mercury-api.openapi.json               — the contract each conflict is checked against
 *   mercury-api.enumcatalog.json           — the enum values each conflict is checked against
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DOCS_DIR = resolve(repoRoot, "docs/mercury-api");

// ─────────────────── evidence levels ───────────────────

/**
 * The registry's `status` values, ordered weakest-to-strongest, with what each
 * one licenses a client to actually do.
 */
export const EVIDENCE_LEVELS = {
  no_public_api_evidence: {
    rank: 0,
    label: "No public API evidence",
    licenses: "Nothing. The UI surface exists; no public route is documented for it. Do not expose a tool, and do not infer an endpoint from the UI label.",
  },
  partial: {
    rank: 1,
    label: "Partial",
    licenses: "A write shape or a read path is documented, but a companion capability is missing — typically discovery. Usable only when the caller supplies the identifiers.",
  },
  confirmed_write_unverified: {
    rank: 2,
    label: "Confirmed, writes unverified",
    licenses: "The route is documented and reads are confirmed, but no write was tested. Gate mutations behind an explicit confirmation and a fresh read.",
  },
  confirmed: {
    rank: 3,
    label: "Confirmed",
    licenses: "Route and shape are documented and corroborated by the production read census. Safe to build against; write semantics still deserve a fresh-GET-then-diff.",
  },
};

// ─────────────────── conditional enum options ───────────────────

/**
 * `Asset.name` and `Liability.name` are flat enums in the contract, but the
 * published guides partition them by `type`. That makes the name list a
 * *dependent* option set: choosing a type should narrow the names, and choosing
 * a name should imply the type.
 *
 * Also note Liability documents only two of the four `AssetLiabilityType`
 * values — `realEstate` and `vehicle` are asset-only, despite both entities
 * sharing one enum.
 */
export const ASSET_NAME_BY_TYPE = {
  realEstate: ["Real Estate"],
  account: ["Cheque Account", "Term Deposit", "Investment Savings", "Cash Management", "Savings Account"],
  standard: [
    "Charge Over Cash", "Home Contents", "Guarantee", "Business Entity", "Life Insurance",
    "Managed Funds", "Debenture Charge", "Boat", "Shares", "Other", "Gifts", "Superannuation",
  ],
  vehicle: ["Motor Vehicle"],
};

export const LIABILITY_NAME_BY_TYPE = {
  account: [
    "Overdraft", "Loan As Guarantor", "Other", "Line Of Credit", "Term Loan",
    "Mortgage Loan", "Store Card", "Credit Card", "Personal Loan", "Other Loan",
  ],
  standard: ["Lease", "Hire Purchase", "Outstanding Taxation", "Commercial Bill", "HECS", "Maintenance"],
};

// ─────────────────── conflicts ───────────────────

/**
 * Each conflict names a documented claim, the contract's position, and a `check`
 * that re-derives whether the discrepancy still exists. A check returns
 * { present, detail } — `present: false` means a contract refresh resolved it.
 */
const CONFLICTS = [
  {
    id: "asset-name-business-entity-vs-equity",
    severity: "high",
    topic: "Asset.name",
    documented: "The asset guide lists `Business Entity` among the `standard` asset names.",
    contract: "The enum catalog carries `Business Equity`.",
    consequence:
      "Exactly one string differs across an otherwise identical 19-value list. A form seeded from the guide sends a value the enum does not contain. Send the enum's spelling; treat the guide as a typo until a write test proves otherwise.",
    check: ({ enums }) => {
      const names = new Set(enums.AssetName);
      return {
        present: names.has("Business Equity") && !names.has("Business Entity"),
        detail: `enum has ${names.has("Business Equity") ? "`Business Equity`" : "neither"}; guide says \`Business Entity\``,
      };
    },
  },
  {
    id: "related-party-primary-applicant-casing",
    severity: "high",
    topic: "RelatedParty.relationship",
    documented: "The related-parties guide's worked example sends `relationship: \"Primary Applicant\"` — capital A.",
    contract: "The enum value is `Primary applicant` — lowercase a.",
    consequence:
      "Copying the guide's example verbatim sends a value outside the enum. This is the documented example for the single most common related-party write, so it is the likeliest of these conflicts to be hit first.",
    check: ({ enums }) => {
      const rel = new Set(enums.RelatedPartyRelationship);
      return {
        present: rel.has("Primary applicant") && !rel.has("Primary Applicant"),
        detail: "enum: `Primary applicant`; guide example: `Primary Applicant`",
      };
    },
  },
  {
    id: "contact-search-lastmodified-vs-lastupdated",
    severity: "medium",
    topic: "ContactSearchParams",
    documented: "The April 2026 contact-search guide lists a `lastModified` filter key.",
    contract: "`ContactSearchParams` declares `lastUpdated`.",
    consequence:
      "A delta-sync built from the guide's key silently filters on nothing and re-reads the whole collection every run. Same hazard on the sort key: the guide's `sortKey: \"lastModifiedDate\"` is not a contract parameter at all.",
    check: ({ schemas }) => {
      const props = Object.keys(schemas.ContactSearchParams.properties);
      return {
        present: props.includes("lastUpdated") && !props.includes("lastModified"),
        detail: `contract: ${props.includes("lastUpdated") ? "`lastUpdated`" : "neither"}; guide: \`lastModified\``,
      };
    },
  },
  {
    id: "address-country-full-name-vs-code",
    severity: "high",
    topic: "Address.country",
    documented: "The person-creation guide's payload example sends `country: \"Australia\"`.",
    contract: "`Address.country` is a 250-value code enum; the Australian value is `AU`.",
    consequence:
      "A country control seeded from the guide sends a display name where a code is required. The 250-value list also is not current ISO 3166-1 — it retains the withdrawn `AN` — so validating against an ISO library rejects values Mercury accepts.",
    check: ({ schemas }) => {
      const codes = schemas.Address.properties.country.enum ?? [];
      return {
        present: codes.includes("AU") && !codes.includes("Australia"),
        detail: `contract: \`AU\` (${codes.length} codes); guide example: \`Australia\``,
      };
    },
  },
  {
    id: "search-count-default-25-vs-100",
    severity: "medium",
    topic: "GET /contacts, GET /opportunities",
    documented: "The search guide says an unfiltered search returns the 25 newest records, and that `count` defaults to 25 with a maximum of 100.",
    contract: "The contract declares `count` with a default of 100 and states no maximum.",
    consequence:
      "The two disagree about the default page size and the contract does not encode the cap at all. Always send `count` explicitly rather than relying on either default, and treat 100 as the ceiling until Connective confirms otherwise.",
    check: ({ openapi }) => {
      const p = openapi.paths["/{token}/contacts"].get.parameters.find((x) => x.name === "count");
      return {
        present: p?.schema?.default === 100,
        detail: `contract default: ${p?.schema?.default ?? "unset"}; guide: 25 (max 100)`,
      };
    },
  },
  {
    id: "webhook-active-string-vs-boolean",
    severity: "medium",
    topic: "ContactHookRequestBody.active, OppHookRequestBody.active",
    documented: "The webhook guide's registration example sends `active: \"true\"` — a string.",
    contract: "Both hook request bodies declare `active` as a boolean.",
    consequence:
      "This is the request-side twin of the response-side string-boolean hazard on `Opportunity.isNCCPEnabled`. Neither form is write-tested. Send the contract's boolean; be ready for the string to be what the service actually wants.",
    check: ({ schemas }) => {
      const a = schemas.ContactHookRequestBody.properties.active;
      return { present: a?.type === "boolean", detail: `contract: ${a?.type}; guide example: string "true"` };
    },
  },
  {
    id: "search-params-not-in-contract",
    severity: "high",
    topic: "GET /contacts, GET /opportunities",
    documented:
      "The guides document `searchParams` (a URL-encoded JSON filter object), `sortKey` (`creationDate` / `lastModifiedDate`) and `sortOrder` (`ASC` / `DESC`) as query parameters.",
    contract: "The contract's collection GETs declare only `search`, `count` and `offset`.",
    consequence:
      "Every documented filter — the entire `ContactSearchParams` / `OpportunitySearchParams` vocabulary — travels through a query parameter the contract never declares. The schemas exist; the parameter carrying them does not. Anything generated straight from the contract can paginate but cannot filter or sort.",
    check: ({ openapi }) => {
      const names = openapi.paths["/{token}/contacts"].get.parameters.map((p) => p.name);
      const missing = ["searchParams", "sortKey", "sortOrder"].filter((n) => !names.includes(n));
      return { present: missing.length > 0, detail: `absent from the contract: ${missing.join(", ") || "none"}` };
    },
  },
  {
    id: "liability-type-subset",
    severity: "medium",
    topic: "Liability.type",
    documented: "The liabilities guide documents only `account` and `standard` liability types.",
    contract: "`Liability.type` carries the full 4-value `AssetLiabilityType`, including `realEstate` and `vehicle`.",
    consequence:
      "Asset and Liability share one type enum, but half its values are asset-only in the documentation. A shared type control offers two options on liabilities that no guide supports and no name list covers.",
    check: ({ enums }) => {
      const all = new Set(enums.AssetLiabilityType);
      const documented = new Set(Object.keys(LIABILITY_NAME_BY_TYPE));
      const extra = [...all].filter((t) => !documented.has(t));
      return { present: extra.length > 0, detail: `undocumented for Liability: ${extra.join(", ")}` };
    },
  },
  {
    id: "rate-limit-conflict",
    severity: "medium",
    topic: "Throttling",
    documented:
      "The May 2025 Getting Started page says 20 requests/second and 144,000/day; the March 2026 FAQ says 60/second and 40,000/day.",
    contract: "The contract states no rate limit.",
    consequence:
      "The daily figures differ by more than 3×, and the newer source is the *lower* daily allowance. Neither describes rolling windows or per-branch allocation. Budget against the intersection — ≤20/second and ≤40,000/day — until Connective confirms the branch quota in writing.",
    check: () => ({ present: true, detail: "unresolvable from the contract; both figures are documentation-only" }),
  },
  {
    id: "person-id-casing-outbound",
    severity: "high",
    topic: "RelatedParty.personID",
    documented: "The related-parties guide sends `personID` (capital ID) on writes; the financials extensions use `personId` in their splits.",
    contract: "Both casings appear across the contract's schemas, on different resources.",
    consequence:
      "This is not a normalisation opportunity. Send the casing the specific resource documents — `personID` on related parties, `personId` in extension splits — and accept either on the way in. A generic camelCase converter applied at the client boundary corrupts outbound writes.",
    check: ({ schemas }) => {
      const upper = Object.entries(schemas).filter(([, s]) => s.properties?.personID).map(([n]) => n);
      const lower = Object.entries(schemas).filter(([, s]) => s.properties?.personId).map(([n]) => n);
      return {
        present: upper.length > 0 && lower.length > 0,
        detail: `personID on ${upper.join(", ")}; personId on ${lower.join(", ")}`,
      };
    },
  },
];

// ─────────────────── operational constraints ───────────────────

/**
 * Facts from the research pass that constrain a client's architecture rather
 * than any single field. Kept here because they belong with the capability
 * boundary, not with the wire types.
 */
export const OPERATIONAL_CONSTRAINTS = [
  {
    id: "no-sandbox",
    title: "There is no sandbox — every call is production",
    detail:
      "Connective's current FAQ states no UAT or sandbox environment exists, and API-created records appear in the normal Mercury Nexus interface. The 2021 Swagger file labels itself \"Sandbox\", which is documentation residue, not an environment. Every successful POST, PUT, soft-delete, hook registration or extension replacement changes a live CRM holding real client data.",
    impact: "Write tooling needs a fresh read, a human-readable diff and explicit confirmation — there is nowhere else to try it.",
  },
  {
    id: "no-delete-verb",
    title: "Soft delete only; DELETE exists for webhooks alone",
    detail:
      "CRM records and their children are deleted with `PUT { isDeleted: true }`, which sends them to the Nexus recycle bin. The only DELETE routes in the API are the two webhook-unregistration endpoints. UI restore exists; an API restore path has not been confirmed.",
    impact: "Never model a CRM delete as an HTTP DELETE, and do not promise restore.",
  },
  {
    id: "credential-shape",
    title: "Group key in the header, branch token in the path",
    detail:
      "`x-api-key` identifies the broker group; the token path segment identifies one branch. A virtual-branch group shares the key but each branch has its own token, so the token — not the key — selects which data is visible. Both come from Admin → Integrations and need Partner Level access.",
    impact: "Model credentials as `{ groupApiKey, branchToken }`. A token is a data-scope selector, not a permission bypass; redact the path segment in telemetry.",
  },
  {
    id: "webhooks-miss-bulk-import",
    title: "Webhooks miss bulk imports",
    detail:
      "Hooks fire for UI and API changes to contacts and opportunities and their listed children, and for bulk category/relationship-manager assignment — but explicitly not for bulk contact import. Delivery carries the full aggregate; there is no documented signature, retry policy, ordering guarantee or delivery id. A receiver returning 410 unregisters the hook.",
    impact: "A webhook-only sync silently misses imported contacts. Pair hooks with a scheduled ascending delta scan, and make 410 a deliberate decommission rather than an error path.",
  },
  {
    id: "lead-source-creates-taxonomy",
    title: "Writing a lead source can create one",
    detail:
      "Lead source is written as a nested object taking `leadSourceId`, `leadSourceDisplay` or both. A display value that doesn't exist may be created and assigned. There is no documented endpoint for listing lead sources.",
    impact: "Require an existing approved id by default. Passing an unvalidated display string from an upstream form lets that form mint branch taxonomy.",
  },
  {
    id: "no-category-discovery",
    title: "Categories can be assigned but not discovered",
    detail:
      "`Contact.categories[]` accepts category ids on write, but no public route lists or creates categories. The 15 known names came from a live pull, not an endpoint.",
    impact: "Category assignment only works with externally supplied ids. A picker cannot populate itself from the API.",
  },
];

// ─────────────────── builder ───────────────────

export function buildUiCapabilityModel({
  mappingPath = resolve(DOCS_DIR, "mercury-ui-to-public-api-mapping.json"),
  openapiPath = resolve(DOCS_DIR, "mercury-api.openapi.json"),
  enumCatalogPath = resolve(DOCS_DIR, "mercury-api.enumcatalog.json"),
} = {}) {
  const mapping = JSON.parse(readFileSync(mappingPath, "utf8"));
  const openapi = JSON.parse(readFileSync(openapiPath, "utf8"));
  const enums = JSON.parse(readFileSync(enumCatalogPath, "utf8")).enums;
  const schemas = openapi.components.schemas;
  const ctx = { openapi, schemas, enums };

  const capabilities = mapping.capabilities.map((c) => {
    const level = EVIDENCE_LEVELS[c.status];
    if (!level) throw new Error(`Unknown capability status "${c.status}" on "${c.ui}"`);
    return {
      ui: c.ui,
      resource: c.resource,
      operations: c.operations ?? [],
      tools: c.tool ? c.tool.split("|") : [],
      status: c.status,
      statusLabel: level.label,
      statusRank: level.rank,
      licenses: level.licenses,
      notes: c.notes ?? null,
      /** A UI surface with no route behind it — the deliberate negative space. */
      isGap: level.rank === 0,
    };
  });

  const conflicts = CONFLICTS.map((c) => {
    const { present, detail } = c.check(ctx);
    return {
      id: c.id,
      severity: c.severity,
      topic: c.topic,
      documented: c.documented,
      contract: c.contract,
      consequence: c.consequence,
      stillPresent: present,
      verifiedDetail: detail,
    };
  });

  // Coverage check on the dependent name lists: do the documented per-type
  // partitions actually account for every enum value?
  const dependentOptions = [
    { field: "Asset.name", dependsOn: "Asset.type", enumName: "AssetName", byType: ASSET_NAME_BY_TYPE },
    { field: "Liability.name", dependsOn: "Liability.type", enumName: "LiabilityName", byType: LIABILITY_NAME_BY_TYPE },
  ].map((d) => {
    const enumValues = new Set(enums[d.enumName]);
    const documented = new Set(Object.values(d.byType).flat());
    return {
      ...d,
      types: Object.keys(d.byType),
      enumValueCount: enumValues.size,
      documentedValueCount: documented.size,
      unaccountedEnumValues: [...enumValues].filter((v) => !documented.has(v)),
      documentedValuesNotInEnum: [...documented].filter((v) => !enumValues.has(v)),
    };
  });

  return {
    generatedFrom: {
      mapping: `${mapping.title} ${mapping.version}`,
      baseUrl: mapping.baseUrl,
    },
    idRules: mapping.idRules,
    mutationPolicy: mapping.mutationPolicy,
    stats: {
      capabilities: capabilities.length,
      confirmed: capabilities.filter((c) => c.status === "confirmed").length,
      writeUnverified: capabilities.filter((c) => c.status === "confirmed_write_unverified").length,
      partial: capabilities.filter((c) => c.status === "partial").length,
      gaps: capabilities.filter((c) => c.isGap).length,
      conflicts: conflicts.length,
      conflictsStillPresent: conflicts.filter((c) => c.stillPresent).length,
      operationalConstraints: OPERATIONAL_CONSTRAINTS.length,
    },
    capabilities,
    conflicts,
    dependentOptions,
    operationalConstraints: OPERATIONAL_CONSTRAINTS,
    evidenceLevels: EVIDENCE_LEVELS,
  };
}
