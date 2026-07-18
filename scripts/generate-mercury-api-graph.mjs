#!/usr/bin/env node
/**
 * Generate a knowledge graph for the Mercury Public API (Sandbox) — Connective's
 * loan/CRM REST API — as an Understand Anything knowledge graph (kind: "codebase",
 * using the domain/flow/step/endpoint/schema node types).
 *
 * This is a hand-curated "knowledge" graph, not the output of the normal
 * source-analysis pipeline: the "codebase" being modelled is an external API
 * spec (Mercury Public API (Sandbox).yaml) plus a wiki usage-guide export and a
 * live production data pull, not TypeScript/JS source in this repo.
 *
 * Source material:
 *   docs/mercury-api/mercury-api-reference.md  — endpoint + schema catalog, spec
 *                                                 issues, live CRM data, usage guide
 *   docs/mercury-api/mercury-api-types.ts      — generated TypeScript types
 *
 * Usage:
 *   node scripts/generate-mercury-api-graph.mjs
 *
 * Writes to docs/mercury-api/knowledge-graph.json (committed) and, if a local
 * .understand-anything/ directory exists or can be created, also to
 * .understand-anything/knowledge-graph.json (gitignored — lets you preview via
 * `pnpm dev:dashboard` from the repo root without touching the repo's own
 * self-analysis demo data at packages/dashboard/public/knowledge-graph.json).
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

// ───────────────────────── helpers ─────────────────────────

const nodes = [];
const edges = [];

function node(n) {
  nodes.push(n);
  return n.id;
}

function edge(source, target, type, opts = {}) {
  edges.push({
    source,
    target,
    type,
    direction: opts.direction ?? "forward",
    weight: opts.weight ?? 0.6,
    ...(opts.description ? { description: opts.description } : {}),
  });
}

function fieldList(fields) {
  // fields: [name, type, note?]
  return fields
    .map(([name, type, note]) => `${name} (${type})${note ? ` — ${note}` : ""}`)
    .join("; ");
}

function fieldTags(fields) {
  return fields.map(([name]) => name.toLowerCase());
}

// ───────────────────────── domains ─────────────────────────

const DOMAIN_ROOT = node({
  id: "domain:mercury-api",
  type: "domain",
  name: "Mercury Public API (Sandbox)",
  summary:
    "Connective's Mercury loan/CRM REST API. Swagger 2.0 spec, host apis.connective.com.au, basePath /mercury/v1. Auth is a {token} path segment plus an x-api-key header (not a bearer header). 53 documented endpoints across 4 resource groups (Opportunities, Contacts, Partner Config, Categories) plus 6 endpoints that exist in production but are entirely absent from the Swagger spec (the extension/livingExpense and extension/otherIncome routes).",
  tags: ["mercury", "connective", "rest-api", "swagger-2.0", "loan-crm", "root"],
  complexity: "complex",
  domainMeta: {
    entities: [
      "Opportunity",
      "Contact",
      "PartnerConfig",
      "Category",
      "Asset",
      "Liability",
      "RelatedParty",
      "Address",
    ],
  },
});

const DOMAIN_OPPORTUNITIES = node({
  id: "domain:opportunities",
  type: "domain",
  name: "Opportunities",
  summary:
    "Loan/deal records and their nested sub-resources: assets, liabilities, related parties, plus webhook subscriptions. 15 documented endpoints. An Opportunity is the loan-application-level object — amount, lender, status, settlement dates — with an isDeleted soft-delete flag.",
  tags: ["opportunities", "loans", "deals"],
  complexity: "complex",
});

const DOMAIN_CONTACTS = node({
  id: "domain:contacts",
  type: "domain",
  name: "Contacts",
  summary:
    "Person/entity records and their nested sub-resources: contact methods, expenses, incomes, identification documents, addresses, employments. 25 documented endpoints. Contact.isDeleted must be filtered false on every search unless deleted records are explicitly wanted.",
  tags: ["contacts", "people", "crm"],
  complexity: "complex",
});

const DOMAIN_PARTNER_CATEGORIES = node({
  id: "domain:partner-config-categories",
  type: "domain",
  name: "Partner Config & Categories",
  summary:
    "Broker-group-level configuration (branding, feature toggles via PartnerConfig key/value pairs) and Contact categorisation (Category, used for marketing segmentation). 7 documented endpoints.",
  tags: ["partner-config", "categories", "branding", "segmentation"],
  complexity: "moderate",
});

const DOMAIN_EXTENSION = node({
  id: "domain:extension-endpoints",
  type: "domain",
  name: "Extension Endpoints (undocumented)",
  summary:
    "6 Opportunity sub-resource endpoints (livingExpense, otherIncome — GET/POST/PUT each) that exist in production but are entirely absent from the Swagger YAML. Only discoverable via a wiki export sitting alongside the spec, not the spec itself. Both follow the same shape: a wrapper record whose `value` field is a JSON-encoded string (not structured JSON) containing an array of line items.",
  tags: ["extension", "undocumented", "living-expense", "other-income"],
  complexity: "moderate",
});

const DOMAIN_LIVE_DATA = node({
  id: "domain:live-crm-data",
  type: "domain",
  name: "Live Data, Spec Issues & Field-Level Gotchas",
  summary:
    "Cross-cutting knowledge that doesn't live in any single endpoint or schema: bugs in the static Swagger spec, fields the spec declares as unconstrained free text but that production actually constrains to fixed value sets (pulled live from Finhub's connected Mercury CRM on 2026-07-17), and fields present on live records with no equivalent in the spec at all.",
  tags: ["spec-issues", "live-data", "gotchas", "field-quirks"],
  complexity: "complex",
});

edge(DOMAIN_ROOT, DOMAIN_OPPORTUNITIES, "contains", { weight: 1 });
edge(DOMAIN_ROOT, DOMAIN_CONTACTS, "contains", { weight: 1 });
edge(DOMAIN_ROOT, DOMAIN_PARTNER_CATEGORIES, "contains", { weight: 1 });
edge(DOMAIN_ROOT, DOMAIN_EXTENSION, "contains", { weight: 1 });
edge(DOMAIN_ROOT, DOMAIN_LIVE_DATA, "contains", { weight: 0.8 });

// ───────────────────────── sources ─────────────────────────

const SOURCE_SWAGGER = node({
  id: "source:mercury-sandbox-swagger-yaml",
  type: "source",
  name: "Mercury Public API (Sandbox).yaml",
  summary:
    "Swagger 2.0 spec, the canonical machine-readable definition of the Mercury Public API — host apis.connective.com.au, basePath /mercury/v1. 39 documented endpoints (the Opportunities/Contacts/Partner Config/Categories groups) and 26 schema definitions. Known to contain at least 3 bugs: the Address.country enum YAML-parses Norway's `NO` code as boolean false, an operationId typo (Contact-dentification-create), and a field-name typo (motorVehiceYear).",
  tags: ["swagger", "source-spec", "yaml"],
  complexity: "simple",
  knowledgeMeta: { category: "primary-source" },
});

const SOURCE_WIKI = node({
  id: "source:connective-wiki-export",
  type: "source",
  name: "Connective wiki export (usage guide + undocumented endpoints)",
  summary:
    "\"Managing Opportunities and contact.txt\" and a LOAN STATUS NAME export, found alongside the Swagger spec in the same reference folder but not part of the spec itself. The only source that documents the nested-entity CRUD-via-PUT convention, search/pagination query params, date-range search syntax, lead-source assignment merge logic, and the 6 extension/* endpoints entirely missing from the YAML.",
  tags: ["wiki-export", "usage-guide", "secondary-source"],
  complexity: "simple",
  knowledgeMeta: { category: "secondary-source" },
});

const SOURCE_LIVE_PULL = node({
  id: "source:live-mercury-crm-pull-20260717",
  type: "source",
  name: "Live Finhub Mercury CRM pull (2026-07-17)",
  summary:
    "Live data pulled via the Mercury CRM MCP (list_loan_statuses, list_contact_categories, list_panel_lenders) and a live authenticated GET against a real Finhub branch token/API key (schema-only inspection — field names/types extracted, response values never logged, raw response deleted). Confirms this hit a live production account (invoiceCafStatus, applicationPlatform, peBuildYear fields), not the sandbox. SECURITY NOTE: the API key and token used were pasted directly into chat rather than set as environment variables — rotate/regenerate both in the Mercury/Connective admin panel before relying on this account further.",
  tags: ["live-data", "production", "security-note", "credential-exposure"],
  complexity: "simple",
  knowledgeMeta: { category: "live-pull", content: "Broker-group-specific data — not part of the generic Mercury spec." },
});

edge(SOURCE_SWAGGER, DOMAIN_ROOT, "documents", { weight: 1 });
edge(SOURCE_WIKI, DOMAIN_EXTENSION, "documents", { weight: 0.9 });
edge(SOURCE_LIVE_PULL, DOMAIN_LIVE_DATA, "documents", { weight: 1 });

// ───────────────────────── endpoints ─────────────────────────

/**
 * group: which domain node owns this endpoint
 * schemas: schema ids this endpoint's request/response body is defined by
 */
