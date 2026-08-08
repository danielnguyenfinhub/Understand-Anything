/**
 * Mercury API — field & UI-enum model.
 *
 * Derives, from the live-audited OpenAPI contract plus the enum catalog:
 *
 *   1. every field of every object schema (name, wire type, enum binding),
 *   2. every enum, matched back to the field(s) that carry it,
 *   3. the UI control each enum implies, and the hazards a form has to handle.
 *
 * (1) and (2) are *derived* — nothing is hand-typed, so re-running after a
 * contract refresh picks up new fields and values automatically. (3) is the
 * hand-curated part: a value list can be derived, but "this is a typeahead,
 * and it shares a slot with three sibling fields that must de-duplicate" is
 * knowledge that has to be written down.
 *
 * Sources (both committed under docs/mercury-api/):
 *   mercury-api.openapi.json      — OpenAPI 3.1 live-audited contract (2026-07-18)
 *   mercury-api.enumcatalog.json  — the 32 named enums and their values
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DOCS_DIR = resolve(repoRoot, "docs/mercury-api");

// ─────────────────────── UI control taxonomy ───────────────────────

/**
 * Option-count thresholds. Deliberately conservative: the cost of rendering a
 * 51-option native <select> is a user scrolling blind, and the cost of a
 * typeahead on a 4-option enum is a click that used to be zero.
 */
export const CONTROL_RULES = [
  { control: "radio", max: 3, why: "≤3 options — show them all, no click to discover them" },
  { control: "select", max: 12, why: "4–12 options — a plain dropdown is scannable at a glance" },
  { control: "combobox", max: 60, why: "13–60 options — needs type-to-filter, but the full list is still renderable" },
  { control: "typeahead", max: Infinity, why: ">60 options — filter-as-you-type only; never render the full list" },
];

function controlForCount(n) {
  return CONTROL_RULES.find((r) => n <= r.max);
}

// ─────────────────────── curated UI knowledge ───────────────────────

/**
 * Per-enum UI notes. `control` overrides the count-derived default where the
 * shape of the data beats the arithmetic; `hazards` are the things that make a
 * naive form wrong on the wire.
 */
