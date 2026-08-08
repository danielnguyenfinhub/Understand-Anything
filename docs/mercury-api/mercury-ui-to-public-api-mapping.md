# Mercury Nexus UI → Public API capability map

**Purpose.** This is an implementation map for MCP tools. It answers a narrow question: when a broker can see or operate something in Mercury Nexus, what *public API* resource, field, or workflow is confirmed to correspond to it? It also deliberately identifies UI functions for which no public API support has been evidenced.

**Evidence model.** **Confirmed API** means a current Connective API article or the read-only production audit identifies the endpoint/field. **UI-only / no public proof** means the public documentation and the supplied Swagger/OpenAPI contract do not establish an API route; it does not mean Connective has no private internal service. Do not turn UI labels into API endpoints by inference. **Partial** means only an aggregate, a different data representation, or a read path is documented.

**Terminology.** A UI *People* record is the API `Contact`. A UI *Opportunity* is the API `Opportunity`. The primary IDs shown in returned data are `uniqueId`; those IDs are the link keys for detail and child routes. Public documentation uses both `personID` and `personId`; production has returned both casing variants. Preserve and normalise at the client boundary.

## The safe identifier model

| UI object / visible identifier | Confirmed API equivalent | Link rule for MCP tools | Confidence |
|---|---|---|---|
| People record | `Contact.uniqueId` | `GET /{token}/contacts/{contactId}`. Use returned `uniqueId` as `contactId`. | Confirmed API + production read |
| Opportunity | `Opportunity.uniqueId` | `GET /{token}/opportunities/{opportunityId}`. Use returned `uniqueId`. | Confirmed API + production read |
| Opportunity contact card | `RelatedParty.uniqueId`, `personID`/`personId`, `relationship` | The card is the join: `GET /opportunities/{opportunityId}/relatedParties`; its person ID links to the People record. | Confirmed API |
| Asset / liability line | child `uniqueId` | Use `/opportunities/{opportunityId}/assets/{assetId}` or `/liabilities/{liabilityId}`. | Confirmed API |
| Contact child line (address, income, expense, employment, contact method) | child `uniqueId` plus parent person ID | Use the matching `/contacts/{contactId}/…/{childId}` route. | Confirmed API |
| UI Lead Source dropdown | `Opportunity.leadSourceId` and/or `leadSourceDisplay` | Write it inside `leadSource`; see the special rule below. No public catalogue/list endpoint is documented. | Confirmed write shape; catalogue gap |
| UI Person Category | `Contact.categories[]` | The category ID is required; no public category discovery route is established. Treat IDs as externally configured values. | Confirmed write shape; discovery gap |
| UI status label | `Opportunity.status` | Read/write the exact branch status string. It is a branch configuration/data value, not a platform-wide enum. | Production read + current docs |
| UI broker/agent | `Opportunity.agent` (CA number), plus `agentName` on reads | Current UI now labels this “Broker”, while old payloads use `agent`. Do not rename the wire field. | Confirmed |
| UI owner / responsible person | `personActing`, `personResponsible` (CA numbers) | Public field exists, but lookup/catalogue endpoints are not evidenced. | Confirmed field; discovery gap |
| Mercury inbox email shown on a record | `emailAccountAddress` (and some opportunity samples show `emailId`) | It is an email-routing value, not a Notes API. Handle as sensitive operational data. | Confirmed documentation/live field |

## UI feature map

### CRM — People