const ENDPOINTS = [
  // Opportunities
  { op: "Opportunity-search", method: "GET", path: "/{token}/opportunities", group: DOMAIN_OPPORTUNITIES, schemas: ["schema:OpportunitySearchResult", "schema:OpportunitySearchParams"], note: "search=true (or present), count (max 100, default 25), offset (default 0), sortKey (creationDate|lastModifiedDate), sortOrder (ASC|DESC); complex filters via URL-encoded JSON in searchParams." },
  { op: "Opportunity-create", method: "POST", path: "/{token}/opportunities", group: DOMAIN_OPPORTUNITIES, schemas: ["schema:Opportunity"], note: "Can create with nested assets/liabilities/relatedParties in the same call without supplying nested uniqueIds — Mercury auto-generates them. Returns { uniqueId, emailId }." },
  { op: "Opportunity-get", method: "GET", path: "/{token}/opportunities/{id}", group: DOMAIN_OPPORTUNITIES, schemas: ["schema:Opportunity"] },
  { op: "Opportunity-update", method: "PUT", path: "/{token}/opportunities/{id}", group: DOMAIN_OPPORTUNITIES, schemas: ["schema:Opportunity"], note: "Also the sole mechanism for nested-entity create/update/soft-delete (keyed on uniqueId+isDeleted) and for top-level soft-delete ({ isDeleted: true }). No hard DELETE for Opportunities." },
  { op: "Opportunity-trigger", method: "POST", path: "/{token}/opportunities/hooks", group: DOMAIN_OPPORTUNITIES, schemas: ["schema:OppHookRequestBody", "schema:WebhookCreationResponse"], note: "Webhook subscription." },
  { op: "Delete-opportunity-trigger", method: "DELETE", path: "/{token}/opportunities/hooks/{hookId}", group: DOMAIN_OPPORTUNITIES, schemas: [], note: "The one true DELETE verb in the whole API — every other resource soft-deletes via PUT." },
  { op: "Opportunity-assets-get", method: "GET", path: "/{token}/opportunities/{id}/assets", group: DOMAIN_OPPORTUNITIES, schemas: ["schema:Asset"] },
  { op: "Opportunity-asset-create", method: "POST", path: "/{token}/opportunities/{id}/assets", group: DOMAIN_OPPORTUNITIES, schemas: ["schema:Asset"] },
  { op: "Opportunity-asset-update", method: "PUT", path: "/{token}/opportunities/{id}/assets/{assetId}", group: DOMAIN_OPPORTUNITIES, schemas: ["schema:Asset"] },
  { op: "Opportunity-liabilities-get", method: "GET", path: "/{token}/opportunities/{id}/liabilities", group: DOMAIN_OPPORTUNITIES, schemas: ["schema:Liability"] },
  { op: "Opportunity-liability-create", method: "POST", path: "/{token}/opportunities/{id}/liabilities", group: DOMAIN_OPPORTUNITIES, schemas: ["schema:Liability"] },
  { op: "Opportunity-liability-update", method: "PUT", path: "/{token}/opportunities/{id}/liabilities/{liabilityId}", group: DOMAIN_OPPORTUNITIES, schemas: ["schema:Liability"] },
  { op: "Opportunity-related-party-get", method: "GET", path: "/{token}/opportunities/{id}/relatedParties", group: DOMAIN_OPPORTUNITIES, schemas: ["schema:RelatedParty"] },
  { op: "Opportunity-related-party-create", method: "POST", path: "/{token}/opportunities/{id}/relatedParties", group: DOMAIN_OPPORTUNITIES, schemas: ["schema:RelatedParty"] },
  { op: "Opportunity-related-party-update", method: "PUT", path: "/{token}/opportunities/{id}/relatedParties/{relatedPartyId}", group: DOMAIN_OPPORTUNITIES, schemas: ["schema:RelatedParty"] },

  // Extension (undocumented in Swagger)
  { op: "Extension-livingExpense-get", method: "GET", path: "/{token}/opportunities/{id}/extension/livingExpense", group: DOMAIN_EXTENSION, schemas: ["schema:OpportunityExtensionRecord", "schema:LivingExpenseLineItem"], note: "Returns living-expense line items as a JSON-string blob in `value`. Undocumented in the Swagger spec — found in wiki export only." },
  { op: "Extension-livingExpense-create", method: "POST", path: "/{token}/opportunities/{id}/extension/livingExpense", group: DOMAIN_EXTENSION, schemas: ["schema:OpportunityExtensionRecord"], note: "Only call if GET did NOT already return a uniqueId — the extension record already existing means go straight to PUT." },
  { op: "Extension-livingExpense-update", method: "PUT", path: "/{token}/opportunities/{id}/extension/livingExpense", group: DOMAIN_EXTENSION, schemas: ["schema:OpportunityExtensionRecord"], note: "Destructive full-replace of the value array — must resend every existing line item or they are silently deleted. No partial-update/append semantic." },
  { op: "Extension-otherIncome-get", method: "GET", path: "/{token}/opportunities/{id}/extension/otherIncome", group: DOMAIN_EXTENSION, schemas: ["schema:OpportunityExtensionRecord", "schema:OtherIncomeLineItem"], note: "Returns other-income line items as a JSON-string blob in `value`." },
  { op: "Extension-otherIncome-create", method: "POST", path: "/{token}/opportunities/{id}/extension/otherIncome", group: DOMAIN_EXTENSION, schemas: ["schema:OpportunityExtensionRecord"] },
  { op: "Extension-otherIncome-update", method: "PUT", path: "/{token}/opportunities/{id}/extension/otherIncome", group: DOMAIN_EXTENSION, schemas: ["schema:OpportunityExtensionRecord"], note: "Destructive full-replace, same rule as livingExpense PUT." },

  // Contacts
  { op: "Contact-search", method: "GET", path: "/{token}/contacts", group: DOMAIN_CONTACTS, schemas: ["schema:ContactSearchResult", "schema:ContactSearchParams"] },
  { op: "Contact-create", method: "POST", path: "/{token}/contacts", group: DOMAIN_CONTACTS, schemas: ["schema:Contact"] },
  { op: "Contact-get", method: "GET", path: "/{token}/contacts/{id}", group: DOMAIN_CONTACTS, schemas: ["schema:Contact"] },
  { op: "Contact-update", method: "PUT", path: "/{token}/contacts/{id}", group: DOMAIN_CONTACTS, schemas: ["schema:Contact"], note: "Also handles nested-entity create/update/soft-delete for contactMethods/expenses/incomes/Identification/addresses, same uniqueId+isDeleted convention as Opportunity." },
  { op: "Contact-trigger", method: "POST", path: "/{token}/contacts/hooks", group: DOMAIN_CONTACTS, schemas: ["schema:ContactHookRequestBody", "schema:WebhookCreationResponse"] },
  { op: "Delete-contact-trigger", method: "DELETE", path: "/{token}/contacts/hooks/{hookId}", group: DOMAIN_CONTACTS, schemas: [] },
  { op: "Contact-method-get", method: "GET", path: "/{token}/contacts/{id}/contactMethods", group: DOMAIN_CONTACTS, schemas: ["schema:ContactMethod"] },
  { op: "Contact-method-create", method: "POST", path: "/{token}/contacts/{id}/contactMethods", group: DOMAIN_CONTACTS, schemas: ["schema:ContactMethod"] },
  { op: "Contact-method-update", method: "PUT", path: "/{token}/contacts/{id}/contactMethods/{contactMethodId}", group: DOMAIN_CONTACTS, schemas: ["schema:ContactMethod"] },
  { op: "Contact-expense-get", method: "GET", path: "/{token}/contacts/{id}/expenses", group: DOMAIN_CONTACTS, schemas: ["schema:Expense"] },
  { op: "Contact-expense-create", method: "POST", path: "/{token}/contacts/{id}/expenses", group: DOMAIN_CONTACTS, schemas: ["schema:Expense"] },
  { op: "Contact-expense-update", method: "PUT", path: "/{token}/contacts/{id}/expenses/{expenseId}", group: DOMAIN_CONTACTS, schemas: ["schema:Expense"] },
  { op: "Contact-income-get", method: "GET", path: "/{token}/contacts/{id}/incomes", group: DOMAIN_CONTACTS, schemas: ["schema:Income"] },
  { op: "Contact-income-create", method: "POST", path: "/{token}/contacts/{id}/incomes", group: DOMAIN_CONTACTS, schemas: ["schema:Income"] },
  { op: "Contact-income-update", method: "PUT", path: "/{token}/contacts/{id}/incomes/{incomeId}", group: DOMAIN_CONTACTS, schemas: ["schema:Income"] },
  { op: "Contact-identification-get", method: "GET", path: "/{token}/contacts/{id}/identification", group: DOMAIN_CONTACTS, schemas: ["schema:Identification"] },
  { op: "Contact-dentification-create", method: "POST", path: "/{token}/contacts/{id}/identification", group: DOMAIN_CONTACTS, schemas: ["schema:Identification"], note: "sic — typo in source spec operationId, missing the \"I\" (should read Contact-Identification-create)." },
  { op: "Contact-identification-update", method: "PUT", path: "/{token}/contacts/{id}/identification/{identificationId}", group: DOMAIN_CONTACTS, schemas: ["schema:Identification"] },
  { op: "Contact-address-get", method: "GET", path: "/{token}/contacts/{id}/addresses", group: DOMAIN_CONTACTS, schemas: ["schema:Address"] },
  { op: "Contact-address-create", method: "POST", path: "/{token}/contacts/{id}/addresses", group: DOMAIN_CONTACTS, schemas: ["schema:Address"] },
  { op: "Contact-address-update", method: "PUT", path: "/{token}/contacts/{id}/addresses/{addressId}", group: DOMAIN_CONTACTS, schemas: ["schema:Address"] },
  { op: "Contact-employment-get", method: "GET", path: "/{token}/contacts/{id}/employments", group: DOMAIN_CONTACTS, schemas: ["schema:Employment"] },
  { op: "Contact-employment-create", method: "POST", path: "/{token}/contacts/{id}/employments", group: DOMAIN_CONTACTS, schemas: ["schema:Employment"] },
  { op: "Contact-employment-update", method: "PUT", path: "/{token}/contacts/{id}/employments/{employmentId}", group: DOMAIN_CONTACTS, schemas: ["schema:Employment"] },
  { op: "Contact-opportunity-get", method: "GET", path: "/{token}/contacts/{id}/opportunities", group: DOMAIN_CONTACTS, schemas: ["schema:Opportunity"] },

  // Partner Config & Categories
  { op: "PartnerConfig-search", method: "GET", path: "/{token}/partner/config", group: DOMAIN_PARTNER_CATEGORIES, schemas: ["schema:PartnerConfigSearchResult", "schema:PartnerConfigSearchParams"] },
  { op: "PartnerConfig-create", method: "POST", path: "/{token}/partner/config", group: DOMAIN_PARTNER_CATEGORIES, schemas: ["schema:PartnerConfig"] },
  { op: "PartnerConfig-update", method: "PUT", path: "/{token}/partner/config/{id}", group: DOMAIN_PARTNER_CATEGORIES, schemas: ["schema:PartnerConfig"] },
  { op: "Category-search", method: "GET", path: "/{token}/categories", group: DOMAIN_PARTNER_CATEGORIES, schemas: ["schema:CategorySearchResult"] },
  { op: "Category-create", method: "POST", path: "/{token}/categories", group: DOMAIN_PARTNER_CATEGORIES, schemas: ["schema:Category"] },
  { op: "Category-get", method: "GET", path: "/{token}/categories/{id}", group: DOMAIN_PARTNER_CATEGORIES, schemas: ["schema:Category"] },
  { op: "Category-update", method: "PUT", path: "/{token}/categories/{id}", group: DOMAIN_PARTNER_CATEGORIES, schemas: ["schema:Category"] },
];

const endpointIdByOp = {};
for (const e of ENDPOINTS) {
  const slug = e.op.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const id = `endpoint:${slug}`;
  endpointIdByOp[e.op] = id;
  node({
    id,
    type: "endpoint",
    name: `${e.method} ${e.path}`,
    summary: `${e.op} — ${e.method} ${e.path}${e.note ? `. ${e.note}` : ""} Shares common responses 200/400/401/403/404/500 (error bodies use the Error schema).`,
    tags: [e.method.toLowerCase(), "endpoint", ...e.path.split("/").filter((p) => p && !p.startsWith("{"))],
    complexity: e.note ? "moderate" : "simple",
    domainMeta: { entryPoint: `${e.method} ${e.path}`, entryType: "http" },
  });
  edge(e.group, id, "contains", { weight: 0.9 });
  for (const s of e.schemas) {
    edge(id, s, "defines_schema", { weight: 0.8 });
  }
}

// ───────────────────────── schemas ─────────────────────────