export const ENUM_UI = {
  AuState: {
    label: "State / territory",
    hazards: [
      "The list is 9 long, not 8: it carries an explicit `OTHER` alongside the eight AU states and territories. On `Identification.placeOfIssue`, `OTHER` is how an interstate or overseas issuing authority is recorded — a picker limited to the real states silently cannot express those documents.",
    ],
  },
  Frequency: {
    label: "Frequency (Title Case)",
    hazards: [
      "Mercury carries two frequency enums that are not interchangeable. This one is Title Case and uses `Annual`; `FrequencyLower` is lowercase and uses `annually`. Sharing one frequency control across Expense/Income and Asset/Liability requires mapping both the casing *and* the word — `Annual` → `annually` is not a `toLowerCase()`.",
    ],
  },
  FrequencyLower: {
    label: "Frequency (lowercase)",
    hazards: [
      "Lowercase variant used by every Asset and Liability frequency field. `annually`, not `annual` — the odd one out if you derive it from `Frequency` by lowercasing.",
    ],
  },
  AssetLiabilityType: {
    control: "select",
    label: "Asset / liability type",
    hazards: [
      "This is the enum that drives conditional form sections, not just a value: `realEstate` reveals the `address` + `realEstate*` + `existingMortgage*` groups, `vehicle` reveals `motorVehicle*`, `account` reveals `accountName`/`accountNumber`/`accountBSB`, and `standard` reveals nothing beyond `details`.",
      "It has to stay consistent with `Asset.name` / `Liability.name`, which is a separate enum — picking the name `Real Estate` and the type `vehicle` is representable on the wire and meaningless downstream.",
    ],
  },
  CountryCode: {
    label: "Country",
    hazards: [
      "250 codes — typeahead only.",
      "It is not the current ISO 3166-1 list: `AN` (Netherlands Antilles, withdrawn 2010) is present. Validating user input against a live ISO library will reject values Mercury itself accepts and returns.",
      "The original Swagger had Norway's `NO` parsed as the boolean `false` (unquoted YAML). This live-audited contract has it fixed — but any client generated from the older spec still carries the bug.",
    ],
  },
  ContactTitle: { label: "Title" },
  MaritalStatus: {
    label: "Marital status",
    hazards: [
      "`DeFacto` is one unspaced word on the wire. Display it as “De Facto” by all means, but the value you send back is `DeFacto`.",
    ],
  },
  Gender: {
    label: "Gender",
    hazards: [
      "The wire contract admits exactly `M` and `F`. There is no non-binary, other, or undisclosed value, so a form cannot offer one — anything else is rejected. The field is optional, so leaving it unset is the honest representation of “not one of these two”; don't force a choice to satisfy the control.",
    ],
  },
  EmploymentStatusContact: {
    label: "Employment status (Contact)",
    hazards: [
      "Name collision: `Contact.employmentStatus` is this 9-value enum (Full Time, Casual, Self-Employed …), while `Employment.employmentStatus` on the nested Employment record is free text carrying a completely different vocabulary (Primary, Secondary, Previous). Same field name, different entity, different meaning — do not bind both to one control.",
    ],
  },
  PhoneDisplayType: {
    label: "Phone slot type",
    hazards: [
      "Four parallel fields (`phoneDisplayType1`…`4`) share this one enum. They are slots, so the same value in two slots is a data-entry error the API will happily store — de-duplicate the selected value across the four controls.",
    ],
  },
  ContactMethodEnum: {
    label: "Contact method slot",
    hazards: [
      "Sits on the same record as `ContactMethod.type` and must stay coherent with it: `Email 1/2/3` go with type `email`, `Mobile`/`Mobile 2` with `mobile`, `Home`/`Home 2`/`Home Fax` with `home`, and the `Business*` values with `phone`. That pairing is inferred from the value names and matching live payloads — it is not asserted by the contract, so derive `type` from the slot but let it be overridden.",
    ],
  },
  ContactMethodType: {
    label: "Contact method channel",
    hazards: [
      "Lowercase, and narrower than the slot enum it accompanies (4 channels for 11 slots). See the pairing note on `ContactMethodEnum`.",
    ],
  },
  DocumentStatus: { label: "Document version sighted" },
  DocumentType: {
    label: "Identification document type",
    hazards: [
      "51 values — the longest enum outside `CountryCode`, and the one most worth grouping in the UI (licences, passports, birth/citizenship, government cards, bank instruments, statements, references) rather than presenting as a flat alphabetical list.",
      "Values are PascalCase identifiers, not display strings: `DriversLicenceAust`, `GovtIssueFinancialBenNot`. They need a label map before a human sees them.",
    ],
  },
  ExpenseType: {
    label: "Expense type",
    hazards: [
      "Overlaps `LiabilityName` by name (Credit Card, Home Loan, Personal Loan, Car Loan). The same real-world commitment can be captured as a Contact expense *and* an Opportunity liability; the enums do not stop you double-counting it.",
    ],
  },
  IncomeType: {
    label: "Income type",
    hazards: [
      "Also the de-facto vocabulary for `OtherIncomeLineItem.type` on the extension route, where the field is an open string rather than this enum — same options, no validation.",
    ],
  },
  OpportunityCategory: {
    label: "Opportunity category",
    hazards: [
      "Carried by the field named `transactionType`, not `category`. The similarly-named `tranxType` field is a *different* enum (`OpportunityTranxType`). Two adjacent fields, near-identical names, unrelated value sets — the single easiest field pair in this API to wire up backwards.",
    ],
  },
  OpportunityTranxType: {
    label: "Transaction type",
    hazards: ["Carried by `tranxType`. See the naming collision noted on `OpportunityCategory`."],
  },
  LoanStatusActive: {
    control: "creatable-select",
    label: "Pipeline stage (active)",
    softFor: ["Opportunity.status"],
    hazards: [
      "Not an API constraint. `Opportunity.status` is a free-text string in the contract; these 27 values are the branch's live pipeline catalog. A closed dropdown here will block a legitimate value the moment the branch adds a stage — offer the known list, allow free text.",
      "Five values contain an en-dash (`–`), not a hyphen: `1. Lead – Discovery`, `8.2 Settled – Commission Paid`, `8.3 Construction Loan – Progress Payments`, `9.3/9.4/9.5 Mortgage Review – NN Month`. Retyping them with a hyphen produces a string that will not match.",
      "The leading numbers order the pipeline but do not sort lexically (`10` would fall between `1.` and `2.`); sort on an explicit index, not the label.",
    ],
  },
  LoanStatusInactive: {
    control: "creatable-select",
    label: "Pipeline stage (closed)",
    softFor: ["Opportunity.status"],
    hazards: [
      "Same free-text caveat as the active list. Numbering jumps from `9.5` straight to `12` — stages 10 and 11 are absent from the catalog, so don't infer the set from the numbering.",
    ],
  },
  FinhubContactCategoryName: {
    control: "creatable-select",
    label: "Contact category",
    softFor: ["Category.categoryName"],
    hazards: [
      "Branch data, not a contract constraint — `Category.categoryName` is free text.",
      "Three families share the list: `PREF - *` (comms preference), `FREQ - *` (contact frequency), `REVIEW - *` (review cadence). Group by prefix; a contact holds several at once, so this is a multi-select over `Contact.categories[]`, not a single choice.",
    ],
  },
  HousingSituation: {
    label: "Housing situation",
    hazards: [
      "Appears on `Address.housingSituation` (writable) and again on `RelatedParty.housingSituation`, where it is a hydrated read-only copy — rendering an editable control on the RelatedParty copy invites an edit that goes nowhere.",
    ],
  },
  RelatedPartyRelationship: {
    label: "Relationship to the deal",
    hazards: [
      "`JSG/ PRE` carries a space after the slash. It is the literal wire value; normalising the whitespace breaks the match.",
      "Mixes applicant roles (Primary applicant, Co-Applicant, Joint Borrower) with professional roles (Conveyancer, Solicitor, Accountant) in one flat list — worth grouping in the UI.",
    ],
  },
  AssetName: {
    label: "Asset name",
    hazards: [
      "Pairs with `AssetLiabilityType`: `Real Estate` implies type `realEstate`, `Motor Vehicle` implies `vehicle`, the account-shaped names (Cheque Account, Savings Account, Term Deposit, Cash Management) imply `account`. Derive the type from the name and let it be overridden rather than asking twice.",
    ],
  },
  ValueBasis: { label: "Basis of valuation" },
  RealEstatePurpose: { label: "Property purpose" },
  LiabilityName: {
    label: "Liability name",
    hazards: [
      "`Credit Card` and `Store Card` are the only values for which `creditCardType` and `limit` are meaningful — gate those fields on the name.",
    ],
  },
  CreditCardType: {
    label: "Card scheme",
    hazards: ["Only meaningful when `Liability.name` is `Credit Card`; otherwise it should not be shown or sent."],
  },
  ContactWebhookSubscriptionType: {
    label: "Contact webhook scope",
    hazards: [
      "Values are full sentence-case phrases (`Contacts in my branch/office`), not slugs. They are the wire values — send them verbatim.",
    ],
  },
  ContactWebhookEvent: {
    label: "Contact webhook event",
    hazards: ["`Created or updated` is a single value, not two — it is not a multi-select over `Created` and an update event."],
  },
  OpportunityWebhookSubscriptionType: { label: "Opportunity webhook scope" },
  OpportunityWebhookEvent: {
    label: "Opportunity webhook event",
    hazards: ["Superset of the contact event list: adds `Opportunity Status Changed`, which has no contact-side equivalent."],
  },
};