| Mercury UI area / action | Confirmed public API mapping | Recommended MCP tool | Boundary / caveat |
|---|---|---|---|
| People list, find a person | `GET /contacts?search=true&searchParams={…}`; filters documented: `name`, `email`, `contactNumber`, `companyName`, `dateOfBirth`, `birthday`, `createdOn`, `lastModified`, `isDeleted`, `categoryId`, `campaignId`, `personType`, mail/bounce exclusions. | `search_contacts` | Search is not a full mirror of the UI’s dynamic filter system. URL-encode `searchParams`; production reads require `search=true`. |
| Open a People record | `GET /contacts/{contactId}` | `get_contact` | Redact `webPassword` unconditionally; it was observed in production GET payloads. |
| Create/edit basic Details | `POST /contacts`; `PUT /contacts/{contactId}`. Fields include names, DOB, contact type, marketing flags, direct email/phones and live-only profile fields in the audited contract. | `create_contact`, `update_contact` | Required fields and write semantics still need controlled write validation. For company records, current FAQ says `contactType: "company"`. |
| Contact methods | `GET/POST /contacts/{contactId}/contactMethods`; `PUT /contacts/{contactId}/contactMethods/{contactMethodId}` | `list_contact_methods`, `upsert_contact_method` | Use child `uniqueId`. UI labels such as Mobile, Home and Email map to `contactMethod`/`type`; do not assume every UI display slot maps 1:1 to `homePhone`, `mobile`, etc. |
| Address history | `GET/POST /contacts/{contactId}/addresses`; `PUT /contacts/{contactId}/addresses/{addressId}` | `list_addresses`, `upsert_address` | A People address can be surfaced in the contact card as Home Address. Keep raw casing and date formats defensive. |
| Identification | `GET/POST /contacts/{contactId}/identifications`; `PUT /contacts/{contactId}/identifications/{identificationId}` | `list_identifications`, `upsert_identification` | API documentation/schema casing conflicts: current live reads use `identifications`, old schema uses `Identification`. Never expose identity-document data in low-trust tools. |
| Employment history | `GET/POST /contacts/{contactId}/employments`; `PUT /contacts/{contactId}/employments/{employmentId}` | `list_employments`, `upsert_employment` | UI says current/previous employment feeds linked Opportunity Financials. API models employment as a Contact child. Current ApplyOnline guidance requires a continuous three-year timeline, but that is workflow validation—not an API guarantee. |
| Personal income / expenses | `GET/POST /contacts/{contactId}/incomes` and `/expenses`; item PUT routes | `list_contact_incomes`, `upsert_contact_income`, `list_contact_expenses`, `upsert_contact_expense` | These are People-level records, distinct from Opportunity Financial extensions for Other Income and Living Expenses. |
| Relationships between People | UI supports People relationships; public API evidence supports *Opportunity* `relatedParties`, not a standalone People-to-People relationship endpoint. | No write tool; `get_contact` only | **UI-only / no public proof** for managing People-record relationships. Do not substitute Opportunity related parties. |
| Person categories / marketing preference | Contact has `categories[]`; FAQ says category IDs can be written in `categories`. `doNotMail`, `emailBounced`, `syncToDMH` were observed/read fields. | `update_contact_categories` only when caller supplies approved IDs | No documented API route to list/create categories; category assignment bulk UI actions emit webhooks, while bulk import does not. |
| Notes, tasks, attachments, Notepad, change log | `notePadText` is documented for record creation; public FAQ says Notes cannot be added through API. | `create_contact` may accept `notePadText`; no general notes/task/document/change-log tools | **Partial / UI-only.** Do not promise UI Notes, Tasks, Attachments or Change Log APIs. Emailing the record’s inbox address is documented as a workaround for Notes, but is not a public API write. |
| Move a Person between virtual branches / privacy | UI workflow exists; API key is group-wide and token is branch-specific. | No mutation tool | **UI-only / no public proof.** A token scopes data visibility; do not use it as a bypass of UI permissions. |
| Delete/restore Person | Current API documents soft deletion with `PUT { isDeleted: true }`; UI recycle bin supports restore. | `soft_delete_contact` only after explicit confirmation | Public API restore behaviour has not been safely tested. No `DELETE` verb. |

### CRM — Opportunities