const SCHEMAS = [
  {
    id: "schema:PartnerConfig",
    domain: DOMAIN_PARTNER_CATEGORIES,
    fields: [
      ["uniqueId", "string (uuid)", "maxLength 44"],
      ["partnerId", "string", "maxLength 45"],
      ["key", "string", "maxLength 45"],
      ["value", "string", "maxLength 225"],
      ["primaryBg", "string", "maxLength 10"],
      ["secondaryBg", "string", "maxLength 10"],
      ["defaultBg", "string", "maxLength 10"],
      ["primaryFont", "string", "maxLength 10"],
      ["secondaryFont", "string", "maxLength 10"],
      ["defaultFont", "string", "maxLength 10"],
      ["vbInherit", "integer (int32)", "is virtual branch"],
    ],
  },
  {
    id: "schema:Contact",
    domain: DOMAIN_CONTACTS,
    contains: ["schema:ContactMethod", "schema:Identification", "schema:Expense", "schema:Income", "schema:Address", "schema:Category", "schema:MyMarketingTactics"],
    fields: [
      ["uniqueId", "string (uuid)", "maxLength 44"],
      ["company", "string", "Partner id, maxLength 36"],
      ["isDeleted", "boolean", "soft-delete flag — filter isDeleted=false on all queries"],
      ["deletedBy", "string", "maxLength 64"],
      ["deletedOn", "string (date-time)"],
      ["createdOn", "string (date-time)"],
      ["createdBy", "string", "maxLength 45"],
      ["firstName", "string", "maxLength 64"],
      ["lastName", "string", "maxLength 124"],
      ["middleName", "string", "maxLength 44"],
      ["salutation", "string", "maxLength 64"],
      ["title", "string", "enum: Dr, Miss, Ms, Mr, Mrs, Prof, Rev — maxLength 24"],
      ["occupation", "string"],
      ["employer", "string", "maxLength 164"],
      ["jobTitle", "string", "maxLength 64"],
      ["maritalStatus", "string", "enum: Single, Married, DeFacto, Separated, Divorced, Widowed, Other — maxLength 34"],
      ["driversLicenceNumber", "string", "maxLength 64"],
      ["driversLicenceExpiry", "string (date)"],
      ["driversLicenceState", "string", "enum: ACT, NSW, NT, QLD, SA, TAS, VIC, WA, OTHER — maxLength 16"],
      ["gender", "string", "enum: M, F — maxLength 8"],
      ["dateOfBirth", "string (date)"],
      ["employmentStatus", "string", "enum: Full Time, Part Time, Contract, Temporary, Commission, Seasonal, Casual, Self-Employed, Unemployed — maxLength 104"],
      ["employmentCommenced", "string (date)"],
      ["phoneDisplayType1-4", "string (x4)", "enum each: Business, Business 2, Business Fax, Home, Home 2, Home Fax, Mobile, Mobile 2 — maxLength 45"],
      ["addressDisplay", "string", "maxLength 45"],
      ["homePhone", "string", "maxLength 44"],
      ["businessPhone", "string", "maxLength 44"],
      ["mobile", "string", "maxLength 44"],
      ["email", "string (email)", "maxLength 65535"],
      ["personDataType", "string", "maxLength 7"],
      ["notes", "string", "maxLength 65535"],
      ["relationshipManager", "string", "maxLength 45"],
      ["annualSalary", "number (float)"],
      ["contactType", "string", "maxLength 45"],
      ["abn", "string", "maxLength 45"],
      ["acn", "string", "maxLength 45"],
      ["trustName", "string", "maxLength 100"],
      ["homeSuburb", "string", "maxLength 104"],
      ["numberOfDependents", "integer (int32)"],
      ["doNotMail", "boolean"],
      ["funambolUsers", "string", "maxLength 200"],
      ["markAsPrivate", "boolean"],
      ["importDocumentId", "string", "maxLength 45"],
      ["partnerName", "string", "maxLength 255"],
      ["emailBounced", "boolean"],
      ["webPassword", "string (password)", "maxLength 64 — never log"],
      ["webAccess", "boolean"],
      ["relationshipManagerName", "string", "maxLength 45"],
      ["lastUpdated", "string (date-time)"],
      ["lastUpdatedBy", "string", "maxLength 45"],
      ["externalId", "string", "maxLength 45"],
      ["leadSourceId", "string", "maxLength 124 (iConnect only)"],
      ["leadSourceName", "string", "maxLength 255 (iConnect only)"],
      ["contactMethods", "array<ContactMethod>"],
      ["Identification", "array<Identification>", "capitalized field name, unlike sibling arrays"],
      ["expenses", "array<Expense>"],
      ["incomes", "array<Income>"],
      ["addresses", "array<Address>"],
      ["categories", "array<Category>"],
      ["myMarketingTactics", "array<MyMarketingTactics>"],
    ],
  },
  {
    id: "schema:ContactMethod",
    domain: DOMAIN_CONTACTS,
    fields: [
      ["uniqueId", "string (uuid)", "maxLength 40"],
      ["company", "string", "internal, maxLength 36"],
      ["isDeleted", "boolean", "internal"],
      ["personID", "string (uuid)", "internal, maxLength 40"],
      ["contactMethod", "string", "enum: Business, Business 2, Business Fax, Email 1, Email 2, Email 3, Home, Home 2, Home Fax, Mobile, Mobile 2 — maxLength 20"],
      ["content", "string", "maxLength 100"],
      ["type", "string", "enum: email, home, mobile, phone — maxLength 45"],
    ],
  },
  {
    id: "schema:Identification",
    domain: DOMAIN_CONTACTS,
    fields: [
      ["uniqueId", "string (uuid)", "maxLength 44"],
      ["company", "string", "internal, maxLength 36"],
      ["createdBy", "string", "maxLength 45"],
      ["createdOn", "string (date-time)"],
      ["documentIssuedBy", "string", "maxLength 45"],
      ["documentNumber", "string", "maxLength 45"],
      ["endDate", "string (date-time)", "expiry"],
      ["isDeleted", "boolean", "internal"],
      ["parentId", "string (uuid)", "internal, maxLength 36"],
      ["nameOnDocument", "string", "maxLength 128"],
      ["personId", "string (uuid)", "internal, maxLength 45"],
      ["placeOfIssue", "string", "enum: ACT, NSW, NT, QLD, SA, TAS, VIC, WA, OTHER — maxLength 45"],
      ["startDate", "string (date-time)"],
      ["versionSighted", "string", "enum: Original, Certified — maxLength 45"],
      ["documentType", "string", "enum of 49 values (DriversLicenceAust, PassportAust, MedicareCard, BirthCertAust, ... see reference doc) — maxLength 45"],
    ],
  },
  {
    id: "schema:Expense",
    domain: DOMAIN_CONTACTS,
    fields: [
      ["uniqueId", "string (uuid)", "maxLength 36"],
      ["company", "string", "internal, maxLength 36"],
      ["isDeleted", "boolean", "internal"],
      ["personID", "string (uuid)", "internal, maxLength 36"],
      ["personName", "string", "maxLength 189"],
      ["amount", "number (float)"],
      ["type", "string", "enum: Credit Card, Home Loan, Investment Loan, Car Loan, Personal Loan, Maintenance, Rent Paid, Living Expenses, Education, Insurance, Other — maxLength 44"],
      ["frequency", "string", "enum: Annual, Fortnightly, Monthly, Weekly — maxLength 44"],
      ["balance", "number (float)"],
      ["creditLimit", "number (float)"],
      ["comment", "string", "maxLength 104"],
    ],
  },
  {
    id: "schema:Employment",
    domain: DOMAIN_CONTACTS,
    contains: ["schema:Income", "schema:Address"],
    fields: [
      ["uniqueId", "string (uuid)"],
      ["employerName", "string"],
      ["employmentBasis", "string", "maxLength 104 — free text (Full time, Part time, etc), no enum"],
      ["employmentStatus", "string", "maxLength 45 — free text (Primary, Secondary, Previous)"],
      ["employmentType", "string", "maxLength 45 — free text (Payg, self employment, etc)"],
      ["jobTitle", "string", "maxLength 64"],
      ["natureOfBusiness", "string"],
      ["operatingStructure", "string", "maxLength 45"],
      ["paygEmployerType", "string", "maxLength 45 — free text (Public or Private)"],
      ["abn", "string", "maxLength 45"],
      ["personId", "string (uuid)"],
      ["role", "string", "maxLength 64"],
      ["startDate", "string (date)"],
      ["endDate", "string (date)"],
      ["onBenefits", "boolean"],
      ["onProbation", "boolean"],
      ["student", "boolean"],
      ["incomes", "array<Income>"],
      ["address", "Address", "single object, not an array"],
    ],
  },
  {
    id: "schema:Income",
    domain: DOMAIN_CONTACTS,
    fields: [
      ["uniqueId", "string (uuid)", "maxLength 36"],
      ["company", "string", "internal, maxLength 36"],
      ["isDeleted", "boolean", "internal"],
      ["personID", "string (uuid)", "internal, maxLength 36"],
      ["personName", "string", "maxLength 189"],
      ["amount", "number (float)"],
      ["type", "string", "enum: Bonus, Business Income, Dividends, Family Allowance, Maintenance, Overtime, Pension, Rental, Salary, Self Employed, Other — maxLength 44"],
      ["frequency", "string", "enum: Annual, Fortnightly, Monthly, Weekly — maxLength 44"],
      ["dateCommenced", "string (date)"],
      ["sortKey", "integer (int32)", "internal"],
      ["comment", "string", "maxLength 104"],
    ],
  },
  {
    id: "schema:Opportunity",
    domain: DOMAIN_OPPORTUNITIES,
    contains: ["schema:RelatedParty", "schema:Asset", "schema:Liability"],
    fields: [
      ["uniqueId", "string (uuid)"],
      ["company", "string", "maxLength 36"],
      ["isDeleted", "boolean", "soft-delete flag"],
      ["deletedBy", "string", "maxLength 64"],
      ["deletedOn", "string (date-time)", "LIVE DATA RETURNS Unix epoch ms (number), not the date-time string the spec declares"],
      ["createdOn", "string (date-time)", "LIVE DATA RETURNS Unix epoch ms (number)"],
      ["createdBy", "string", "maxLength 64"],
      ["opportunityName", "string", "maxLength 164"],
      ["amount", "number (float)", "amount borrowed"],
      ["lender", "string", "maxLength 30"],
      ["lenderNameShort", "string", "maxLength 45"],
      ["status", "string", "maxLength 84 — free text in spec, but live Finhub Mercury CRM constrains this to 30 canonical values (see the LoanStatus claim nodes)"],
      ["agent", "string", "maxLength 64 — CA number"],
      ["personActing", "string", "maxLength 64 — CA number"],
      ["personResponsible", "string", "maxLength 44 — CA number"],
      ["lenderReference", "string", "maxLength 100"],
      ["financeDate", "string (date-time)"],
      ["expectedSettlementDate", "string (date-time)"],
      ["confirmedSettlementDate", "string (date-time)"],
      ["leadSourceId", "string", "maxLength 104"],
      ["leadSourceDisplay", "string", "maxLength 255"],
      ["discount", "number (float)"],
      ["existingAmount", "number (float)"],
      ["lmi", "number (float)", "loan mortgage insurance"],
      ["settlementDateConfirmed", "boolean"],
      ["discountType", "string", "maxLength 44"],
      ["loanPersonRelationship", "string", "maxLength 164"],
      ["transactionType", "string", "enum: Loan, CommercialLoans, PlantAndEquipment, PersonalLoans, Property, FinancialPlanning, Insurance, LifeInsurance, Accounting, TermDeposit, PremiumFunding, CreditCard, CashManagementAcc — maxLength 45"],
      ["notePadText", "string", "maxLength 21000"],
      ["partnerReference", "string", "maxLength 44"],
      ["nextGenId", "string", "maxLength 12"],
      ["parentId", "string", "internal, maxLength 44"],
      ["workspaceUsers", "string", "maxLength 100 — CA numbers"],
      ["tranxType", "string", "enum: Pre-Approval, Purchase, Refinance, Top Up, Variation — maxLength 44"],
      ["connectiveLodgeId", "string", "maxLength 10"],
      ["peResidualAmount", "number (float)"],
      ["peRepaymentAmount", "number (float)"],
      ["peEffectiveRate", "number (float)"],
      ["peInterestRate", "number (float)"],
      ["peBrokerage", "number (float)"],
      ["assetDescription", "string", "maxLength 21000"],
      ["nextAction", "string (date-time)"],
      ["loanTerm", "number (int32)"],
      ["fixedRateExpiry", "string (date-time)"],
      ["depositDueDate", "string (date-time)"],
      ["barCodeId", "string", "maxLength 45"],
      ["agentName", "string", "maxLength 511"],
      ["personActingName", "string", "maxLength 511"],
      ["personResponsibleName", "string", "maxLength 44"],
      ["defaultPath", "string", "maxLength 21000"],
      ["partnerName", "string", "maxLength 255"],
      ["partnerSharedWithId", "string", "maxLength 45"],
      ["partnerSharedWithName", "string", "maxLength 255"],
      ["statusLastUpdated", "string (date-time)", "LIVE DATA RETURNS Unix epoch ms (number)"],
      ["lastUpdatedBy", "string", "maxLength 45"],
      ["lenderComments", "string", "maxLength 21000"],
      ["sitRep", "string", "maxLength 21000"],
      ["campaignId", "string", "maxLength 45"],
      ["campaignName", "string", "maxLength 255"],
      ["securityValue", "number (float)"],
      ["aliApplicationId", "string", "maxLength 40"],
      ["metlifeApplicationId", "string", "maxLength 40"],
      ["interestOnlyExpiry", "string (date-time)"],
      ["lastUpdated", "string (date-time)", "LIVE DATA RETURNS Unix epoch ms (number)"],
      ["emailAccountAddress", "string (email)", "maxLength 70"],
      ["originationFee", "number (float)"],
      ["metaData", "string", "maxLength 255 — semicolon-separated categories"],
      ["relatedParties", "array<RelatedParty>"],
      ["assets", "array<Asset>"],
      ["liabilities", "array<Liability>"],
      ["volume", "number", "UNDOCUMENTED — new top-level pagination field on live search responses alongside totalCount/count/offset"],
      ["deletedByDisplay", "string", "UNDOCUMENTED — display-name companion to deletedBy"],
      ["lenderDisplayName", "string", "UNDOCUMENTED — companion to lender/lenderNameShort"],
      ["peResidualPercentage", "number", "UNDOCUMENTED — additional plant & equipment field"],
      ["peFinanceType", "string", "UNDOCUMENTED"],
      ["peAssetType", "string", "UNDOCUMENTED"],
      ["peBuildYear", "string", "UNDOCUMENTED"],
      ["agentEmail", "string", "UNDOCUMENTED — companion to agentName"],
      ["salePrice", "number", "UNDOCUMENTED"],
      ["referrerFee", "number", "UNDOCUMENTED — fee field beyond originationFee"],
      ["docFee", "number", "UNDOCUMENTED — fee field beyond originationFee"],
      ["invoiceId", "string", "UNDOCUMENTED — part of an entirely undocumented invoicing sub-system"],
      ["invoicePaymentReceived", "boolean", "UNDOCUMENTED"],
      ["invoicePersonName", "string", "UNDOCUMENTED"],
      ["invoicePersonAddress", "string", "UNDOCUMENTED"],
      ["invoiceBrokerReference", "string", "UNDOCUMENTED"],
      ["invoiceCafStatus", "string", "UNDOCUMENTED"],
      ["applicationPlatform", "string", "UNDOCUMENTED"],
      ["otherLoanPeople", "array (shape unknown)", "UNDOCUMENTED, distinct from relatedParties — empty in the sample record used for discovery"],
      ["assetLiabilityLinks", "array (shape unknown)", "UNDOCUMENTED, distinct from assets/liabilities — likely links assets to the liabilities they secure"],
    ],
  },
  {
    id: "schema:Address",
    domain: DOMAIN_CONTACTS,
    fields: [
      ["uniqueId", "string (uuid)", "maxLength 36"],
      ["company", "string", "internal, maxLength 36"],
      ["isDeleted", "boolean", "internal"],
      ["deletedBy", "string", "internal, maxLength 64"],
      ["deletedOn", "string (date-time)", "internal"],
      ["parentType", "string", "maxLength 20"],
      ["parentId", "string (uuid)", "internal, maxLength 36"],
      ["type", "string", "residence type, maxLength 64 — free text, no enum"],
      ["streetName", "string", "maxLength 164"],
      ["streetNumber", "string", "maxLength 20"],
      ["streetType", "string", "maxLength 64"],
      ["city", "string", "maxLength 104"],
      ["state", "string", "enum: ACT, NSW, NT, QLD, SA, TAS, VIC, WA, OTHER — maxLength 12"],
      ["postcode", "string (postcode)", "maxLength 16"],
      ["country", "string", "enum: full ISO-3166-1 alpha-2 list — SPEC BUG: NO (Norway) rendered as unquoted YAML no -> parsed as boolean false, see the address-country-enum-bug concept node"],
      ["unitNumber", "string", "maxLength 44"],
      ["buildingName", "string", "maxLength 164"],
      ["floorNumber", "string", "maxLength 44"],
      ["isCorrespondenceAddress", "boolean"],
      ["fromDate", "string (date-time)"],
      ["toDate", "string (date-time)"],
      ["addressBlock", "string", "maxLength 65535"],
      ["format", "string", "maxLength 45"],
      ["housingSituation", "string", "enum: Boarding, Caravan, Own Home, Own Home - Mortgage, Renting, With Parents, Other — maxLength 45"],
      ["requiresConfirmation", "boolean"],
      ["poBoxNumber", "string", "maxLength 10"],
      ["poBoxType", "string", "maxLength 6"],
      ["personName", "string", "maxLength 189"],
      ["addrGeoLatitude", "string", "maxLength 15"],
      ["addrGeoLongitude", "string", "maxLength 15"],
    ],
  },
  {
    id: "schema:RelatedParty",
    domain: DOMAIN_OPPORTUNITIES,
    fields: [
      ["uniqueId", "string (uuid)", "maxLength 36"],
      ["isDeleted", "boolean", "internal"],
      ["personID", "string (uuid)", "mandatory when adding a related party, maxLength 36"],
      ["relationship", "string", "enum: Adviser, Agent, Primary applicant, Secondary applicant, Assessor, Bank / Lender, Banker, Broker, Builder, Accountant, Conveyancer, Solicitor, Co-Applicant, Director, Employer, Financial Planner, Insurance referral, Insurer, Joint Borrower, JSG/ PRE, Land Agent, Lender, Loan Writer, NonApplicant, Other — maxLength 164"],
    ],
  },
  {
    id: "schema:Asset",
    domain: DOMAIN_OPPORTUNITIES,
    contains: ["schema:Address"],
    fields: [
      ["uniqueId", "string (uuid)", "maxLength 36"],
      ["company", "string", "internal, maxLength 36"],
      ["isDeleted", "boolean", "internal"],
      ["deletedBy", "string", "internal, maxLength 64"],
      ["deletedOn", "string (date-time)", "internal"],
      ["parentType", "string", "internal, default \"Asset\", maxLength 20"],
      ["parentId", "string (uuid)", "internal, maxLength 36"],
      ["name", "string", "enum: Real Estate, Boat, Business Equity, Cash Management, Charge Over Cash, Cheque Account, Debenture Charge, Gifts, Guarantee, Home Contents, Investment Savings, Life Insurance, Managed Funds, Motor Vehicle, Savings Account, Shares, Superannuation, Term Deposit, Other — maxLength 44"],
      ["type", "string", "enum: account, realEstate, vehicle, standard — maxLength 45"],
      ["value", "number (float)"],
      ["valueBasis", "string", "enum: Applicant Estimate, Certified Valuation, Actual Value — maxLength 45"],
      ["details", "string", "maxLength 164 — also carries motorVehicleMake on write when type is Motor Vehicle"],
      ["institution", "string", "maxLength 44"],
      ["accountName", "string", "maxLength 80"],
      ["accountNumber", "string", "maxLength 30"],
      ["accountBSB", "string", "maxLength 15"],
      ["realEstateUseAsSecurity", "boolean"],
      ["realEstatePurpose", "string", "enum: Owner Occupied, Investment — maxLength 45"],
      ["realEstateZoning", "string", "maxLength 45"],
      ["address", "Address", "single object"],
      ["realEstateToBePurchased", "boolean"],
      ["realEstateRentalIncome", "number (float)"],
      ["realEstateRentalIncomeFrequency", "string", "enum: annually, fortnightly, monthly, weekly — maxLength 45"],
      ["realEstateRentalEvidenceOfTenancy", "boolean"],
      ["existingMortgageCreditor", "string", "maxLength 45"],
      ["existingMortgageInterestRate", "number (float)"],
      ["existingMortgageBalance", "number (float)"],
      ["existingMortgageRepayment", "number (float)"],
      ["existingMortgageRepaymentFrequency", "string", "enum: annually, fortnightly, monthly, weekly — maxLength 15"],
      ["existingMortgageRepaymentClearing", "boolean"],
      ["motorVehicleType", "string", "maxLength 44 — free text"],
      ["motorVehiceYear", "string", "maxLength 12 — sic, spec typo, missing the \"l\" (should read motorVehicleYear)"],
      ["motorVehicleMake", "string", "maxLength 164 — display-only; use the `details` field for writes"],
    ],
  },
  {
    id: "schema:Liability",
    domain: DOMAIN_OPPORTUNITIES,
    fields: [
      ["uniqueId", "string (uuid)", "maxLength 36"],
      ["company", "string", "internal, maxLength 36"],
      ["isDeleted", "boolean", "internal"],
      ["deletedBy", "string", "internal, maxLength 64"],
      ["deletedOn", "string (date-time)", "internal"],
      ["parentType", "string", "maxLength 20"],
      ["parentId", "string (uuid)", "internal, maxLength 36"],
      ["name", "string", "enum: Commercial Bill, Credit Card, HECS, Hire Purchase, Lease, Line Of Credit, Loan As Guarantor, Maintenance, Mortgage Loan, Other Loan, Outstanding Taxation, Overdraft, Personal Loan, Store Card, Term Loan, Other — maxLength 44"],
      ["type", "string", "enum: account, realEstate, vehicle, standard — maxLength 45"],
      ["value", "number (float)"],
      ["details", "string", "maxLength 164"],
      ["limit", "integer (int32)"],
      ["institution", "string", "maxLength 44"],
      ["accountName", "string", "maxLength 80"],
      ["accountNumber", "string", "maxLength 30"],
      ["accountBSB", "string", "maxLength 15"],
      ["accountRepayment", "number (float)"],
      ["accountRepaymentFrequency", "string", "enum: annually, fortnightly, monthly, weekly — maxLength 15"],
      ["creditCardType", "string", "enum: Amex, Diners, Mastercard, Visa — maxLength 45"],
      ["accountClearingFromLoan", "boolean"],
    ],
  },
  {
    id: "schema:Category",
    domain: DOMAIN_PARTNER_CATEGORIES,
    fields: [
      ["uniqueId", "string (uuid)", "maxLength 36"],
      ["categoryName", "string", "maxLength 80 — live Finhub values follow a PREF - * / FREQ - * / REVIEW - * naming convention, see the contact-category-name-convention claim node"],
      ["categoryNotes", "string", "maxLength 65535"],
      ["activeCampaignId", "string", "maxLength 10"],
    ],
  },
  {
    id: "schema:MyMarketingTactics",
    domain: DOMAIN_CONTACTS,
    fields: [
      ["uniqueId", "string (uuid)", "maxLength 45"],
      ["itemName", "string", "maxLength 45"],
    ],
  },
  {
    id: "schema:OpportunitySearchResult",
    domain: DOMAIN_OPPORTUNITIES,
    contains: ["schema:Opportunity"],
    fields: [
      ["totalCount", "integer (int32)", "total matches in DB"],
      ["count", "integer (int32)", "returned in this page"],
      ["offset", "integer (int32)", "as requested"],
      ["results", "array<Opportunity>"],
    ],
  },
  {
    id: "schema:ContactSearchResult",
    domain: DOMAIN_CONTACTS,
    contains: ["schema:Contact"],
    fields: [
      ["totalCount", "integer (int32)"],
      ["count", "integer (int32)"],
      ["offset", "integer (int32)"],
      ["results", "array<Contact>"],
    ],
  },
  {
    id: "schema:PartnerConfigSearchResult",
    domain: DOMAIN_PARTNER_CATEGORIES,
    contains: ["schema:PartnerConfig"],
    fields: [
      ["totalCount", "integer (int32)"],
      ["count", "integer (int32)"],
      ["offset", "integer (int32)"],
      ["results", "array<PartnerConfig>"],
    ],
  },
  {
    id: "schema:CategorySearchResult",
    domain: DOMAIN_PARTNER_CATEGORIES,
    contains: ["schema:Category"],
    fields: [
      ["totalCount", "integer (int32)"],
      ["count", "integer (int32)"],
      ["offset", "integer (int32)"],
      ["results", "array<Category>"],
    ],
  },
  {
    id: "schema:Error",
    domain: DOMAIN_ROOT,
    fields: [
      ["code", "integer (int32)", "HTTP status"],
      ["contactEmail", "string (email)"],
      ["description", "string"],
      ["homeRef", "string"],
      ["reasonPhrase", "integer (int32)"],
      ["uri", "string (url)"],
    ],
  },
  {
    id: "schema:Success",
    domain: DOMAIN_ROOT,
    fields: [
      ["status", "integer (int32)"],
      ["uniqueId", "string (uuid)"],
    ],
  },
  {
    id: "schema:OpportunitySearchParams",
    domain: DOMAIN_OPPORTUNITIES,
    fields: [
      ["name", "string"],
      ["isDeleted", "boolean", "default false"],
      ["statuses", "array<string>"],
      ["lastUpdated", "string", "yyyy-mm-dd or yyyy-mm-dd HH:MM:SS, supports ranges"],
      ["transactionType", "string", "default \"all\""],
      ["user", "string", "CA number"],
      ["createdOn", "string", "date/range"],
      ["interestOnlyExpiry", "string", "date/range"],
      ["fixedRateExpiry", "string", "date/range"],
      ["confirmedSettlementDate", "string", "date/range"],
    ],
  },
  {
    id: "schema:PartnerConfigSearchParams",
    domain: DOMAIN_PARTNER_CATEGORIES,
    fields: [
      ["key", "string"],
      ["partnerId", "string"],
    ],
  },
  {
    id: "schema:ContactSearchParams",
    domain: DOMAIN_CONTACTS,
    fields: [
      ["name", "string"],
      ["isDeleted", "boolean", "default false"],
      ["excludeDoNotMail", "boolean", "default false"],
      ["excludeEmailBounced", "boolean", "default false"],
      ["lastUpdated", "string", "date/range"],
      ["companyName", "string"],
      ["personType", "string"],
      ["categoryId", "string"],
      ["campaignId", "string"],
      ["contactNumber", "string"],
      ["email", "string"],
      ["createdOn", "string", "date/range"],
      ["dateOfBirth", "string", "date/range"],
      ["birthday", "string", "date/range (anniversary)"],
    ],
  },
  {
    id: "schema:ContactHookRequestBody",
    domain: DOMAIN_CONTACTS,
    fields: [
      ["active", "boolean", "default true, internal"],
      ["name", "string", "default \"web\", internal"],
      ["config.subscription_type", "string", "enum: All available contacts, Contacts in my branch/office, Contacts where I am the relationship manager"],
      ["config.content_type", "string", "default \"json\", internal"],
      ["config.url", "string", "notification URL, internal"],
      ["event", "string", "enum: Created, Created or updated, Deleted — default \"Created\""],
    ],
  },
  {
    id: "schema:OppHookRequestBody",
    domain: DOMAIN_OPPORTUNITIES,
    fields: [
      ["active", "boolean", "default true, internal"],
      ["name", "string", "default \"web\", internal"],
      ["config.subscription_type", "string", "enum: All available opportunities, Opportunities in my branch/office, Opportunities where I am the agent, Opportunities where I am the admin/supervisor"],
      ["config.content_type", "string", "default \"json\", internal"],
      ["config.url", "string", "notification URL, internal"],
      ["event", "string", "enum: Created, Created or updated, Deleted, Opportunity Status Changed — default \"Created\""],
    ],
  },
  {
    id: "schema:WebhookCreationResponse",
    domain: DOMAIN_ROOT,
    fields: [
      ["type", "string"],
      ["id", "integer"],
      ["name", "string"],
      ["active", "boolean"],
      ["events", "array<string>"],
      ["config.content_type", "string"],
      ["config.url", "string"],
      ["updated_at", "string"],
      ["created_at", "string"],
      ["url", "string"],
      ["test_url", "string"],
      ["ping_url", "string"],
      ["last_response.code", "string"],
      ["last_response.status", "string"],
      ["last_response.message", "string"],
    ],
  },

  // Extension-only schemas (from the TS types file; absent from the md's §2
  // schema catalog because the extension/* endpoints are absent from the spec)
  {
    id: "schema:OpportunityExtensionRecord",
    domain: DOMAIN_EXTENSION,
    contains: ["schema:LivingExpenseLineItem", "schema:OtherIncomeLineItem"],
    fields: [
      ["uniqueId", "string (uuid)"],
      ["parentType", "\"loan\" | string"],
      ["parentId", "string"],
      ["key", "\"livingExpense\" | \"otherIncome\" | string"],
      ["value", "string", "JSON.stringify(LivingExpenseLineItem[] | OtherIncomeLineItem[]) — a JSON-encoded string, NOT structured JSON; parse client-side, re-stringify the FULL array before PUT"],
    ],
  },
  {
    id: "schema:LivingExpenseLineItem",
    domain: DOMAIN_EXTENSION,
    contains: ["schema:ExtensionSplit"],
    fields: [
      ["uniqueId", "string", "client-generated UUID v4 for new items (use crypto.randomUUID(), not a website)"],
      ["amount", "string", "note: string, not number, per observed payloads"],
      ["type", "string", "e.g. Clothing & Personal Care, Child & Spouse Maintenance (open string union)"],
      ["frequency", "string", "enum: Annual, Fortnightly, Monthly, Weekly"],
      ["splits", "array<ExtensionSplit>", "optional on write — if omitted, ownership is split evenly across linked contacts"],
    ],
  },
  {
    id: "schema:OtherIncomeLineItem",
    domain: DOMAIN_EXTENSION,
    contains: ["schema:ExtensionSplit"],
    fields: [
      ["uniqueId", "string"],
      ["amount", "string"],
      ["type", "string", "Income.type enum or open string"],
      ["frequency", "string", "enum: Annual, Fortnightly, Monthly, Weekly"],
      ["splits", "array<ExtensionSplit>", "optional on write, same even-split default as LivingExpenseLineItem"],
    ],
  },
  {
    id: "schema:ExtensionSplit",
    domain: DOMAIN_EXTENSION,
    fields: [
      ["personId", "string"],
      ["percent", "number", "percentage ownership/attribution across a linked contact"],
    ],
  },
];