/**
 * Fields the contract types as plain strings but which are constrained in
 * practice, or whose values come from a catalog rather than the spec. These are
 * the ones a form should render as a creatable/suggesting control: known values
 * offered, free text still accepted.
 */
export const SOFT_ENUM_FIELDS = [
  {
    field: "Opportunity.status",
    catalog: ["LoanStatusActive", "LoanStatusInactive"],
    control: "creatable-select",
    note: "Free text in the contract; 30 branch pipeline values in live data. See the en-dash and sort-order hazards on LoanStatusActive.",
  },
  {
    field: "Category.categoryName",
    catalog: ["FinhubContactCategoryName"],
    control: "creatable-multiselect",
    note: "Free text in the contract; 15 branch values in three PREF-/FREQ-/REVIEW- families. Multi-valued via Contact.categories[].",
  },
  {
    field: "Contact.citizenshipCountry",
    catalog: ["CountryCode"],
    control: "creatable-typeahead",
    note: "Typed `CountryCode | string` in the generated types and plain string in the contract — offer the country list, accept anything.",
  },
  {
    field: "Contact.countryOfResidency",
    catalog: ["CountryCode"],
    control: "creatable-typeahead",
    note: "As above.",
  },
  {
    field: "Contact.companyRegisteredIn",
    catalog: ["CountryCode"],
    control: "creatable-typeahead",
    note: "As above.",
  },
  {
    field: "OpportunityExtensionRecord.key",
    values: ["livingExpense", "otherIncome"],
    control: "select",
    note: "Determined by the route you called, not chosen by a user — it should not be an editable control at all.",
  },
  {
    field: "OpportunityExtensionRecord.parentType",
    values: ["loan"],
    control: "hidden",
    note: "Only `loan` observed. Constant, not a choice.",
  },
  {
    field: "LivingExpenseLineItem.type",
    values: ["Clothing & Personal Care", "Child & Spouse Maintenance"],
    control: "creatable-select",
    note: "Open union — only two values documented, and the extension routes validate nothing. Offer what's known; expect more.",
  },
  {
    field: "OtherIncomeLineItem.type",
    catalog: ["IncomeType"],
    control: "creatable-select",
    note: "Open union that borrows IncomeType's vocabulary without its validation.",
  },
  {
    field: "Employment.employmentBasis",
    values: ["Full time", "Part time"],
    control: "creatable-select",
    note: "Free text. Note the casing differs from EmploymentStatusContact's `Full Time` / `Part Time` — same words, different capitalisation, different field.",
  },
  {
    field: "Employment.employmentStatus",
    values: ["Primary", "Secondary", "Previous"],
    control: "creatable-select",
    note: "Free text, and NOT the same vocabulary as Contact.employmentStatus. See the collision note on EmploymentStatusContact.",
  },
  {
    field: "Employment.employmentType",
    values: ["Payg", "Self employment"],
    control: "creatable-select",
    note: "Free text.",
  },
  {
    field: "Employment.paygEmployerType",
    values: ["Public", "Private"],
    control: "creatable-select",
    note: "Free text.",
  },
  {
    field: "Address.type",
    control: "creatable-select",
    note: "Residence type, free text with no documented value set — a plain text input is the honest control until live values are censused.",
  },
  {
    field: "Asset.propertyType",
    control: "creatable-select",
    note: "Free text; no documented value set.",
  },
  {
    field: "Asset.propertyStatus",
    control: "creatable-select",
    note: "Free text; no documented value set.",
  },
  {
    field: "Asset.propertyTitleType",
    control: "creatable-select",
    note: "Free text; no documented value set.",
  },
  {
    field: "Asset.realEstateFinanceType",
    control: "creatable-select",
    note: "Free text; no documented value set.",
  },
  {
    field: "Asset.motorVehicleType",
    control: "creatable-select",
    note: "Free text; no documented value set.",
  },
];