| Mercury UI area / action | Confirmed public API mapping | Recommended MCP tool | Boundary / caveat |
|---|---|---|---|
| Opportunity list and UI search/filter | `GET /opportunities?search=true&searchParams={…}`. Documented filters: name, `statuses`, `lastUpdated`, `transactionType`, `user`, `createdOn`, settlement, IO/fixed expiry, `isDeleted`. | `search_opportunities` | UI supports additional cross-record filtering (e.g., people by linked opportunity); no proof every UI filter is supported by public `searchParams`. |
| Open / quick-view Opportunity | `GET /opportunities/{opportunityId}` | `get_opportunity` | The API aggregate contains opportunity core data plus assets, liabilities and related parties; normalize epoch/string dates. |
| Create/edit Opportunity details | `POST /opportunities`; `PUT /opportunities/{opportunityId}` | `create_opportunity`, `update_opportunity` | Confirmed fields include name, amount, lender, status, transaction type, loan term, dates, CA-number roles, lead source, etc. Field writability/requiredness is not fully write-verified. |
| Contacts sub-menu / contact cards | `GET/POST /opportunities/{opportunityId}/relatedParties`; item `PUT`; or nested `relatedParties` in Opportunity POST/PUT. | `list_opportunity_parties`, `link_contact_to_opportunity`, `set_party_relationship` | `personID`/`personId` is the Contact `uniqueId`. Contact card fields are retrieved from the Contact record; relationship determines applicant/guarantor/other grouping. |
| Change card relationship / remove contact | `PUT /relatedParties/{relatedPartyId}` with `relationship`, or `{ isDeleted: true }`. | `set_party_relationship`, `soft_delete_related_party` | Soft delete is currently documented, but perform writes only with user confirmation until a safe write contract is proven. |
| Financials — assets | `/opportunities/{opportunityId}/assets` and child item route; also nested `assets` on Opportunity write. | `list_assets`, `upsert_asset`, `soft_delete_asset` | `name`, `type`, `value`, ownership and detailed sub-fields are documented/audited. Asset ownership nested shape needs more census evidence before broad arbitrary writes. |
| Financials — liabilities | `/opportunities/{opportunityId}/liabilities` and child item route; also nested `liabilities`. | `list_liabilities`, `upsert_liability`, `soft_delete_liability` | UI “Debts” maps most directly to liabilities. Use documented lower-case type values. |
| Financials — Living Expenses | `GET/POST/PUT /opportunities/{opportunityId}/extension/livingExpense` | `get_living_expenses`, `replace_living_expenses` | This is an extension aggregate. Its `value` is a JSON **string** and PUT replaces the whole list. Read → parse → merge → stringify → replace. |
| Financials — Support payments / Other Income | `GET/POST/PUT /opportunities/{opportunityId}/extension/otherIncome` | `get_other_income`, `replace_other_income` | Same aggregate/replacement rule. The UI wording is broader than the documented API key `otherIncome`. |
| Financials — properties/mortgages | Assets and liabilities provide partial data representation; no distinct documented “property/mortgage” API family. | `list_assets`, `list_liabilities` | **Partial.** Do not advertise a separate property/watchlist or mortgage endpoint. |
| Lead Source UI field | Nested `leadSource: { leadSourceId?, leadSourceDisplay? }` on Opportunity write. | `set_opportunity_lead_source` | If display-only does not exist, current API article says it may create one. Avoid accidental taxonomy creation: require an existing approved ID by default. |
| Status, history, timeline, Kanban | `Opportunity.status`, `statusLastUpdated` and status-change webhook event. | `update_opportunity_status`, `subscribe_opportunity_status_changes` | UI History/Timeline is not established as readable through the public API. Status names vary by branch; use `search_opportunities`/observed values rather than a global enum. |
| Notes, outgoing email/SMS, tasks, notepad | Creation supports `notePadText`; record reads expose inbox email address. | `create_opportunity` with notePadText only | **Partial / UI-only.** No public API evidence for Notes, Task, email, SMS, or general Notepad updates. |
| Attachments / documents | FAQ describes emailing an Opportunity Mercury inbox email as an upload route but marks it “CURRENTLY UNAVAILABLE”. | No attachment tool | **No supported API tool.** Client Portal and ApplyOnline document UI flows must not be represented as public REST capabilities. |
| Product comparison / selected products / lender database | None | No tool | The API FAQ explicitly says Connective product database is unavailable. |
| Calculations, compliance, BID/NCCP, lodgements, ApplyOnline/Loanapp | None | No tool | UI functionality only. API fields such as `isNCCPEnabled` or application IDs are not proof of workflow endpoints. |
| Share With another broker / virtual branch, workspace | Read fields (`partnerSharedWith…`, `workspaceUsers`) exist; no documented public sharing mutation. | `get_opportunity` only | **Read representation is not a write contract.** |
| Delete/restore Opportunity | `PUT /opportunities/{id}` `{ isDeleted: true }`; nested children can be soft-deleted similarly. | `soft_delete_opportunity` only after explicit confirmation | UI restore exists; public API restore not confirmed. |