for (const s of SCHEMAS) {
  node({
    id: s.id,
    type: "schema",
    name: s.id.replace("schema:", ""),
    summary: `${fieldList(s.fields)}.`,
    tags: ["schema", ...fieldTags(s.fields)],
    complexity: s.fields.length > 25 ? "complex" : s.fields.length > 10 ? "moderate" : "simple",
  });
  if (s.domain) edge(s.domain, s.id, "contains", { weight: 0.7 });
  for (const child of s.contains ?? []) {
    edge(s.id, child, "contains", { weight: 0.6, description: "nested field on this schema" });
  }
}

// ───────────────────────── field-level knowledge (concept nodes) ─────────────────────────

const CONCEPTS = [
  {
    id: "concept:address-country-enum-bug",
    name: "Address.country YAML parsing bug (NO -> false)",
    summary:
      "Spec bug at the source YAML's line 4545: Norway's ISO-3166-1 alpha-2 code `NO` was written unquoted inside the country enum. YAML 1.1 parses the bareword `no` as the boolean `false`, so the generated enum contains a stray boolean instead of the string \"NO\". If building a typed client, patch this manually to the string \"NO\" — the TypeScript types file in this repo already does so (see the `/* fixed: spec had false */` comment on CountryCode).",
    tags: ["address", "country", "spec-bug", "yaml", "norway"],
    documents: ["schema:Address"],
    weight: 0.9,
  },
  {
    id: "concept:motor-vehicle-year-typo",
    name: "Asset.motorVehiceYear field-name typo",
    summary:
      "The Asset schema's vehicle-year field is spelled `motorVehiceYear` in the spec (missing the \"l\" from Vehicle) — sic, a genuine typo carried through to the live API contract, not a transcription error in this reference. Clients must use the misspelled name on the wire; do not \"fix\" it to motorVehicleYear or requests will silently drop the field.",
    tags: ["asset", "motorvehiceyear", "typo", "spec-bug"],
    documents: ["schema:Asset"],
    weight: 0.7,
  },
  {
    id: "concept:contact-identification-casing",
    name: "Contact.Identification is capitalized, unlike sibling arrays",
    summary:
      "Contact's nested identification-documents array is named `Identification` (capital I) while every sibling array field on Contact — contactMethods, expenses, incomes, addresses, categories — is lowerCamelCase. This inconsistency is in the live spec/API contract itself; a client that lowercases all field names generically will break this one field.",
    tags: ["contact", "identification", "casing", "inconsistency"],
    documents: ["schema:Contact"],
    weight: 0.7,
  },
  {
    id: "concept:contact-dentification-typo",
    name: "Contact-dentification-create operationId typo",
    summary:
      "The POST /contacts/{id}/identification endpoint's operationId is `Contact-dentification-create` — missing the \"I\" from Identification — in the source spec. Purely a spec-metadata typo (doesn't affect the URL path, only generated-client method names if operationId is used for codegen).",
    tags: ["contact", "identification", "operationid", "typo"],
    documents: ["endpoint:contact-dentification-create"],
    weight: 0.4,
  },
  {
    id: "concept:opportunity-status-free-text",
    name: "Opportunity.status: spec free-text vs live 30-value constraint",
    summary:
      "The Swagger spec declares Opportunity.status as unconstrained free text (string, maxLength 84, no enum). In practice, live Finhub Mercury CRM data constrains this to exactly 30 canonical pipeline-stage strings (27 active + 3 inactive) — see the loan-status-30-values claim node for the full list. Never hardcode status strings inline; pull from a live source (e.g. list_loan_statuses) rather than trusting the empty spec enum. Note some values include en-dashes (–), not hyphens.",
    tags: ["opportunity", "status", "enum", "free-text", "pipeline"],
    documents: ["schema:Opportunity"],
    weight: 0.9,
  },
  {
    id: "concept:date-fields-epoch-ms",
    name: "createdOn/lastUpdated/statusLastUpdated/deletedOn are epoch ms, not date-time strings",
    summary:
      "The Swagger spec declares these Opportunity (and likely Contact/Asset/Liability etc.) timestamp fields as `type: string, format: date-time`. Live production data actually returns them as NUMBERS — Unix epoch milliseconds, e.g. 1490756658000 — not \"2017-03-29T00:00:00Z\"-style strings. A client parsing these with a date-string parser will silently produce Invalid Date; use `new Date(epochMs)` instead. This is a format discrepancy between the declared spec and live behaviour, not a documentation gap.",
    tags: ["opportunity", "createdon", "lastupdated", "statuslastupdated", "deletedon", "epoch", "date-time", "format-mismatch"],
    documents: ["schema:Opportunity"],
    weight: 0.9,
  },
  {
    id: "concept:opportunity-undocumented-fields",
    name: "~20 live Opportunity fields absent from the Swagger spec entirely",
    summary:
      "A live authenticated GET against a real Finhub branch token/API key (schema-only inspection, 2026-07-17) returned roughly 20 top-level Opportunity fields with no equivalent anywhere in the Swagger YAML: volume (new pagination field alongside totalCount/count/offset), deletedByDisplay, lenderDisplayName, peResidualPercentage, peFinanceType, peAssetType, peBuildYear, agentEmail, salePrice, referrerFee, docFee, and an entirely undocumented invoicing sub-system (invoiceId, invoicePaymentReceived, invoicePersonName, invoicePersonAddress, invoiceBrokerReference, invoiceCafStatus), plus applicationPlatform, otherLoanPeople[] and assetLiabilityLinks[] (both empty in the sample, item shapes unconfirmed). Don't assume the Swagger spec is a complete field list for Opportunity.",
    tags: ["opportunity", "undocumented", "invoicing", "live-data", "incomplete-spec"],
    documents: ["schema:Opportunity"],
    weight: 0.85,
  },
  {
    id: "concept:webpassword-never-log",
    name: "Contact.webPassword is a sensitive field — never log",
    summary:
      "Contact.webPassword (string, format password, maxLength 64) is a live credential field for client-portal web access, gated by the separate webAccess boolean. Must be excluded from logs, error messages, and any general-purpose field-dump tooling.",
    tags: ["contact", "webpassword", "webaccess", "pii", "sensitive", "never-log"],
    documents: ["schema:Contact"],
    weight: 0.8,
  },
  {
    id: "concept:extension-value-json-string",
    name: "extension/* `value` field is a JSON-encoded string, not structured JSON",
    summary:
      "OpportunityExtensionRecord.value (on both the livingExpense and otherIncome extension endpoints) is a JSON.stringify()'d array — e.g. `\"[{\\\"uniqueId\\\":\\\"29a49080-...\\\",\\\"amount\\\":\\\"1000.00\\\",...}]\"` — not a nested JSON array/object as the rest of the API's nested resources are. A client must JSON.parse() it after GET and JSON.stringify() the full array again before PUT. This is the single most surprising field-shape quirk in the whole API.",
    tags: ["extension", "livingexpense", "otherincome", "value", "json-string", "quirk"],
    documents: ["schema:OpportunityExtensionRecord"],
    weight: 0.9,
  },
  {
    id: "concept:extension-put-destructive-replace",
    name: "extension/* PUT is a destructive full-replace, no partial update",
    summary:
      "PUT on either extension/livingExpense or extension/otherIncome replaces the ENTIRE value array — every existing line item not resent is silently deleted. There is no PATCH-style partial-update or append semantic. Client pattern must be fetch-merge-put: GET, JSON.parse the value, mutate the in-memory array, JSON.stringify the FULL result, then PUT.",
    tags: ["extension", "put", "destructive", "full-replace", "fetch-merge-put"],
    documents: ["flow:extension-living-expense-lifecycle"],
    weight: 0.9,
  },
  {
    id: "concept:leadsource-silent-noop",
    name: "leadSourceId-only-and-not-found silently no-ops",
    summary:
      "Opportunity lead-source assignment merge logic: if only leadSourceId is given and it doesn't exist, NO assignment happens at all — no error, no creation, just a silent no-op. (Compare: leadSourceDisplay-only always assigns, creating a new Lead Source if needed.) Client code should guard this case explicitly rather than assuming the write succeeded.",
    tags: ["opportunity", "leadsourceid", "leadsourcedisplay", "silent-noop", "merge-logic"],
    documents: ["schema:Opportunity"],
    weight: 0.75,
  },
  {
    id: "concept:category-name-convention",
    name: "Category.categoryName: spec free-text vs live PREF-/FREQ-/REVIEW- convention",
    summary:
      "The spec declares categoryName as free text (maxLength 80, no enum). Live Finhub production values all follow one of three naming families: `PREF - *` (communication topic preference, e.g. \"PREF - Loan Reminders\"), `FREQ - *` (contact frequency, e.g. \"FREQ - Monthly\"), `REVIEW - *` (review cadence, e.g. \"REVIEW - 12 Monthly\"). This is a broker-group convention, not a Mercury spec constraint — don't use it to validate incoming API responses from other Mercury tenants, only to understand Finhub's own category taxonomy.",
    tags: ["category", "categoryname", "pref", "freq", "review", "naming-convention"],
    documents: ["schema:Category"],
    weight: 0.6,
  },
  {
    id: "concept:motorvehiclemake-display-only",
    name: "Asset.motorVehicleMake is display-only — use `details` for writes",
    summary:
      "Asset.motorVehicleMake (maxLength 164) is returned on read but is display-only; the field actually used to carry the make value on write (when Asset.type is Motor Vehicle) is `details` (maxLength 164, dual-purpose field). Writing to motorVehicleMake directly has no effect.",
    tags: ["asset", "motorvehiclemake", "details", "display-only", "write-quirk"],
    documents: ["schema:Asset"],
    weight: 0.6,
  },
  {
    id: "concept:nested-entity-crud-rule",
    name: "Nested entity create/update/delete is one PUT, keyed on uniqueId + isDeleted",
    summary:
      "There is no separate create/update/delete endpoint for most nested entities (assets, liabilities, relatedParties on Opportunity; contactMethods, expenses, incomes, Identification, addresses on Contact). A single PUT on the parent handles all three operations, disambiguated purely by payload shape: uniqueId absent -> creates a new nested entity; uniqueId present + isDeleted absent/false -> updates the existing entity; uniqueId present + isDeleted true -> soft-deletes it. The same pattern applied at the top level (PUT { isDeleted: true }) deletes the whole Opportunity/Contact. The one true DELETE verb in the entire API is for webhooks only.",
    tags: ["nested-entity", "crud", "uniqueid", "isdeleted", "put", "soft-delete"],
    documents: ["flow:nested-entity-crud-via-put"],
    weight: 0.9,
  },
  {
    id: "concept:date-range-search-syntax",
    name: "searchParams date-range syntax (start/end, /date, date/, etc.)",
    summary:
      "Date-valued fields inside the URL-encoded searchParams JSON object (OpportunitySearchParams.lastUpdated/createdOn/etc, ContactSearchParams.lastUpdated/createdOn/dateOfBirth/birthday) accept a mini range grammar: \"start/end\" for between two dates, \"date/\" for on-or-after (inclusive), \"/date\" for on-or-before (inclusive), \"date\" for an exact date, \"date time\" for an exact AEST timestamp, and \"start time/end time\" for a timestamp range. The separator accepts `/`, `..`, or the literal word `to`.",
    tags: ["searchparams", "date-range", "lastupdated", "createdon", "query-syntax"],
    documents: ["schema:OpportunitySearchParams", "schema:ContactSearchParams"],
    weight: 0.6,
  },
];