/**
 * Field-level hazards that change how a form is built even though no enum is
 * involved — formats, read-only-ness, casing duplicates and one secret.
 */
export const FIELD_HAZARDS = [
  {
    id: "webpassword-never-render",
    fields: ["Contact.webPassword"],
    severity: "critical",
    note: "Observed in GET responses. Strip it at the wire boundary: never bind it to a control, never log it, never put it in client state. It should not exist in any model a UI can reach.",
  },
  {
    id: "date-epoch-or-string",
    fields: [
      "Contact.createdOn", "Contact.lastUpdated", "Contact.deletedOn", "Contact.dateOfBirth",
      "Opportunity.createdOn", "Opportunity.lastUpdated", "Opportunity.statusLastUpdated",
      "Opportunity.deletedOn", "Opportunity.submittedToLenderDate",
      "ContactMethod.modified", "RelatedParty.dateOfBirth",
    ],
    severity: "high",
    note: "Typed `number | string` — live payloads return Unix epoch milliseconds where the original spec promised a date-time string. A date control must normalise on read (`typeof v === 'number' ? new Date(v) : new Date(String(v))`); passing an epoch number to a string date parser yields Invalid Date silently.",
  },
  {
    id: "boolean-as-string",
    fields: ["Opportunity.isNCCPEnabled"],
    severity: "medium",
    note: "Typed `boolean | string` — Mercury sometimes serialises it as the string `\"true\"`. A checkbox bound straight to it treats `\"false\"` as truthy.",
  },
  {
    id: "amount-as-string",
    fields: ["LivingExpenseLineItem.amount", "OtherIncomeLineItem.amount"],
    severity: "high",
    note: "String, not number — unlike every other money field in the API (`Expense.amount`, `Income.amount`, `Asset.value` are all numbers). A shared money input must serialise back to a string on these two.",
  },
  {
    id: "casing-duplicates",
    fields: [
      "ContactMethod.personID", "Income.personID", "Income.personId", "Expense.personID",
      "Identification.personId", "RelatedParty.personID",
      "Address.parentId", "Address.parentID",
      "Contact.Identification", "Contact.identifications",
    ],
    severity: "high",
    note: "The same concept ships under two casings depending on the endpoint. `Contact.Identification` (capital I) is the Swagger name; live Contact payloads use `identifications`. Read both, write the one the endpoint you are calling expects, and never let a form bind to only one.",
  },
  {
    id: "readonly-hydrated-fields",
    fields: [
      "Asset.motorVehicleMake", "RelatedParty.fullName", "RelatedParty.addressBlock",
      "RelatedParty.email", "RelatedParty.mobile", "RelatedParty.dateOfBirth",
      "Contact.fullName", "Contact.dateOfBirthDisplay", "Opportunity.lenderDisplayName",
      "Opportunity.agentName", "Opportunity.confirmedSettlementDateDisplay", "Opportunity.nextActionDisplay",
    ],
    severity: "medium",
    note: "Returned by GET as display/hydrated values. `Asset.motorVehicleMake` in particular is display-only — the make is written through `Asset.details`. Render these read-only; an editable control produces an edit that is silently discarded.",
  },
  {
    id: "field-name-typo-is-the-contract",
    fields: ["Asset.motorVehiceYear"],
    severity: "medium",
    note: "Missing the `l` in `Vehicle`. It is the real wire name — correcting the spelling in a client sends a field Mercury ignores.",
  },
  {
    id: "extension-put-full-replace",
    fields: ["OpportunityExtensionRecord.value"],
    severity: "critical",
    note: "A JSON-encoded string, not structured JSON, and its PUT is a destructive full replace. A form editing one line item must parse the string, merge, re-stringify and submit the complete array — anything omitted is deleted without warning.",
  },
  {
    id: "collection-reads-require-search",
    fields: ["GET /{token}/opportunities", "GET /{token}/contacts"],
    severity: "high",
    note: "`search=true` is required on collection reads; `count` (default 100) and `offset` (default 0) drive pagination. A list view that omits `search` gets an error, not an empty page.",
  },
];

