# Coverage and confidence

## Confirmed read contract

A read-only census covered 2,402 opportunities, 4,604 contacts and 15 categories, plus detailed reads of the nominated test opportunity and two test contacts with documented children and both extension routes. This identified live-only fields, casing variants and primitive-format inconsistencies represented in the TypeScript types and OpenAPI schemas.

## Known wire behaviour

Collection routes require `search=true`; paginated reads use `count` and `offset`. Dates may be epoch milliseconds or strings. Casing is inconsistent (`personID`/`personId`, `parentID`/`parentId`; live Contact payloads use `identifications`). Extension `value` is JSON inside a string and its PUT is full replacement.

## Not yet confirmed

Required properties, request-only/read-only flags, validation boundaries, create/update semantics, soft-delete semantics, pagination limits and nested shapes for populated `valueObjectOwnershipList`, `otherLoanPeople` and `assetLiabilityLinks` require safe sandbox probes or a high-volume resource census.

## Sensitive field

`Contact.webPassword` was observed in GET responses. Clients must redact it and should not model it outside a controlled wire-level boundary.