for (const c of CONCEPTS) {
  node({
    id: c.id,
    type: "concept",
    name: c.name,
    summary: c.summary,
    tags: c.tags,
    complexity: "simple",
  });
  edge(DOMAIN_LIVE_DATA, c.id, "contains", { weight: 0.6 });
  edge(SOURCE_SWAGGER, c.id, "cites", { weight: 0.5, description: "spec issue found in / relevant to this source" });
  for (const target of c.documents) {
    edge(c.id, target, "documents", { weight: c.weight });
  }
}

// ───────────────────────── live-data claims ─────────────────────────

const CLAIM_STATUS = node({
  id: "claim:loan-status-30-values",
  type: "claim",
  name: "Opportunity.status — 30 canonical Finhub pipeline values",
  summary:
    "Pulled live via list_loan_statuses (2026-07-17), cross-checked against a LOAN STATUS NAME export — both sources match exactly. 27 active values: 1. Lead – Discovery; 2. Strategy Appointment Booked & Client Center Portal Send to Clients; 2.1 Appointment Conduct & Completed; 2.2 Follow-Up Required; 2.3 Follow Up Opportunities; 3.0 Awaiting Client Documents; 3.1 Documents Received & Uploaded; 4. Lender Selection & Policy Review; 5. Loan Proposal Sent to Client Via Email; 5.1 Prepare For Application Lodgement; 6. Application Submitted to Lender; 6.1 Lender Queries / Outstanding Items (MIR); 6.2 Pre-Approval Issued; 6.3. Unconditional Approval Issued; 7.0. Loan Documents Issued; 7.1 Documents Returned & Certified; 8.0 Ready for Settlement; 8.1 Settled/Funded; 8.2 Settled – Commission Paid; 8.3 Construction Loan – Progress Payments; 8.4 Loan Currently In Arrear; 9.0 Financial Passport Invite Sent; 9.1 Financial Passport Invite -Active; 9.2 Financial Passport Invite -Expired; 9.3 Mortgage Review – 24 Month; 9.4 Mortgage Review – 30 Month; 9.5 Mortgage Review – 36 Month. 3 inactive values: 12. Loan Discharged; 13. Declined by Lender; 14. Client Not Proceeding. Use these exact strings (including en-dashes, not hyphens) in status filters; omitting a status filter defaults to the active set.",
  tags: ["opportunity", "status", "loanstatus", "pipeline-stage", "live-data"],
  complexity: "moderate",
});
edge(CLAIM_STATUS, "schema:Opportunity", "documents", { weight: 0.9 });
edge(CLAIM_STATUS, SOURCE_LIVE_PULL, "cites", { weight: 1 });
edge(CLAIM_STATUS, "concept:opportunity-status-free-text", "related", { weight: 0.7 });
edge(DOMAIN_LIVE_DATA, CLAIM_STATUS, "contains", { weight: 0.7 });