// ─────────────────────── derivation ───────────────────────

function typeOf(propSchema) {
  if (propSchema.$ref) return { kind: "ref", ref: propSchema.$ref.split("/").pop() };
  const variants = propSchema.anyOf || propSchema.oneOf;
  if (variants) {
    return { kind: "union", of: variants.map((v) => (v.$ref ? v.$ref.split("/").pop() : v.type)) };
  }
  if (propSchema.type === "array") {
    const items = propSchema.items || {};
    return { kind: "array", of: items.$ref ? items.$ref.split("/").pop() : items.type || "unknown" };
  }
  if (propSchema.enum) return { kind: "enum", values: propSchema.enum };
  return { kind: "scalar", type: propSchema.type, format: propSchema.format };
}

function renderType(t) {
  switch (t.kind) {
    case "ref": return t.ref;
    case "union": return t.of.join(" | ");
    case "array": return `${t.of}[]`;
    case "enum": return `enum(${t.values.length})`;
    default: return t.format ? `${t.type} (${t.format})` : String(t.type);
  }
}

export function buildFieldEnumModel({
  openapiPath = resolve(DOCS_DIR, "mercury-api.openapi.json"),
  enumCatalogPath = resolve(DOCS_DIR, "mercury-api.enumcatalog.json"),
} = {}) {
  const openapi = JSON.parse(readFileSync(openapiPath, "utf8"));
  const catalog = JSON.parse(readFileSync(enumCatalogPath, "utf8"));
  const schemas = openapi.components.schemas;

  // Value-set → enum name, so inline enums on properties can be matched back to
  // their named counterpart without trusting property names.
  const byValueSet = new Map();
  for (const [name, values] of Object.entries(catalog.enums)) {
    byValueSet.set(JSON.stringify([...values].sort()), name);
  }
  for (const [name, schema] of Object.entries(schemas)) {
    if (schema.enum) byValueSet.set(JSON.stringify([...schema.enum].sort()), name);
  }

  const objectSchemas = [];
  const bindings = new Map(); // enum name → ["Schema.field", …]
  const unmatchedInlineEnums = [];

  for (const [schemaName, schema] of Object.entries(schemas)) {
    const props = schema.properties;
    if (!props) continue;
    const fields = [];
    for (const [fieldName, prop] of Object.entries(props)) {
      const t = typeOf(prop);
      let enumName = null;
      if (t.kind === "enum") {
        enumName = byValueSet.get(JSON.stringify([...t.values].sort())) || null;
        if (enumName) {
          if (!bindings.has(enumName)) bindings.set(enumName, []);
          bindings.get(enumName).push(`${schemaName}.${fieldName}`);
        } else {
          unmatchedInlineEnums.push(`${schemaName}.${fieldName}`);
        }
      }
      fields.push({
        name: fieldName,
        type: renderType(t),
        kind: t.kind,
        enum: enumName,
        description: prop.description || null,
      });
    }
    objectSchemas.push({ name: schemaName, fields });
  }

  const enums = Object.entries(catalog.enums).map(([name, values]) => {
    const ui = ENUM_UI[name] || {};
    const derived = controlForCount(values.length);
    const boundFields = bindings.get(name) || [];
    const control = ui.control || derived.control;
    const overridden = control !== derived.control;
    return {
      name,
      label: ui.label || name,
      values,
      valueCount: values.length,
      control,
      controlRationale: overridden
        ? `Overrides the ${values.length}-option default (\`${derived.control}\`): the field this describes is free text on the wire, so the control has to accept values outside the list.`
        : derived.why,
      boundFields,
      isApiValidated: boundFields.length > 0,
      softFor: ui.softFor || [],
      hazards: ui.hazards || [],
    };
  });

  const fieldCount = objectSchemas.reduce((n, s) => n + s.fields.length, 0);
  const enumBoundFieldCount = enums.reduce((n, e) => n + e.boundFields.length, 0);

  return {
    generatedFrom: {
      openapi: `${openapi.info.title} ${openapi.info.version}`,
      enumCatalogGeneratedAt: catalog.generatedAt,
    },
    stats: {
      objectSchemas: objectSchemas.length,
      fields: fieldCount,
      enums: enums.length,
      enumValues: enums.reduce((n, e) => n + e.valueCount, 0),
      enumBoundFields: enumBoundFieldCount,
      apiValidatedEnums: enums.filter((e) => e.isApiValidated).length,
      catalogOnlyEnums: enums.filter((e) => !e.isApiValidated).length,
      softEnumFields: SOFT_ENUM_FIELDS.length,
      hazardGroups: FIELD_HAZARDS.length,
      paths: Object.keys(openapi.paths).length,
      operations: Object.values(openapi.paths).reduce(
        (n, p) => n + Object.keys(p).filter((k) => ["get", "post", "put", "delete", "patch"].includes(k)).length,
        0,
      ),
    },
    enums,
    schemas: objectSchemas,
    softEnumFields: SOFT_ENUM_FIELDS,
    fieldHazards: FIELD_HAZARDS,
    controlRules: CONTROL_RULES.map((r) => ({ control: r.control, maxOptions: r.max === Infinity ? null : r.max, rationale: r.why })),
    unmatchedInlineEnums,
  };
}
