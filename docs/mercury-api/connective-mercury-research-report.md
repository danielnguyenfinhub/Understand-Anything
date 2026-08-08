# Connective Mercury Nexus API — Comprehensive interface and integration research report

**Research date:** 21 July 2026  
**Scope:** Publicly accessible Connective primary material and the complete chain of directly linked Mercury API references reachable from it. This report is designed to be read together with the live-audited OpenAPI 3.1 contract and TypeScript wire types in this package.

## Executive conclusion

Mercury Nexus is Connective’s all-in-one broker platform. Its public API is a production integration layer for the Mercury **Person/Contact** and **Opportunity** records and their supported children. It is not an API for every Mercury Nexus feature, not an API for the Connective product database, and not a sandbox. API-created records are visible in the normal Mercury Nexus interface, so integrations must treat every write as a production CRM change.

The strongest current sources establish this implementation baseline:

```text
Base URL:  https://apis.connective.com.au/mercury/v1
URL shape: {base URL}/{branch API token}/{resource}
Header:    x-api-key: {group API key}
Body:      JSON over HTTPS
Methods:   GET, POST, PUT; soft-delete with PUT { "isDeleted": true }
```

Credentials are obtained in **Mercury Nexus → Admin → Integrations** and are only visible to accounts with **Partner Level access**. A virtual-branch group uses one API key but each branch has its own token. Current Connective guidance says there is no UAT or sandbox API. The authenticated developer portal is the intended source of the current formal API documentation, while the publicly downloadable Swagger 2.0 file dates from 2021 and demonstrably lags the live service. The previously completed live audit also found fields and wire-format differences absent from that historical Swagger file. Do not generate a production client solely from it.

The practical integration pattern is: search first, use Mercury `uniqueId` values as foreign keys, fetch before a consequential update, use resource-specific PUT or POST calls, soft-delete rather than DELETE, and reconcile through webhooks plus periodic delta scans. The two Financials extensions, Living Expenses and Other Income, require special read–modify–write handling because their `value` field is a JSON document encoded as a string and PUT replaces the full collection.

---

## 1. What Mercury Nexus is, and what the public API reaches

Connective describes Mercury Nexus as a broker platform that combines client management, application lodgement, compliance, business-growth tooling and analytics. Public product material also identifies client portal, lead capture, credit checks, open banking, data capture, workflows and DigiSign as platform capabilities. The presence of a feature in the UI does **not** establish that it is available via this public API.

Connective’s API articles consistently scope the public interface to Person/Contact and Opportunity records. The published parent–child model is:

| Mercury Nexus area | Public API scope confirmed by Connective | Interface/integration implication |
|---|---|---|
| CRM Person / Contact record | Contact plus contact methods, incomes, expenses, addresses, employment; legacy Swagger also describes identification routes | Use Contact as the canonical client/person entity and `uniqueId` as the external key. |
| Opportunity / deal record | Opportunity plus assets, liabilities and related parties | Use an Opportunity as the application/deal parent; do not infer that every screen field is writable. |
| Financials | Living Expenses and Other Income extensions on an existing Opportunity | Implement as a distinct extension model, not as normal child records. |
| CRM changes | Contact and Opportunity webhooks, including listed child changes | A webhook informs synchronisation; it is not an all-platform event stream. |
| Connective products database | Explicitly unavailable | Do not plan lender/product catalogue synchronisation through this API. |
| Notes | Explicitly unavailable | Use `notePadText` only where appropriate; do not expect the normal Notes feature to be programmable. |
| Documents | Email-to-opportunity inbox is described as currently unavailable | Do not design a document-upload workflow on the public API. |