const CLAIM_CATEGORIES = node({
  id: "claim:contact-categories-15-values",
  type: "claim",
  name: "Category.categoryName — 15 live Finhub contact categories",
  summary:
    "Pulled live via list_contact_categories (2026-07-17). 15 values across 3 families — REVIEW - Client Will Call, REVIEW - 24 Monthly, REVIEW - 12 Monthly, REVIEW - 6 Monthly; PREF - Loan Reminders, PREF - Property Market, PREF - Ad Hoc Only, PREF - RBA Updates, PREF - Lender News, PREF - Investment Property, PREF - First Home Buyer; FREQ - Important Only, FREQ - Half Yearly, FREQ - Monthly, FREQ - Quarterly. Each has a stable uniqueId (e.g. 0634f266-57ad-4678-b6f9-b0d0f613910e = PREF - Loan Reminders).",
  tags: ["category", "categoryname", "contact-category", "live-data"],
  complexity: "simple",
});
edge(CLAIM_CATEGORIES, "schema:Category", "documents", { weight: 0.9 });
edge(CLAIM_CATEGORIES, SOURCE_LIVE_PULL, "cites", { weight: 1 });
edge(CLAIM_CATEGORIES, "concept:category-name-convention", "related", { weight: 0.7 });
edge(DOMAIN_LIVE_DATA, CLAIM_CATEGORIES, "contains", { weight: 0.6 });

const CLAIM_LENDERS = node({
  id: "claim:panel-lenders-live",
  type: "claim",
  name: "Panel lenders — 10 CDR-connected + 13 non-CDR (mainstream compare group)",
  summary:
    "Pulled live via list_panel_lenders (2026-07-17). CDR-connected (Open Banking-capable, 10): ANZ, CommBank, NAB, Westpac, St.George, Bank of Melbourne, BankSA, Macquarie, ING, Bankwest. Non-CDR panel lenders (13, no Open Banking API — structural, not a data gap): Firstmac, Pepper Money, La Trobe Financial, Resimac, Bluebay, RedZed, Better Choice, Better Mortgage Management, Granite Home Loans, HomeStart Finance, Keystart, OwnHome, Deposit Power. This is a mainstream default-compare subset of a much larger 40-lender CDR set — pass relevance: \"all\" on list_panel_lenders to get the full set.",
  tags: ["lender", "panel", "cdr", "open-banking", "live-data"],
  complexity: "simple",
});
edge(CLAIM_LENDERS, DOMAIN_OPPORTUNITIES, "related", { weight: 0.5 });
edge(CLAIM_LENDERS, "schema:Opportunity", "documents", { weight: 0.6, description: "documents the value domain of Opportunity.lender / lenderNameShort" });
edge(CLAIM_LENDERS, SOURCE_LIVE_PULL, "cites", { weight: 1 });
edge(DOMAIN_LIVE_DATA, CLAIM_LENDERS, "contains", { weight: 0.6 });