### Client Portal, Client Centre and surrounding UI

| Visible UI function | Public API linkage | MCP decision |
|---|---|---|
| Client Portal request, request name, contacts, expiry, reminder, status, completion percentage | Linked to an Opportunity in the UI, but no public Client Portal request resource/route is documented. | **No tool.** Keep request workflow out of the public-API MCP surface. |
| Client Portal “Client Details and Financials” | The completed data may appear in Contact children / Opportunity assets, liabilities and two extensions, but no public event or mapping proves timing, field mapping, or request status access. | **Indirect only.** Read the confirmed CRM resources after reconciliation; never claim request management. |
| Client Portal documents, DigiSign, questionnaires, document requests | No public API proof. | **No tool.** These are sensitive workflows with immutable-after-send UI rules. |
| Legacy Client Centre / Doc Centre | No public API proof. | **No tool.** |
| Open Banking / Financial Passport | No public public-API family found. | **No tool.** |
| Property Watchlist / PropTrack | No public public-API family found. | **No tool.** |
| Transcript import, AI-created notes/tasks/email | No public API proof. | **No tool.** |
| Documents / document categories / templates | No public upload/list/document APIs found. | **No tool.** |
| Reports, Analytics, application/settlement dashboards | UI/export functions; no public reporting API evidenced. | **No tool.** Use raw data export for governed reconciliation, not as an API substitute. |

## Crosswalk: visible UI labels to wire fields

These mappings are supported by UI/API documentation or observed production fields. They are useful for tool descriptions and display adapters—not for assuming write permissions.

| UI label | API field / resource | Notes |
|---|---|---|
| Person / People | `Contact` | Entity naming mismatch only. |
| Opportunity name | `opportunityName` | Primary human-facing label. |
| Loan amount | `amount` | API samples accept numeric-looking values; use number internally and preserve observed response type. |
| Opportunity type | `transactionType` | Values observed in the contract are category-like, e.g. Loan / PersonalLoans. |
| Transaction type | `tranxType` | Separate field; e.g. Purchase/Refinance. Do not collapse with `transactionType`. |
| Status | `status` | Exact branch string. |
| Broker (older UI: Agent/Advisor/Loan Writer/Associate) | `agent` | CA number; UI label change does not alter the API field. |
| Contact / applicant card | `relatedParties[]` | `personID` links to Contact; `relationship` sets role. |
| Personal details | `Contact` scalar fields | Includes names, DOB, demographic/residency and company fields as available. |
| Contact details | `Contact` direct fields and `contactMethods[]` | Prefer child contact-method records for multi-value contact data. |
| Address history | `addresses[]` / address routes | Contact child resource. |
| Employment history | `employments[]` / employment routes | Contact child resource. |
| Assets | `assets[]` / asset routes | Opportunity child resource. |
| Debts | `liabilities[]` / liability routes | Opportunity child resource. |
| Other income / support payments | extension key `otherIncome` | JSON encoded in `Extension.value`. |
| Living expenses | extension key `livingExpense` | JSON encoded in `Extension.value`. |
| Lead Source | nested `leadSource` → `leadSourceId`, `leadSourceDisplay` | Do not assume catalogue discoverability. |
| Confirmed settlement date | `confirmedSettlementDate` | UI search has Settlement Date filter. |
| Fixed-rate expiry | `fixedRateExpiry` | Opportunity search filter supported. |
| Interest-only expiry | `interestOnlyExpiry` | Opportunity search filter supported. |
| Notepad | `notePadText` on create | Only this narrow write use is currently documented. |
| Record deleted / recycle bin | `isDeleted` | Soft delete; restoration API unconfirmed. |