Sources: [Mercury Nexus product page](https://www.connective.com.au/mercury-nexus), [Getting Started](https://wiki.connective.com.au/en/articles/633-getting-started-with-mercury-api), [Mercury API FAQs](https://wiki.connective.com.au/en/articles/666-mercury-api-faqs).

### What is known versus not established

Connective expressly says not all Person and Opportunity fields have endpoints. If a desired field is absent, its published route is to submit an idea through the [Ideas Portal](https://ideas.connective.com.au/). This means the interface-to-API mapping must be treated as a supported subset, not as a complete mirror of Mercury Nexus.

The prior live audit expands the usable contract beyond the older documentation: it observed additional Contact, Opportunity and nested-child fields, mixed casing such as `personID`/`personId` and `parentID`/`parentId`, epoch-millisecond dates, string booleans in some responses, and sensitive `webPassword` data in Contact responses. Those facts are live evidence; they should override an absent or narrower historical Swagger schema. Never persist, log, display or use `webPassword` in an integration.

---

## 2. Access, identity, environments and security

### 2.1 Credentials and branch identity

Current Connective instructions say to sign into Mercury Nexus, open the **Admin** app, select **Integrations**, and copy the API key and API token. Partner Level access is a prerequisite. The implementation should model the two values differently:

- The API key identifies the broker group and is sent as `x-api-key`.
- The token identifies the branch context and is embedded in every request URL.
- For virtual branches, Connective says the API key is shared across the group but each branch has a different API token. Select the branch deliberately; do not reuse an arbitrary token across branch jobs.

Current official source: [API integration with Mercury Nexus, 19 February 2026](https://wiki.connective.com.au/en/articles/637-api-integration-with-mercury-nexus). Branch detail: [FAQ, 2 March 2026](https://wiki.connective.com.au/en/articles/666-mercury-api-faqs).

### 2.2 Production only

The current FAQ states that there is no UAT or sandbox API environment. The integration page calls the production API a system containing live client data. This should be interpreted literally for operational controls: any successful POST, PUT, soft-delete, hook registration or extension replacement can affect the actual CRM.

Older pages and their examples contain `uatapis.connective.com.au`, `/mercury-v1`, “sandbox account”, and legacy `io.connective.com.au` references. Those examples conflict with the newer production page, FAQ, and current 2026 opportunity/related-party guides. The only base URL that should be used by default is:

```ts
const mercuryBaseUrl = "https://apis.connective.com.au/mercury/v1";
```

Treat the older URL forms as documentation residue unless Connective confirms a branch-specific exception in writing.

### 2.3 Authentication terminology

The FAQ calls the supported mechanism “basic authentication using security API tokens,” but the published operational instructions and Swagger specify a token in the path plus `x-api-key` in the header. There is no instruction to use HTTP `Authorization: Basic ...`. Implement the observed wire convention, not the ambiguous label:

```ts
export function mercuryRequestUrl(token: string, resourcePath: string): URL {
  return new URL(
    `https://apis.connective.com.au/mercury/v1/${encodeURIComponent(token)}${resourcePath}`,
  );
}

export async function mercuryFetch<T>(
  apiKey: string,
  token: string,
  resourcePath: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(mercuryRequestUrl(token, resourcePath), {
    ...init,
    headers: {
      "x-api-key": apiKey,
      "content-type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Mercury request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
```

Store secrets only in a server-side secret manager. Do not put them in a browser bundle, extension, source control, error tracker, full request logs, URL query parameter, or document. Redact the token path segment in HTTP telemetry. Connective specifically advises secure storage, no public sharing or unsecured repositories, credential rotation after suspected compromise, and privacy/data-protection compliance.

The credentials supplied during the earlier API audit were exposed in conversation and must be treated as compromised. Rotate them in Admin → Integrations before any new production request.

### 2.4 Formal documentation sources

The current FAQ directs Connective members to the authenticated [developer portal](https://developer.connective.com.au/) using Mercury credentials. The public Swagger page offers an attachment described as updated 3 September 2021. The correct precedence order is:

1. Current authenticated developer portal and direct Connective support confirmation.
2. Current dated Connective wiki articles, especially 2026 articles.
3. Verified live API behaviour in this branch, captured in the local OpenAPI and coverage evidence.
4. The 2021 Swagger attachment and undated/older article examples.
5. Third-party integration vendor articles, useful for setup confirmation but not a Mercury contract authority.

---

## 3. Interface-to-resource map and endpoint behaviour

All resource examples below are relative to `/{token}` after the current base URL.

### 3.1 Contacts / Person records

Mercury’s CRM Person record maps to `/contacts`. The API uses both “Person” language in user-facing documentation and “Contact” paths in the API. Standard operations are:

```text
GET  /contacts?search=true[&searchParams=...]    search Contacts
POST /contacts                                   create Contact
GET  /contacts/{contactId}                       fetch Contact
PUT  /contacts/{contactId}                       update or soft-delete Contact
```

Connective’s person payload example includes names, date of birth, formatted address, contact methods and a Notes example; its text clarifies that actual Notes are not public-API capable and that `notePadText` should be used for general notes. It says a company Contact is created with `"contactType": "company"`.

A safe minimal creation shape is therefore deliberately small and should be augmented only from the live contract:

```ts
const newContact = {
  firstName: "Example",
  lastName: "Applicant",
  dateOfBirth: "1985-04-05T00:00:00.000Z",
  notePadText: "Lead received from approved source.",
  addresses: [{
    streetNumber: "555",
    streetName: "Collins",
    streetType: "Street",
    city: "MELBOURNE",
    state: "VIC",
    postcode: "3000",
    country: "Australia",
    type: "Home",
    addressBlock: "555 Collins Street\nMELBOURNE VIC 3000",
  }],
  contactMethods: [
    { contactMethod: "Mobile", content: "0400111222" },
    { contactMethod: "Email 1", content: "person@example.com" },
  ],
};
```

The sample attachment uses a `notes` property, while current prose says public Notes are unavailable and recommends NotePad. That is a documentation conflict. Use `notePadText` only after validating it against the branch contract; do not rely on `notes` merely because it appears in a sample attachment.

Sources: [Person creation guide](https://wiki.connective.com.au/en/articles/24580-how-to-create-a-person-record-via-an-api-post-payload), [FAQ](https://wiki.connective.com.au/en/articles/666-mercury-api-faqs), [live audited TypeScript contract](avfs:///tasklet/agent/home/mercury-api/mercury-api.types.ts).

### 3.2 Contact children

The public parent–child layout documents contact methods, incomes, expenses, addresses and employment. The downloaded Swagger also contains identification routes. The general resource convention is:

```text
GET/POST /contacts/{contactId}/{childResource}
PUT      /contacts/{contactId}/{childResource}/{childId}
```

Known child resource names from the public schema/material include `contactMethods`, `incomes`, `expenses`, `addresses`, `employment`/`employments` as documented in different contexts, and `identification` in the older Swagger. The live audit found further nested payload variation. For that reason, use the OpenAPI contract’s actual path templates and wire types rather than deriving a path from UI labels.

Create a child with POST; update its own endpoint with PUT; soft-delete it with a PUT containing `isDeleted: true`. The newer nested-entity article explicitly confirms this ID behaviour for opportunity children, and the older general article establishes soft deletion as the API-wide deletion model. Write behaviour for every contact-child route was not live-tested during the earlier read-only audit, so treat request-body completeness as needing sandboxless, carefully controlled production validation or written Connective confirmation.

### 3.3 Opportunities / deals

An Opportunity is the application/deal parent. Standard operations are:

```text
GET  /opportunities?search=true[&searchParams=...]    search
POST /opportunities                                   create
GET  /opportunities/{opportunityId}                   fetch
PUT  /opportunities/{opportunityId}                   update or soft-delete
```

Connective’s current guide says an Opportunity can be created with or without nested entities and Mercury generates IDs when no `uniqueId` is supplied. The response returns a `uniqueId`, required for subsequent retrieval and update. The basic creation example only requires an opportunity name and amount in the published example; the sample payload guide describes opportunity name, type, loan amount, initial lead status, transaction type and NotePad as candidate fields. Exact mandatory fields are branch/workflow-dependent and must come from the live contract or current developer portal.

A nested create can include `assets`, `liabilities`, and `relatedParties`. On an Opportunity PUT, each supplied nested item has these documented semantics:

| Nested item shape | Connective-documented effect |
|---|---|
| Has `uniqueId` | update existing nested entity |
| Omits `uniqueId` | create new nested entity |
| Has `uniqueId` plus `isDeleted: true` | soft-delete that nested entity |

This is a useful optimisation, but the lower-risk pattern for a production integration remains dedicated child routes where available, because it isolates an update and makes retries/reconciliation simpler.

Source: [Managing Opportunities via the Mercury API, 18 February 2026](https://wiki.connective.com.au/en/articles/663-managing-opportunities-via-the-mercury-api).

### 3.4 Opportunity assets

```text
GET/POST /opportunities/{opportunityId}/assets
PUT      /opportunities/{opportunityId}/assets/{assetId}
```

Connective documents four Asset `type` values: `realEstate`, `account`, `standard`, and `vehicle`. Published `name` catalogues are:

| Type | Documented names |
|---|---|
| `realEstate` | `Real Estate` |
| `account` | `Cheque Account`, `Term Deposit`, `Investment Savings`, `Cash Management`, `Savings Account` |
| `standard` | `Charge Over Cash`, `Home Contents`, `Guarantee`, `Business Entity`, `Life Insurance`, `Managed Funds`, `Debenture Charge`, `Boat`, `Shares`, `Other`, `Gifts`, `Superannuation` |
| `vehicle` | `Motor Vehicle` |

The asset example shows fields beyond the simple create shape: `valueBasis`, account details, real-estate fields, motor-vehicle fields, an embedded address, and `valueObjectOwnershipList` containing person/relationship ownership information. Consider that example an observed guide, not a complete schema. Live contract definitions must remain permissive for undiscovered variants.

Source: [Managing assets](https://wiki.connective.com.au/en/articles/661-managing-assets).

### 3.5 Opportunity liabilities

```text
GET/POST /opportunities/{opportunityId}/liabilities
PUT      /opportunities/{opportunityId}/liabilities/{liabilityId}
```

Connective documents Liability types `account` and `standard`. Documented names:

| Type | Documented names |
|---|---|
| `account` | `Overdraft`, `Loan As Guarantor`, `Other`, `Line Of Credit`, `Term Loan`, `Mortgage Loan`, `Store Card`, `Credit Card`, `Personal Loan`, `Other Loan` |
| `standard` | `Lease`, `Hire Purchase`, `Outstanding Taxation`, `Commercial Bill`, `HECS`, `Maintenance` |

The guide gives `{ "value": 6000 }` as an update example and `{ "isDeleted": true }` for deletion. Do not assume the published names are globally exhaustive: the enum catalogue in this package differentiates values observed live from public-documentation values.

Source: [Managing liabilities](https://wiki.connective.com.au/en/articles/659-managing-liabilities).

### 3.6 Related parties (applicants and other person links)

```text
GET/POST /opportunities/{opportunityId}/relatedParties
PUT      /opportunities/{opportunityId}/relatedParties/{relatedPartyId}
```

A related party connects an existing Contact’s `uniqueId` to an Opportunity. The current docs use the exact wire property `personID`—upper-case `ID`—and `relationship`:

```ts
const relatedParty = {
  personID: existingContactUniqueId,
  relationship: "Primary Applicant",
};
```

Do not quietly normalise this to `personId` in outbound payloads. Public examples consistently use `personID`, while live responses have shown casing variability elsewhere. Preserve exact outbound field names from the operation-specific contract; tolerate documented aliases only in response parsing.

A Related Party itself has a `uniqueId` distinct from the Contact ID. That child ID is required to change its relationship or soft-delete the link. A related party soft-delete does not mean deleting the Contact.

Sources: [Managing related parties, 18 February 2026](https://wiki.connective.com.au/en/articles/658-managing-related-parties-via-the-mercury-api), [FAQ linking examples](https://wiki.connective.com.au/en/articles/666-mercury-api-faqs).

### 3.7 Lead source special case

Current opportunity guidance treats lead source as special. Send it inside nested `leadSource`; the documented selectors are `leadSourceId`, `leadSourceDisplay`, or both.

- Display only: if it exists, assign it; otherwise Connective says the API creates and assigns it.
- ID only: assign only if it exists; otherwise no assignment.
- Both matching: assign.
- Both conflicting: the published behaviour says an existing ID’s display name can be updated but not assigned; if ID does not exist and a display exists, it may create and assign.

This behavior has a data-governance consequence: do not pass arbitrary display strings from unvalidated sources, or your integration may create lead-source values. Resolve approved source IDs first and permit display-only creation only when business owners explicitly want it.

Source: [Managing Opportunities](https://wiki.connective.com.au/en/articles/663-managing-opportunities-via-the-mercury-api).

---

## 4. Search, pagination, sorting and incremental synchronisation

### 4.1 Search activation and query encoding

Search lives at the parent Contact and Opportunity endpoints. Pass `search=true` (or a bare `?search`; Connective documents them as equivalent). Complex criteria are sent in `searchParams` as a URL-encoded JSON object. Never hand-concatenate JSON into a URL; use `URLSearchParams`.

```ts
const params = new URLSearchParams({
  search: "true",
  count: "100",
  offset: "0",
  sortKey: "lastModifiedDate",
  sortOrder: "ASC",
  searchParams: JSON.stringify({
    email: "person@example.com",
  }),
});
```

The no-filter search returns the 25 most recently created records, descending by creation date. This default is unsuitable for full synchronisation because new/changed rows can move while pages are read.

Sources: [Searching Opportunities and Contacts](https://wiki.connective.com.au/en/articles/655-searching-opportunities-and-contacts), [email lookup guide](https://wiki.connective.com.au/en/articles/34986-search-for-a-person-record-by-email-using-the-mercury-api).

### 4.2 Pagination and sorting

The documented default `count` is 25, the maximum is 100, and `offset` defaults to 0. Search responses contain `totalCount`, `count`, `offset`, and `results`. Use `results.length`, not merely `count`, to decide whether a page made progress.

`sortKey` supports `creationDate` and `lastModifiedDate`; `sortOrder` supports `ASC` and `DESC`, defaulting to descending. For an incremental scan, request `lastModifiedDate` ascending, retain a watermark plus IDs processed at that watermark, and overlap the next search window. This guards against time-boundary collisions, API ordering ties and retries.

The documented date-search strings use `yyyy-mm-dd`; date range forms support `from/to`, `from..to`, and `from to`, with open-ended forms `/to` and `from/`. Exact timestamps are documented as AEST, e.g. `2017-04-01 05:00:00`. The older Contact guide’s `"1983-04-05to1983-04-30"` example lacks spaces, while the general search guide uses the word “to”; prefer slash or `..` to avoid ambiguity.

### 4.3 Contact search filters

The April 2026 Contact guide lists these search object keys:

```ts
export interface ConnectiveContactSearchParams {
  name?: string;
  isDeleted?: boolean;
  excludeDoNotMail?: boolean;
  excludeEmailBounced?: boolean;
  lastModified?: string;
  companyName?: string;
  personType?: string;
  categoryId?: string;
  campaignId?: string;
  contactNumber?: string;
  email?: string;
  dateOfBirth?: string;
  birthday?: string;
  createdOn?: string;
}
```

`name`, company, phone and email support partial or full matches according to the guide. The dedicated email guide expressly recommends email lookup before creating a Person record to reduce duplicates.

Sources: [Searching contacts, 9 April 2026](https://wiki.connective.com.au/en/articles/649-searching-contacts-via-the-mercury-api), [search by email, 17 February 2026](https://wiki.connective.com.au/en/articles/34986-search-for-a-person-record-by-email-using-the-mercury-api).

### 4.4 Opportunity search filters

The opportunity guide documents:

```ts
export interface ConnectiveOpportunitySearchParams {
  name?: string;
  isDeleted?: boolean;
  statuses?: string[];
  lastUpdated?: string;
  transactionType?: string;
  user?: string; // agent CA number
  createdOn?: string;
  confirmedSettlementDate?: string;
  interestOnlyExpiry?: string;
  fixedRateExpiry?: string;
}
```

The `statuses` filter is explicitly an array. Keep string values case-accurate and do not turn a status list into a hard-coded global enum merely from old examples. The published example lists `Appointed`, `Open`, `Unconditional` and `Lodged`; it does not claim those are the entire production status domain.

Source: [Search opportunities](https://wiki.connective.com.au/en/articles/652-search-opportunities).

---

## 5. Mutation rules, deletion and idempotency

### 5.1 HTTP method model

Connective publishes JSON over HTTPS using GET, POST and PUT. DELETE is not supported for CRM data; soft deletion is a PUT with `isDeleted: true`. The current FAQ specifies that soft-deleting a Person or Opportunity sends it to the Nexus recycle bin, where it can be restored.

The older Swagger does define HTTP DELETE routes for webhook registration resources. This is consistent with the webhook guide, which directs consumers to delete hooks and separately says a receiver can return 410 to cause automatic unregistration. Keep the distinction clear:

- **CRM record and child record:** PUT `{ "isDeleted": true }`.
- **Webhook subscription:** DELETE the hook endpoint or return 410 from the receiver.

### 5.2 Safe production write sequence

Because there is no sandbox, use this sequence for every mutation integration:

1. Validate source data before it reaches the Mercury client.
2. Search for existing Contacts using email and any other durable business identifier available.
3. Fetch the authoritative Contact/Opportunity and relevant children before update.
4. Create only if no match is found under the defined matching rule; surface ambiguous matches for human resolution.
5. Use the returned `uniqueId` as the permanent foreign key in the external system.
6. Send the smallest operation-specific payload that changes the intended record.
7. Re-fetch and compare the expected fields after a successful write.
8. Record a redacted audit event with correlation ID, entity ID, operation, response status and changed-field names—not full personal/financial payloads.
9. For failed timeouts, re-search/re-fetch before retrying a POST to avoid duplicate creates.

Mercury does not publish an idempotency-key mechanism in the sources reviewed. Therefore the client must own idempotency through external correlation data, lookup and reconciliation.

### 5.3 Unknown write semantics that require care

The live audit was read-only. It did not validate whether each PUT is partial-merge, full replace, or has per-field reset behavior; it also did not safely test restores, error responses, or all soft-deletes. Public examples suggest targeted PUT updates such as `{ "value": 6000 }`, but that is insufficient proof for all resources. Treat untested mutation semantics as an operational risk and validate them only with Connective-approved test records, a separately issued credential, and full before/after snapshots.

---

## 6. Financials extension resources: Living Expenses and Other Income

These extensions are materially different from ordinary children.

```text
GET/POST/PUT /opportunities/{opportunityId}/extension/livingExpense
GET/POST/PUT /opportunities/{opportunityId}/extension/otherIncome
```

An extension object includes its own `uniqueId`, `parentType` (`loan` in examples), `parentId` (Opportunity ID), a `key`, and `value`. Crucially, `value` is a **string whose contents are JSON**. Its decoded form is a complete list of line items. Each line item has a `uniqueId`, `amount`, `type`, `frequency`, and optional `splits`. A split uses `personId` and `percent`.

```ts
export interface FinancialLineSplit {
  personId?: string;
  percent: number;
}

export interface FinancialLine {
  uniqueId: string;
  amount: string;
  type: string;
  frequency: string;
  splits: FinancialLineSplit[];
}

export interface MercuryFinancialExtension {
  uniqueId: string;
  parentType: "loan" | string;
  parentId: string;
  key: "livingExpense" | "otherIncome" | string;
  value: string; // JSON.stringify(FinancialLine[])
}
```

The critical published rule: a PUT `value` replaces **all** existing entries. A correct update is therefore always read–parse–merge–serialize–PUT:

```ts
const extension = await mercuryFetch<MercuryFinancialExtension>(
  apiKey,
  token,
  `/opportunities/${opportunityId}/extension/livingExpense`,
);

const lines = JSON.parse(extension.value) as FinancialLine[];
const nextLines = lines.map((line) =>
  line.uniqueId === lineId ? { ...line, amount: "1200.00" } : line,
);

await mercuryFetch(apiKey, token,
  `/opportunities/${opportunityId}/extension/livingExpense`,
  {
    method: "PUT",
    body: JSON.stringify({ ...extension, value: JSON.stringify(nextLines) }),
  },
);
```

If GET returns an empty list but a populated extension envelope, use the returned extension `uniqueId` to update it. The guides say POST is only needed where no extension ID exists. For a new item, Connective directs clients to generate its unique ID. Prefer a cryptographically secure UUIDv4 generator in the application/runtime; do not call an external UUID web site from an automated production workflow.

If a line omits `splits`, Connective says ownership is allocated evenly across linked Contacts. That can change the financial meaning of a record. Integrations that care about attribution should always supply explicit splits that total 100 and reject invalid allocation before PUT.

Sources: [Living Expenses endpoint](https://wiki.connective.com.au/en/articles/641-nexus-financials-living-expenses-endpoint), [Other Income endpoint](https://wiki.connective.com.au/en/articles/644-nexus-financials-other-income-endpoint).

---

## 7. Webhooks and a reliable synchronisation architecture

### 7.1 Event coverage

Mercury supports webhook subscriptions for Contacts and Opportunities. Connective says hooks fire for UI and API changes to:

- Opportunities and their assets, liabilities and related parties.
- Contacts and their incomes, expenses, addresses and contact methods.
- CRM bulk assignment of Contacts to a category or relationship manager.

The guide says hooks do not fire for bulk Contact imports. It does not promise that every Mercury screen action, document change, product/lender change, or unsupported child field emits an event. Use a periodic incremental search in addition to hooks.

### 7.2 Registration and payload

Webhook endpoints are:

```text
POST /opportunities/hooks
POST /contacts/hooks
GET  /opportunities/hooks?search
DELETE /opportunities/hooks/{hookId}
DELETE /contacts/hooks/{hookId}
```

The documented configuration uses `active: "true"` as a string, a name limited to 45 characters, a `config` object, `content_type: "json"`, and an event value. A representative request is:

```ts
const contactHook = {
  active: "true",
  name: "my-system-contact-sync",
  config: {
    subscription_type: "All available contacts",
    url: "https://example.invalid/hooks/mercury/contacts",
    content_type: "json",
  },
  event: "Created or updated",
};
```

The current documentation says payloads include the complete Contact or Opportunity object including nested entities. This is useful, but a robust receiver should store the delivery, verify entity ID and re-fetch the resource before applying it locally if correctness matters, especially after schema evolution or overlapping updates.

Documented event values are `Created`, `Created or updated`, and `Deleted` for both entity types; `Opportunity Status Changed` is additionally documented for Opportunity hooks. The status event fires only when the status field itself changes, not for other edits.

### 7.3 Receiver design

The reviewed docs do not specify webhook signing, retry policy, delivery identifiers, source IPs, timeout, ordering guarantee or at-least-once semantics. Do not assume any of those properties. Implement a receiver that:

- accepts duplicate deliveries safely;
- validates the expected entity shape and IDs;
- queues work before responding quickly with 2xx;
- de-duplicates using a payload hash plus entity/version/retrieval data where possible;
- re-fetches the authoritative resource before local mutation;
- alerts when a payload cannot be parsed or fetched;
- never logs sensitive fields.

For removal, delete the hook explicitly. As an additional control, a receiver may respond with HTTP 410 and Mercury will unregister the hook. Do not create redundant hooks; Connective explicitly warns against it.

Source: [Managing Mercury API Webhooks](https://wiki.connective.com.au/en/articles/664-managing-mercury-api-webhooks).

---

## 8. Limits, dates, formatting and schema hazards

### 8.1 Rate-limit conflict

The May 2025 Getting Started guide says 20 requests/second and 144,000 requests/day. The March 2026 FAQ says 60 requests/second and 40,000 requests/day. The daily totals conflict substantially and neither source describes rolling windows, branch allocation or burst behavior.

Use the newer FAQ as the most current public statement—60 per second and 40,000 per day—but design conservatively until Connective confirms the quota for the branch. A safe starting policy is bounded concurrency, a client-side per-second limiter comfortably below 20 per second, a daily request budget below 40,000, exponential backoff for transient 5xx/429-equivalent errors, and no automatic replay of non-idempotent POST without a preflight lookup.

### 8.2 Dates

Public documentation says the API uses Unix date format; opportunity examples show epoch milliseconds. Search criteria, however, use human-readable `yyyy-mm-dd` and optional exact AEST timestamps. The live audit confirmed that actual payloads often use epoch milliseconds but that formats vary by resource. Model response dates defensively:

```ts
export type MercuryWireDate = number | string | null;

export function parseMercuryWireDate(value: MercuryWireDate): Date | undefined {
  if (typeof value === "number") return new Date(value); // expected epoch milliseconds
  if (typeof value === "string" && value.length > 0) return new Date(value);
  return undefined;
}
```

Do not convert an outbound field to epoch merely because a response sample did; use the operation schema and tested behavior for that individual field.

### 8.3 String booleans and inconsistent casing

The historical webhook request uses `"active": "true"` rather than a JSON boolean. The live audit saw boolean-looking strings in responses. Likewise, public examples use `personID`, while financial values use `personId`; live data contains multiple casing variants. Keep the wire contract permissive at boundaries, then normalise into an internal domain model only after parsing. Avoid a generic automatic casing converter—acronym casing can be semantically significant to a brittle legacy API.

### 8.4 Legacy Swagger limitations

The public Swagger article says the specification is Swagger 2.0, YAML, and last updated in 2021. It exposes useful route coverage, response status lists and webhook definitions, but it calls itself “Sandbox,” contains old examples, and is older than several current 2026 guides. It should be retained as a cross-reference only. The live-audited OpenAPI 3.1 package is the stronger technical starting point for this branch.

Source: [Mercury Connect API Swagger 2.0 Update](https://wiki.connective.com.au/en/articles/640-mercury-connect-api-swagger-2-0-update).

---

## 9. Recommended integration designs

### 9.1 One-way lead capture into Mercury

Use this for website forms, referral sources or external lead systems.

1. Normalise email and phone inputs but retain original values for user display.
2. Search Mercury Contacts by email. If no email, use a documented secondary rule and send ambiguous cases to a human queue.
3. If exactly one Contact matches, update only approved fields; otherwise POST a Contact.
4. Create an Opportunity with `relatedParties` using the Contact’s `uniqueId`, or POST the related party to an existing Opportunity.
5. Use `notePadText` for an integration provenance note where approved; do not try to create normal Notes.
6. Store returned Mercury IDs in the originating system.
7. Re-fetch both records and reconcile required fields.

Never let an arbitrary source create new lead-source values through display-only input without an approval workflow.

### 9.2 Bidirectional CRM synchronisation

Use Mercury as the CRM authority for the supported record domain, unless business owners decide otherwise per field.

- Register one carefully named Contact hook and one Opportunity hook for the necessary scope.
- Use event deliveries as prompts to queue entity reconciliation.
- Pull the canonical resource by `uniqueId` before local updates.
- Run a scheduled ascending `lastModifiedDate` search with overlap to catch bulk imports and webhook loss.
- Maintain an entity map of external ID ↔ Mercury `uniqueId`, a sync watermark, hash/version metadata and conflict records.
- Establish field ownership before writing. For example, an external marketing tool might own campaign attribution while Mercury users own relationship manager and financial data.
- Never overwrite full nested arrays from stale cache data; fetch child data first or use dedicated routes.

### 9.3 Financials synchronisation

Treat Living Expenses and Other Income as high-risk replace-all documents. Lock by Opportunity in the integration layer, GET the extension immediately before mutation, apply a single deterministic merge, validate owner percentages and generated line IDs, PUT the complete `value`, and re-fetch. If a human can edit Mercury simultaneously, detect divergence and surface a conflict rather than silently erasing rows.

### 9.4 Low-code / Zapier use

Connective documents Zapier as a Mercury connector for contacts, opportunities, lead capture and outbound alerts. It is suitable for simple automations where the connector supports the needed fields. The current guidance still recommends testing mappings with sample data, avoiding duplicate contacts and documenting the automation. It is not a substitute for a controlled API client where branch routing, extension replacement, idempotency, financial data, conflict handling or audit requirements are material.

Sources: [Getting started with Zapier and Mercury Nexus](https://wiki.connective.com.au/en/articles/639-getting-started-with-zapier-and-mercury-nexus), [Automate Mercury with Zapier](https://wiki.connective.com.au/en/articles/463-automate-mercury-with-zapier).

---

## 10. Documentation contradictions and implementation decisions

| Topic | Current / stronger source | Conflicting or weaker material | Decision |
|---|---|---|---|
| Base URL | 2026 integration guide and 2026 opportunity/related-party guides use `/mercury/v1` | Older pages show `/mercury-v1`, UAT and io host variants | Use `https://apis.connective.com.au/mercury/v1`. |
| Sandbox | March 2026 FAQ: none exists | 2021 Swagger labels itself Sandbox; old examples mention sandbox | Treat all calls as production. |
| Request rate / day quota | March 2026 FAQ: 60/sec, 40k/day | May 2025: 20/sec, 144k/day | Plan for ≤20/sec and ≤40k/day until support confirms branch quota. |
| Auth wording | Current docs show path token + `x-api-key` | FAQ calls it basic authentication | Use path token plus `x-api-key`; do not introduce HTTP Basic without support confirmation. |
| Related-party Contact field | 2026 docs show `personID` | Text sometimes says `personId`; financials use `personId` | Send `personID` in related-party resource; tolerate casing aliases inbound. |
| Notes | FAQ/person guide say Notes unsupported and recommend NotePad | Person attachment contains `notes` | Treat `notes` as non-authoritative; use `notePadText` where verified. |
| API schema source | Current portal + live audit | Public Swagger dated 2021 | Use package OpenAPI 3.1/live evidence; Swagger only as historical reference. |
| Extension URLs | Titles and text identify `otherIncome` | Some hyperlinks in Other Income guide incorrectly point to livingExpense | Use endpoint names in guide text: `/extension/otherIncome` and `/extension/livingExpense`. |

---

## 11. Delivery checklist

Before a production integration is released:

- [ ] Rotate the previously exposed API key/token and remove them from all logs and history under your control.
- [ ] Confirm Partner Level access and select the intended branch token.
- [ ] Obtain current authenticated developer-portal documentation and compare it with the local live-audited contract.
- [ ] Define field-level ownership and duplicate-contact rules with business owners.
- [ ] Implement secret storage, redacted logs, bounded retries and a request budget.
- [ ] Use `search=true`, URL-encoded `searchParams`, count ≤100 and safe ascending delta scans.
- [ ] Make POST retry-safe through an external correlation ID plus lookup/reconciliation.
- [ ] Implement soft-delete; do not use DELETE on Mercury CRM data.
- [ ] Treat Financials extensions as replace-all JSON-string documents.
- [ ] Register only necessary webhooks; queue, de-duplicate and reconcile deliveries; add periodic scans for bulk-import gaps.
- [ ] Test updates on Connective-approved non-critical records, because there is no sandbox.
- [ ] Validate outbound payloads against `mercury-api.openapi.yaml` and parse responses with `mercury-api.types.ts` defensively.

---

## Sources followed

All sources below were retrieved during this research. Primary Connective sources are listed first.

1. [API integration with Mercury Nexus — 19 Feb 2026](https://wiki.connective.com.au/en/articles/637-api-integration-with-mercury-nexus)
2. [Mercury API FAQs — 2 Mar 2026](https://wiki.connective.com.au/en/articles/666-mercury-api-faqs)
3. [Getting Started with Mercury API — 1 May 2025](https://wiki.connective.com.au/en/articles/633-getting-started-with-mercury-api)
4. [Managing Opportunities via the Mercury API — 18 Feb 2026](https://wiki.connective.com.au/en/articles/663-managing-opportunities-via-the-mercury-api)
5. [Managing related parties via the Mercury API — 18 Feb 2026](https://wiki.connective.com.au/en/articles/658-managing-related-parties-via-the-mercury-api)
6. [Searching contacts via the Mercury API — 9 Apr 2026](https://wiki.connective.com.au/en/articles/649-searching-contacts-via-the-mercury-api)
7. [Search for a Person record by email — 17 Feb 2026](https://wiki.connective.com.au/en/articles/34986-search-for-a-person-record-by-email-using-the-mercury-api)
8. [Searching Opportunities and Contacts — 27 Feb 2025](https://wiki.connective.com.au/en/articles/655-searching-opportunities-and-contacts)
9. [Search opportunities](https://wiki.connective.com.au/en/articles/652-search-opportunities)
10. [Managing assets](https://wiki.connective.com.au/en/articles/661-managing-assets)
11. [Managing liabilities](https://wiki.connective.com.au/en/articles/659-managing-liabilities)
12. [Nexus Financials Living Expenses Endpoint](https://wiki.connective.com.au/en/articles/641-nexus-financials-living-expenses-endpoint)
13. [Nexus Financials Other Income Endpoint](https://wiki.connective.com.au/en/articles/644-nexus-financials-other-income-endpoint)
14. [Managing Mercury API Webhooks](https://wiki.connective.com.au/en/articles/664-managing-mercury-api-webhooks)
15. [How to create a Person record via an API POST payload](https://wiki.connective.com.au/en/articles/24580-how-to-create-a-person-record-via-an-api-post-payload)
16. [How to create an Opportunity record via an API POST payload](https://wiki.connective.com.au/en/articles/25091-how-to-create-an-opportunity-record-via-an-api-post-payload)
17. [Mercury Connect API Swagger 2.0 Update](https://wiki.connective.com.au/en/articles/640-mercury-connect-api-swagger-2-0-update)
18. [Getting started with Zapier and Mercury Nexus](https://wiki.connective.com.au/en/articles/639-getting-started-with-zapier-and-mercury-nexus)
19. [Automate Mercury with Zapier](https://wiki.connective.com.au/en/articles/463-automate-mercury-with-zapier)
20. [Mercury Nexus platform overview](https://www.connective.com.au/mercury-nexus)
21. [Authenticated Connective developer portal](https://developer.connective.com.au/)

### Local companion artefacts

- [Live-audited OpenAPI 3.1 contract](avfs:///tasklet/agent/home/mercury-api/mercury-api.openapi.yaml)
- [Live-audited TypeScript wire types](avfs:///tasklet/agent/home/mercury-api/mercury-api.types.ts)
- [Observed enum and string catalogue](avfs:///tasklet/agent/home/mercury-api/mercury-api.enum-catalog.json)
- [Audit coverage and remaining unknowns](avfs:///tasklet/agent/home/mercury-api/coverage.md)

---

## Deep-search addendum — complete Connective Wiki collection review (21 July 2026)

### Scope and confidence

This second pass did not rely on ordinary web search alone. It enumerated and reviewed the public **Mercury Nexus** collection at Connective Wiki: **288 articles** were discovered; **175** that mentioned API, integrations, data exchange, CRM data management, webhooks, Open Banking, Client Portal, ApplyOnline, documents, imports/exports, access controls, or change history were retained as a research corpus. This is materially broader than the initial linked-article chain.

**Conclusion:** no additional public, documented Mercury REST resource family was found beyond the Contact/Person and Opportunity model, their documented children, extensions, search, and webhooks already represented in this package. That is a bounded conclusion about *publicly accessible Connective documentation*, not a claim that Connective has no private/internal endpoints.

### New confirmed findings that affect an implementation

| Finding | Evidence and interpretation | Delivery impact |
|---|---|---|
| **Member-only developer documentation exists** | The current [Mercury API FAQ](https://wiki.connective.com.au/en/articles/666-mercury-api-faqs), dated 3 March 2026, directs members to `developer.connective.com.au`, accessed with Mercury credentials. The public page is not an unauthenticated source of contract detail. | Request read-only developer-portal access or an export of its current API definition before treating the supplied Swagger file as complete. Do not reuse the previously exposed credentials. |
| **No sandbox is still the current stated position** | The same March 2026 FAQ explicitly says that no UAT or sandbox API environment is available. | Preserve the package’s production-write prohibition. Validate writes only through an explicitly authorised disposable test record and change-controlled process. |
| **Per-branch token scope is documented** | The current FAQ says the API key is shared across a group while each virtual branch has its own API token; the user must be in that branch and have Partner Level access to view it. | Model credential selection as `{groupApiKey, branchToken}`. Never assume a group-level token sees every virtual branch. |
| **IP allowlisting may be a deployment gate—but only for EFFI** | The [IP allowlisting article](https://wiki.connective.com.au/en/articles/71332-ip-whitelisting-for-mercury-nexus-integration), dated 26 May 2026, specifically says an **EFFI** system connection requires approved outbound IPs, a one-off $300 fee, and typically 2–3 business days after payment. | Ask Connective whether the proposed integration is classified as EFFI and therefore needs allowlisting. Do **not** generalise this article into a universal Mercury public-API requirement without written confirmation. Use stable egress IPs regardless. |
| **Bulk import does not trigger webhooks** | The recently updated [webhook guide](https://wiki.connective.com.au/en/articles/664-managing-mercury-api-webhooks) expressly excludes updates made by bulk contact import, while covering UI/API edits and certain bulk contact assignments. | Keep scheduled reconciliation: a webhook-only sync will miss imported contacts. |
| **Webhook delivery is a full aggregate payload** | The webhook guide states that the complete Opportunity or Contact, including nested entities, is posted as JSON. It also says a `410 Gone` response causes Mercury to unregister the hook. | Treat deliveries as a snapshot hint, deduplicate and re-fetch the canonical record where practical, and make `410` an intentional decommission action only. |
| **Search defaults are documented** | [Searching Opportunities and Contacts](https://wiki.connective.com.au/en/articles/655-searching-opportunities-and-contacts) says a parent search with no filters returns 25 newest records in descending creation-date order. | Never use the unfiltered result as a complete sync. Page using the observed response metadata and use date overlap/reconciliation. |
| **Human lifecycle confirms soft deletion/recovery** | The [delete/restore guide](https://wiki.connective.com.au/en/articles/561-how-to-delete-and-restore-person-opportunity-note-and-task-records) says Person and Opportunity records go to the Recycle Bin and cannot be permanently deleted through the UI for compliance reasons. | This independently supports the API `isDeleted: true` soft-delete pattern. It does not prove that every child resource is restorable or that an API restore endpoint exists. |
| **Raw export is a viable completeness backstop** | [Export raw data](https://wiki.connective.com.au/en/articles/501-export-raw-data-from-mercury-nexus) describes Partner-level Admin → Data → Extract raw data, which generates an Excel export of CRM data. | Use this for migration/reconciliation and to identify API coverage gaps; it is not documented as an API endpoint and should not be automated as one. |
| **Bulk import is operationally distinct from API ingest** | [Importing client data](https://wiki.connective.com.au/en/articles/460-importing-your-client-data-in-bulk-to-the-mercury-nexus-crm) documents an Admin UI XLS import, a 5,000-contact-per-file cap, separate company-record import, and post-import email validation. | Do not equate the importer schema with API write support. Use its category tagging/rollback capability for controlled historical migrations, not a substitute for transactional API semantics. |
| **Open Banking/Financial Passport is a Mercury UI workflow, not a public API documented here** | Current 2026 Open Banking guides describe Frollo consent, a 14-day invitation window, PDF/Excel artefacts in the Opportunity, and a UI action that copies liabilities and living expenses into Financials; employment/income copying is described as “coming soon.” | Do not write an integration that assumes public endpoints for Frollo invitations, consent status, passports, files, or “copy results to financials.” Treat these fields as potentially user-managed and avoid overwriting them. |
| **Client Portal, Client Centre, DigiSign, documents, ApplyOnline, product database, reports, and email are UI-connected capabilities—not proven REST resources** | The collection contains extensive operational articles for these capabilities. The API FAQ explicitly excludes the Connective Products database and says API document upload through the opportunity inbox is currently unavailable; it says notes cannot be added through an API, although `notePadText` can be included when creating a Person/Opportunity. | Keep these capability areas out of the authoritative OpenAPI paths unless portal documentation or live evidence provides a supported endpoint. Their existence in Nexus must not be mistaken for API coverage. |

### Important API-documentation corrections and contradictions found

1. **A current contact-search page still presents a UAT URL.** The article [Searching contacts via the Mercury API](https://wiki.connective.com.au/en/articles/649-searching-contacts-via-the-mercury-api), dated 10 April 2026, shows `https://uatapis.connective.com.au/mercury-v1/...`. This conflicts with the newer no-UAT FAQ and with the current production base URL stated in the February 2026 integration article. It is therefore **legacy/example-only**, not an implementation target.

2. **URL spelling is historically inconsistent.** Current guidance favours `https://apis.connective.com.au/mercury/v1/{token}/...`; some examples use `mercury-v1`. The live audit and current production guidance remain authoritative. The OpenAPI contract correctly uses the slash-separated production convention; retain a compatibility note but do not retry alternate paths automatically without Connective approval.

3. **The public Swagger attachment is dated 3 September 2021.** The 2023 Swagger article links to it but does not establish that it reflects the 2026 service. Use it only as historical endpoint discovery. The live-audited OpenAPI 3.1 contract remains the working contract, with gaps clearly labelled.

4. **Rate limits conflict across Connective articles.** The 2025 Getting Started page says 20 requests/sec and 144,000/day; the 2026 FAQ says 60 requests/sec and 40,000/day. Neither should be hard-coded as a guaranteed allowance. The client should throttle conservatively, honour `429`/server feedback, and obtain a written limit for a production workload.

5. **Authentication wording is imprecise.** The FAQ calls the scheme “basic authentication using security API tokens,” while setup documentation and live evidence use the token in the path plus `x-api-key`. Follow the concrete wire convention, not the generic label “basic authentication.”

6. **Webhook samples require careful interpretation.** The current webhook article represents `active` as the string `"true"` and appends `?search=true` to the opportunity-hook registration URL. These are documentation examples, not independently write-tested guarantees. The OpenAPI request model must continue to allow the observed string-boolean wire variation and label webhook mutation behaviour as unverified until a sanctioned write test is completed.

### Interface features with meaningful data-governance implications

The deeper collection review confirms that Mercury’s interface holds more sensitive workflow data than the public API presently documents: Open Banking data/Financial Passport artefacts, Client Portal questionnaires and requested documents, DigiSign-enabled files, credit checks, compliance workflows, ApplyOnline submissions, emails/SMS, notes/tasks, audit/change history, and document redaction functions. The presence of these interface capabilities does **not** grant an integration access to them.

For integration design, that means:

- make Mercury the source of truth for user-operated compliance/document/portal workflows unless Connective provides a specific supported endpoint;
- use field-level ownership so API updates cannot erase broker-entered financials, attachments, portal progress, or compliance work;
- redact secrets and sensitive payload fields from observability data (including `webPassword`, which the live audit observed and deliberately excludes from examples);
- use the Admin raw-data export and UI Change Log as operational reconciliation/audit aids, not as undocumented API interfaces;
- verify virtual-branch scope, permissions, record visibility, and any allowlisting requirement during onboarding.

### Remaining evidence gaps after the deeper search

These are the highest-value items that cannot be responsibly inferred from public material:

1. the current authenticated developer-portal/OpenAPI definition and its revision date;
2. a supported, complete schema and allowable values for every child resource, especially Contacts’ nested records and Financial extensions;
3. create/update/soft-delete response bodies, merge/replace semantics, validation errors, and restoration behaviour under a sanctioned non-production-like test process;
4. webhook authentication/signature, retry/back-off, timeout, ordering, duplicate-delivery, and failure semantics;
5. whether IP allowlisting applies to this particular non-EFFI integration;
6. an official rate-limit allocation for this branch/token;
7. supported API surface for files, notes, tasks, portal requests, ApplyOnline, Open Banking, and audit history—if any.

### Recommended next evidence request to Connective

Ask the Partnership Manager/Helpdesk for: (a) the current authenticated API specification or a read-only developer-portal export; (b) written confirmation of base URL, branch credential scope, quota, and IP allowlisting applicability; (c) webhook delivery/security/retry contract; and (d) approval and a safe test-record procedure for mutation verification. This is the shortest path from an excellent observed contract to a truly supportable production contract—no spelunking goggles required.

### Additional primary sources followed in this pass

- [Mercury API FAQs](https://wiki.connective.com.au/en/articles/666-mercury-api-faqs)
- [IP Whitelisting for Mercury Nexus Integration](https://wiki.connective.com.au/en/articles/71332-ip-whitelisting-for-mercury-nexus-integration)
- [Searching Opportunities and Contacts](https://wiki.connective.com.au/en/articles/655-searching-opportunities-and-contacts)
- [Searching contacts via the Mercury API](https://wiki.connective.com.au/en/articles/649-searching-contacts-via-the-mercury-api)
- [Export raw data from Mercury Nexus](https://wiki.connective.com.au/en/articles/501-export-raw-data-from-mercury-nexus)
- [Importing client data in bulk to the Mercury Nexus CRM](https://wiki.connective.com.au/en/articles/460-importing-your-client-data-in-bulk-to-the-mercury-nexus-crm)
- [How to Delete and Restore Person, Opportunity, Note and Task Records](https://wiki.connective.com.au/en/articles/561-how-to-delete-and-restore-person-opportunity-note-and-task-records)
- [What is Open Banking?](https://wiki.connective.com.au/en/articles/1510-what-is-open-banking)
- [How to use Open Banking](https://wiki.connective.com.au/en/articles/1511-how-to-use-open-banking)
- [Managing Client Details and Financials in a Client Portal request](https://wiki.connective.com.au/en/articles/67715-managing-client-details-and-financials-in-a-client-portal-request)

---

## UI-to-public-API linkage matrix (MCP implementation addendum)

A dedicated UI-to-public-API linkage matrix is now maintained alongside this report:

- `mercury-ui-to-public-api-mapping.md` — human-readable mapping of Mercury UI areas, identifiers, resources, endpoint families, confirmed gaps and MCP guardrails.
- `mercury-ui-to-public-api-mapping.json` — machine-readable capability registry for MCP tool planning.

The central finding is intentional: the public API is a CRM-record API, not an API for every visible Mercury Nexus application. People/Contacts, Opportunities, related parties, contact child records, assets, liabilities, and the `livingExpense`/`otherIncome` financial extensions are established public-API surfaces. Client Portal request management, DigiSign, documents and attachments, tasks, notes (other than the narrow creation-time `notePadText` use), ApplyOnline, Open Banking, product comparison, reporting, user/permission administration and workflow history do **not** have public API proof and should not be exposed as MCP tools.

The matrix defines `uniqueId` as the record linking key, identifies `relatedParties.personID`/`personId` as the Opportunity-to-People join, separates UI labels from wire names (such as UI “Broker” versus API `agent`), and specifies safe extension replacement semantics. It also makes all non-read MCP tools confirmation-gated until controlled production-write behaviour has been verified.