// ───────────────────────── flows & steps ─────────────────────────

const FLOW_CREATE_OPP = node({
  id: "flow:create-opportunity-with-nested-entities",
  type: "flow",
  name: "Create an Opportunity, capturing the returned uniqueId",
  summary:
    "POST /{token}/opportunities with at minimum { opportunityName, amount } returns { uniqueId, emailId }. Nested entities (assets, liabilities, relatedParties) can be included in the same create call without supplying their own uniqueIds — Mercury auto-generates them server-side.",
  tags: ["opportunity", "create", "nested-entities"],
  complexity: "simple",
  domainMeta: { entryPoint: "POST /{token}/opportunities", entryType: "http" },
});
edge(DOMAIN_OPPORTUNITIES, FLOW_CREATE_OPP, "contains_flow", { weight: 0.8 });
edge(FLOW_CREATE_OPP, endpointIdByOp["Opportunity-create"], "routes", { weight: 0.9 });

const FLOW_NESTED_CRUD = node({
  id: "flow:nested-entity-crud-via-put",
  type: "flow",
  name: "Nested entity CRUD via a single parent PUT",
  summary:
    "The universal pattern for creating, updating, or soft-deleting nested entities (assets/liabilities/relatedParties on Opportunity; contactMethods/expenses/incomes/Identification/addresses on Contact) — see concept:nested-entity-crud-rule for the exact keying rule.",
  tags: ["nested-entity", "crud", "put"],
  complexity: "moderate",
  domainMeta: { entryPoint: "PUT /{token}/opportunities/{id}", entryType: "http" },
});
edge(DOMAIN_OPPORTUNITIES, FLOW_NESTED_CRUD, "contains_flow", { weight: 0.8 });
edge(DOMAIN_CONTACTS, FLOW_NESTED_CRUD, "contains_flow", { weight: 0.7, description: "same PUT-based convention applies to Contact's nested sub-resources" });
edge(FLOW_NESTED_CRUD, endpointIdByOp["Opportunity-update"], "routes", { weight: 0.9 });
edge(FLOW_NESTED_CRUD, endpointIdByOp["Contact-update"], "routes", { weight: 0.8 });

const STEP_CREATE = node({ id: "step:nested-entity-crud:create", type: "step", name: "uniqueId absent -> create", summary: "Omit uniqueId on the nested entity object in the PUT payload; Mercury creates a new nested entity and assigns it a uniqueId.", tags: ["create"], complexity: "simple" });
const STEP_UPDATE = node({ id: "step:nested-entity-crud:update", type: "step", name: "uniqueId present, isDeleted absent/false -> update", summary: "Include the existing uniqueId with only the changed fields; Mercury merges into the existing nested entity.", tags: ["update"], complexity: "simple" });
const STEP_DELETE = node({ id: "step:nested-entity-crud:delete", type: "step", name: "uniqueId present, isDeleted true -> soft-delete", summary: "Include the existing uniqueId with isDeleted: true; the nested entity (or, at the top level, the whole Opportunity/Contact) is soft-deleted. There is no hard DELETE for these resources.", tags: ["delete", "soft-delete"], complexity: "simple" });
edge(FLOW_NESTED_CRUD, STEP_CREATE, "flow_step", { weight: 0.3 });
edge(FLOW_NESTED_CRUD, STEP_UPDATE, "flow_step", { weight: 0.6 });
edge(FLOW_NESTED_CRUD, STEP_DELETE, "flow_step", { weight: 0.9 });

const FLOW_SOFT_DELETE = node({
  id: "flow:soft-delete-opportunity",
  type: "flow",
  name: "Soft-delete a whole Opportunity",
  summary: "PUT /{token}/opportunities/{id} with { isDeleted: true } — the same uniqueId+isDeleted convention applied at the top level instead of on a nested entity. There is no hard DELETE for Opportunities or Contacts.",
  tags: ["opportunity", "delete", "soft-delete"],
  complexity: "simple",
  domainMeta: { entryPoint: "PUT /{token}/opportunities/{id}", entryType: "http" },
});
edge(DOMAIN_OPPORTUNITIES, FLOW_SOFT_DELETE, "contains_flow", { weight: 0.6 });
edge(FLOW_SOFT_DELETE, endpointIdByOp["Opportunity-update"], "routes", { weight: 0.9 });

const FLOW_SEARCH = node({
  id: "flow:search-and-pagination",
  type: "flow",
  name: "Search & pagination — query params, not a separate verb",
  summary:
    "GET /{token}/opportunities?search=true&count=50&offset=50&sortKey=lastModifiedDate&sortOrder=ASC — search/search=true are equivalent (the param just needs to be present); count max 100 (values above are silently clamped), default 25; offset default 0; sortKey is creationDate|lastModifiedDate (default creationDate); sortOrder is ASC|DESC (default DESC). Every search response returns totalCount (total matches), count (returned this page), offset (as requested). Complex filters go through a URL-encoded JSON object in the searchParams query param, shaped by OpportunitySearchParams/ContactSearchParams — see concept:date-range-search-syntax for the date-range grammar used inside it.",
  tags: ["search", "pagination", "count", "offset", "sortkey", "sortorder", "searchparams"],
  complexity: "moderate",
  domainMeta: { entryPoint: "GET /{token}/opportunities", entryType: "http" },
});
edge(DOMAIN_ROOT, FLOW_SEARCH, "contains_flow", { weight: 0.7, description: "cross-cutting — same search/pagination convention applies to Opportunities and Contacts" });
edge(FLOW_SEARCH, endpointIdByOp["Opportunity-search"], "routes", { weight: 0.9 });
edge(FLOW_SEARCH, endpointIdByOp["Contact-search"], "routes", { weight: 0.9 });
edge(FLOW_SEARCH, "concept:date-range-search-syntax", "related", { weight: 0.6 });

const FLOW_LEAD_SOURCE = node({
  id: "flow:lead-source-assignment",
  type: "flow",
  name: "Lead source assignment merge logic",
  summary:
    "Lead source is assigned via leadSourceId and/or leadSourceDisplay on the Opportunity payload: only leadSourceDisplay given -> assigns if it exists, else creates a new Lead Source and assigns it; only leadSourceId given -> assigns if it exists, else silently no-ops (see concept:leadsource-silent-noop); both given and matching -> assigns normally; both given and not matching -> if leadSourceId exists, only its display name is updated (no assignment); if leadSourceId doesn't exist but the display does, a new Lead Source is created and assigned.",
  tags: ["opportunity", "leadsourceid", "leadsourcedisplay", "lead-source"],
  complexity: "moderate",
  domainMeta: { entryPoint: "POST or PUT /{token}/opportunities", entryType: "http" },
});
edge(DOMAIN_OPPORTUNITIES, FLOW_LEAD_SOURCE, "contains_flow", { weight: 0.6 });
edge(FLOW_LEAD_SOURCE, endpointIdByOp["Opportunity-create"], "routes", { weight: 0.6 });
edge(FLOW_LEAD_SOURCE, endpointIdByOp["Opportunity-update"], "routes", { weight: 0.6 });
edge(FLOW_LEAD_SOURCE, "concept:leadsource-silent-noop", "related", { weight: 0.8 });

const FLOW_EXTENSION = node({
  id: "flow:extension-living-expense-lifecycle",
  type: "flow",
  name: "Extension record lifecycle (livingExpense / otherIncome)",
  summary:
    "GET first to check for an existing uniqueId (if present, do NOT POST — go straight to PUT); JSON.parse the value string into line items; merge in the client-generated new/changed items (new items need a client-generated UUID v4, e.g. crypto.randomUUID()); JSON.stringify the FULL resulting array and PUT it — this is a destructive full-replace, so every existing line item must be resent or it's silently deleted. splits (percentage ownership across linked contacts) is optional on write; if omitted, ownership is split evenly across all linked contacts.",
  tags: ["extension", "livingexpense", "otherincome", "fetch-merge-put"],
  complexity: "complex",
  domainMeta: { entryPoint: "GET /{token}/opportunities/{id}/extension/livingExpense", entryType: "http" },
});
edge(DOMAIN_EXTENSION, FLOW_EXTENSION, "contains_flow", { weight: 0.9 });
edge(FLOW_EXTENSION, endpointIdByOp["Extension-livingExpense-get"], "routes", { weight: 0.9 });
edge(FLOW_EXTENSION, endpointIdByOp["Extension-livingExpense-create"], "routes", { weight: 0.7 });
edge(FLOW_EXTENSION, endpointIdByOp["Extension-livingExpense-update"], "routes", { weight: 0.9 });
edge(FLOW_EXTENSION, endpointIdByOp["Extension-otherIncome-get"], "routes", { weight: 0.7 });
edge(FLOW_EXTENSION, endpointIdByOp["Extension-otherIncome-create"], "routes", { weight: 0.6 });
edge(FLOW_EXTENSION, endpointIdByOp["Extension-otherIncome-update"], "routes", { weight: 0.7 });
edge(FLOW_EXTENSION, "concept:extension-value-json-string", "related", { weight: 0.8 });
edge(FLOW_EXTENSION, "concept:extension-put-destructive-replace", "related", { weight: 0.8 });

const EXT_STEPS = [
  ["get-check", "1. GET, check for existing uniqueId", "If the extension record already has a uniqueId, the record exists — skip POST entirely and go straight to PUT for any change."],
  ["parse-value", "2. JSON.parse the value string", "value is a JSON-encoded string, not structured JSON — parse it client-side into LivingExpenseLineItem[] / OtherIncomeLineItem[]."],
  ["merge-client-side", "3. Merge new/changed line items client-side", "New items need a client-generated UUID v4 (crypto.randomUUID()). splits is optional — omitted means even split across linked contacts."],
  ["put-replace", "4. PUT the full array back (destructive replace)", "JSON.stringify the complete resulting array and PUT it. Any existing item not included is silently deleted — there is no partial-update/append semantic."],
];
let prevStep = null;
EXT_STEPS.forEach(([slug, title, summary], i) => {
  const id = node({ id: `step:extension-living-expense:${slug}`, type: "step", name: title, summary, tags: ["extension", slug], complexity: "simple" });
  edge(FLOW_EXTENSION, id, "flow_step", { weight: (i + 1) / EXT_STEPS.length });
  if (prevStep) edge(prevStep, id, "flow_step", { weight: 0.5, direction: "forward", description: "sequential step" });
  prevStep = id;
});

// ───────────────────────── layers (visual grouping) ─────────────────────────