## MCP tool design: tiers and guardrails

### Tier A — read tools (safe default)

Expose `search_contacts`, `get_contact`, `search_opportunities`, `get_opportunity`, `list_opportunity_parties`, `list_assets`, `list_liabilities`, `list_contact_methods`, `list_addresses`, `list_employments`, `list_contact_incomes`, `list_contact_expenses`, `get_living_expenses`, and `get_other_income`.

Every read tool should return a stable display model and optionally a redacted raw model. Redact `webPassword`, tokens/API keys, identity-document numbers, account numbers/BSBs and other high-risk values unless the caller is explicitly authorised and the tool’s purpose requires the value. Always return `uniqueId` values needed for follow-up calls, but do not use display names as primary keys.

### Tier B — controlled write tools

Create/update contact and opportunity tools, contact-child upserts, party link/update, asset/liability upserts, category assignment and status/lead-source updates are documented at varying confidence. Because no sandbox exists and the earlier audit was read-only, make every mutation require an explicit `confirm: true` plus a human-readable diff. Do a fresh GET before item-level mutation when IDs or current values matter.

Extensions are special: implement `replace_living_expenses` and `replace_other_income` as optimistic-concurrency-style wrappers: GET, parse `value`, apply a constrained operation, show the complete before/after list, then PUT the full string. A raw `put_extension` tool should not be exposed to general users.

### Tier C — destructive tools

Use separate, conspicuously named soft-delete tools. They must require record ID, a current-record fetch, an explicit confirmation phrase, and an audit log. Do not offer restore until it is confirmed via a non-production-safe or expressly approved test.

### Intentionally absent tools

Do not create public-API MCP tools for UI notes/tasks, documents/attachments, product search/comparison, Client Portal/Client Centre requests, DigiSign, questionnaires, ApplyOnline/Loanapp, Open Banking, property watchlists, analytics/reports, CRM user/permissions, virtual-branch moves, broker sharing, or change-history retrieval. The UI’s existence is not API evidence.

## Source basis and known conflicts

- Current UI workflow sources: Connective Wiki “About People” (23 Oct 2024), “About CRM Opportunities” (12 Jan 2026), “Using the CRM search filters” (18 Mar 2026), and Client Portal articles (Mar–Apr 2026).
- Current public-API sources: “API integration with Mercury Nexus” (19 Feb 2026), “Managing Opportunities via the Mercury API” (19 Feb 2026), “Managing related parties via the Mercury API” (19 Feb 2026), “Mercury API FAQs” (3 Mar 2026), contact search (10 Apr 2026), plus financial extension/asset/liability articles.
- Contract evidence: read-only production census of 2,402 opportunities and 4,604 contacts (18 Jul 2026). That confirms response fields and wire formats, not field writability or UI workflow equivalence.
- Some current articles retain old `uatapis…/mercury-v1` examples. Treat the current production base URL as `https://apis.connective.com.au/mercury/v1`; current API FAQ says no sandbox/UAT exists.
- Rate limits conflict across documents (20/sec and 144,000/day vs 60/sec and 40,000/day). Use conservative throttling and obtain a written current limit before a high-volume MCP sync.