const layers = [
  {
    id: "layer:overview",
    name: "API Overview",
    description: "Root domain, resource-group domains, and source documents for the Mercury Public API.",
    nodeIds: [DOMAIN_ROOT, DOMAIN_OPPORTUNITIES, DOMAIN_CONTACTS, DOMAIN_PARTNER_CATEGORIES, DOMAIN_EXTENSION, DOMAIN_LIVE_DATA, SOURCE_SWAGGER, SOURCE_WIKI, SOURCE_LIVE_PULL],
  },
  {
    id: "layer:opportunities-endpoints",
    name: "Opportunities — Endpoints",
    description: "The 15 documented Opportunity endpoints (opportunity CRUD, webhooks, and nested assets/liabilities/relatedParties).",
    nodeIds: ENDPOINTS.filter((e) => e.group === DOMAIN_OPPORTUNITIES).map((e) => endpointIdByOp[e.op]),
  },
  {
    id: "layer:contacts-endpoints",
    name: "Contacts — Endpoints",
    description: "The 25 documented Contact endpoints (contact CRUD, webhooks, and nested contactMethods/expenses/incomes/identification/addresses/employments).",
    nodeIds: ENDPOINTS.filter((e) => e.group === DOMAIN_CONTACTS).map((e) => endpointIdByOp[e.op]),
  },
  {
    id: "layer:partner-categories-endpoints",
    name: "Partner Config & Categories — Endpoints",
    description: "PartnerConfig and Category CRUD endpoints.",
    nodeIds: ENDPOINTS.filter((e) => e.group === DOMAIN_PARTNER_CATEGORIES).map((e) => endpointIdByOp[e.op]),
  },
  {
    id: "layer:extension-endpoints",
    name: "Extension Endpoints (undocumented)",
    description: "The 6 livingExpense/otherIncome endpoints missing from the Swagger spec, plus their flow and step nodes.",
    nodeIds: [
      ...ENDPOINTS.filter((e) => e.group === DOMAIN_EXTENSION).map((e) => endpointIdByOp[e.op]),
      FLOW_EXTENSION,
      ...EXT_STEPS.map(([slug]) => `step:extension-living-expense:${slug}`),
    ],
  },
  {
    id: "layer:core-schemas",
    name: "Core Schemas",
    description: "Opportunity, Contact, Address, and the primary nested-entity schemas (Asset, Liability, RelatedParty, Employment, ContactMethod, Identification, Expense, Income).",
    nodeIds: [
      "schema:Opportunity", "schema:Contact", "schema:Address", "schema:Asset", "schema:Liability",
      "schema:RelatedParty", "schema:Employment", "schema:ContactMethod", "schema:Identification",
      "schema:Expense", "schema:Income",
    ],
  },
  {
    id: "layer:support-schemas",
    name: "Config, Search & Webhook Schemas",
    description: "PartnerConfig, Category, MyMarketingTactics, the four SearchResult wrappers, the three SearchParams shapes, Error/Success, and the webhook request/response shapes.",
    nodeIds: [
      "schema:PartnerConfig", "schema:Category", "schema:MyMarketingTactics",
      "schema:OpportunitySearchResult", "schema:ContactSearchResult", "schema:PartnerConfigSearchResult", "schema:CategorySearchResult",
      "schema:OpportunitySearchParams", "schema:PartnerConfigSearchParams", "schema:ContactSearchParams",
      "schema:Error", "schema:Success",
      "schema:ContactHookRequestBody", "schema:OppHookRequestBody", "schema:WebhookCreationResponse",
    ],
  },
  {
    id: "layer:extension-schemas",
    name: "Extension Schemas (TS-types-only)",
    description: "OpportunityExtensionRecord and its line-item shapes — defined in the generated TypeScript types but absent from the Swagger spec's own schema catalog.",
    nodeIds: ["schema:OpportunityExtensionRecord", "schema:LivingExpenseLineItem", "schema:OtherIncomeLineItem", "schema:ExtensionSplit"],
  },
  {
    id: "layer:usage-flows",
    name: "Usage Flows",
    description: "Documented usage patterns: creating opportunities with nested entities, the universal nested-entity CRUD-via-PUT rule, soft-delete, search/pagination, and lead-source assignment.",
    nodeIds: [FLOW_CREATE_OPP, FLOW_NESTED_CRUD, STEP_CREATE, STEP_UPDATE, STEP_DELETE, FLOW_SOFT_DELETE, FLOW_SEARCH, FLOW_LEAD_SOURCE],
  },
  {
    id: "layer:field-quirks-and-live-data",
    name: "Field-Level Quirks & Live Data",
    description: "Spec bugs, format mismatches, undocumented fields, and live-CRM-constrained value sets — the knowledge that doesn't live in the formal schema at all.",
    nodeIds: [...CONCEPTS.map((c) => c.id), CLAIM_STATUS, CLAIM_CATEGORIES, CLAIM_LENDERS],
  },
];

// ───────────────────────── tour ─────────────────────────

const tour = [
  {
    order: 1,
    title: "Start here: the Mercury Public API at a glance",
    description:
      "The Mercury Public API (Sandbox) is Connective's loan/CRM REST API — Swagger 2.0, host apis.connective.com.au, basePath /mercury/v1. Auth is a {token} URL path segment plus an x-api-key header (not a bearer header). This tour walks through its 4 documented resource groups, 6 undocumented extension endpoints, 30 schema shapes, and the field-level gotchas that only show up in live production data.",
    nodeIds: [DOMAIN_ROOT],
  },
  {
    order: 2,
    title: "Opportunities: the loan/deal record",
    description:
      "An Opportunity is the loan-application-level object: amount, lender, status, settlement dates. It nests assets, liabilities, and relatedParties. Notice status is spec'd as free text but production actually constrains it to 30 canonical pipeline-stage strings.",
    nodeIds: [DOMAIN_OPPORTUNITIES, "schema:Opportunity", CLAIM_STATUS],
    languageLesson: "A REST field spec'd as free-text string doesn't mean the producing system treats it as unconstrained — always check live data before trusting an empty enum.",
  },
  {
    order: 3,
    title: "Creating an Opportunity with nested entities in one call",
    description:
      "POST /{token}/opportunities can include assets/liabilities/relatedParties in the same create call without supplying their own uniqueIds — Mercury auto-generates them server-side. The response returns { uniqueId, emailId }.",
    nodeIds: [FLOW_CREATE_OPP, endpointIdByOp["Opportunity-create"]],
  },
  {
    order: 4,
    title: "The universal nested-entity CRUD rule",
    description:
      "There's no separate create/update/delete endpoint for nested entities. One PUT on the parent handles all three, disambiguated by uniqueId + isDeleted: absent uniqueId creates; present uniqueId with isDeleted absent/false updates; present uniqueId with isDeleted: true soft-deletes. The same pattern deletes the whole Opportunity at the top level. The one true DELETE verb in the entire API is for webhooks only.",
    nodeIds: [FLOW_NESTED_CRUD, STEP_CREATE, STEP_UPDATE, STEP_DELETE, "concept:nested-entity-crud-rule"],
    languageLesson: "Encoding CRUD intent into payload shape (presence/absence of a key field) instead of the HTTP verb is a common pattern in CRM-style APIs that predate REST purism — worth recognising rather than fighting when building a client.",
  },
  {
    order: 5,
    title: "Contacts and their nested sub-resources",
    description:
      "Contact mirrors Opportunity's nesting pattern (contactMethods, expenses, incomes, addresses, employments, and — inconsistently capitalized — Identification). Always filter isDeleted=false unless you explicitly want deleted records.",
    nodeIds: [DOMAIN_CONTACTS, "schema:Contact", "concept:contact-identification-casing"],
  },
  {
    order: 6,
    title: "Search & pagination: query params, not a separate verb",
    description:
      "GET with search=true, count (max 100, default 25), offset (default 0), sortKey, sortOrder. Complex filters go through a URL-encoded JSON object in searchParams, which supports a compact date-range grammar (start/end, /date, date/, etc).",
    nodeIds: [FLOW_SEARCH, "concept:date-range-search-syntax"],
  },
  {
    order: 7,
    title: "The extension endpoints: entirely missing from the spec",
    description:
      "livingExpense and otherIncome exist as real production endpoints under /opportunities/{id}/extension/* but appear nowhere in the Swagger YAML — only in a wiki export. Their value field is a JSON-encoded STRING, not structured JSON, and PUT is a destructive full-replace of the entire array.",
    nodeIds: [DOMAIN_EXTENSION, FLOW_EXTENSION, "concept:extension-value-json-string", "concept:extension-put-destructive-replace"],
    languageLesson: "When a spec is auto-generated from a subset of the real API surface, always look for a secondary source (wiki, changelog, live traffic capture) before assuming the spec is complete.",
  },
  {
    order: 8,
    title: "Format mismatch: dates come back as epoch milliseconds",
    description:
      "The spec declares createdOn/lastUpdated/statusLastUpdated/deletedOn as date-time strings. Live production actually returns Unix epoch milliseconds (numbers). Parsing with a date-string parser silently produces Invalid Date — use new Date(epochMs) instead.",
    nodeIds: ["concept:date-fields-epoch-ms"],
  },
  {
    order: 9,
    title: "Fields production has that the spec doesn't",
    description:
      "A live schema-only inspection turned up roughly 20 Opportunity fields absent from the Swagger spec entirely, including a whole undocumented invoicing sub-system (invoiceId, invoiceCafStatus, etc). Never assume the spec is a complete field list.",
    nodeIds: ["concept:opportunity-undocumented-fields", "schema:Opportunity"],
  },
  {
    order: 10,
    title: "Known spec bugs worth patching in a typed client",
    description:
      "Address.country has a YAML bug where Norway's ISO code NO parses as the boolean false instead of the string \"NO\". Asset.motorVehiceYear is a genuine typo in the wire contract (not a typo to fix). Both must be handled as-is by any client that talks to the real API.",
    nodeIds: ["concept:address-country-enum-bug", "concept:motor-vehicle-year-typo", "schema:Address", "schema:Asset"],
  },
];

// ───────────────────────── assemble & write ─────────────────────────

const graph = {
  version: "1.0.0",
  project: {
    name: "Mercury Public API (Sandbox) — Field Knowledge",
    languages: ["yaml", "typescript"],
    frameworks: ["Swagger 2.0"],
    description:
      "A hand-curated knowledge graph of Connective's Mercury Public API (Sandbox) — every documented endpoint and schema field, the 6 endpoints and ~20 Opportunity fields production has that the spec doesn't, spec bugs, and live-CRM-constrained enum values pulled from Finhub's connected Mercury CRM on 2026-07-17.",
    analyzedAt: "2026-07-18T00:00:00.000Z",
    gitCommitHash: "n/a",
  },
  nodes,
  edges,
  layers,
  tour,
};

// Referential sanity check (mirrors validateGraph's dangling-reference behaviour,
// run here so authoring mistakes fail loudly instead of silently dropping edges).
const nodeIds = new Set(nodes.map((n) => n.id));
const danglingEdges = edges.filter((e) => !nodeIds.has(e.source) || !nodeIds.has(e.target));
if (danglingEdges.length > 0) {
  console.error(`✗ ${danglingEdges.length} edge(s) reference a non-existent node id:`);
  for (const e of danglingEdges.slice(0, 20)) {
    console.error(`  ${e.source} -[${e.type}]-> ${e.target}`);
  }
  process.exit(1);
}
for (const layer of layers) {
  const dangling = layer.nodeIds.filter((id) => !nodeIds.has(id));
  if (dangling.length > 0) {
    console.error(`✗ layer "${layer.id}" references non-existent node id(s): ${dangling.join(", ")}`);
    process.exit(1);
  }
}
for (const step of tour) {
  const dangling = step.nodeIds.filter((id) => !nodeIds.has(id));
  if (dangling.length > 0) {
    console.error(`✗ tour step "${step.title}" references non-existent node id(s): ${dangling.join(", ")}`);
    process.exit(1);
  }
}

const docsOutPath = resolve(repoRoot, "docs/mercury-api/knowledge-graph.json");
mkdirSync(dirname(docsOutPath), { recursive: true });
writeFileSync(docsOutPath, JSON.stringify(graph, null, 2) + "\n");
console.log(`Wrote ${docsOutPath}`);

const localOutDir = resolve(repoRoot, ".understand-anything");
mkdirSync(localOutDir, { recursive: true });
const localOutPath = resolve(localOutDir, "knowledge-graph.json");
writeFileSync(localOutPath, JSON.stringify(graph, null, 2) + "\n");
console.log(`Wrote ${localOutPath} (gitignored — for local dashboard preview)`);

console.log(`\nNodes: ${nodes.length}`);
console.log(`Edges: ${edges.length}`);
console.log(`Layers: ${layers.length}`);
console.log(`Tour steps: ${tour.length}`);
