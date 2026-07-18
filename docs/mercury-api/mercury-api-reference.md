# Mercury Public API (Sandbox) — Full Reference

Source: `G:\My Drive\Cowork\reference\technical\mercury-api\MERCURY APIS - FULL\Mercury Public API (Sandbox).yaml`
Swagger 2.0 · `host: apis.connective.com.au` · `basePath: /mercury/v1` · Auth: `{token}` path param + `x-api-key` header

---

## 1. Endpoints (39 total + 6 undocumented extension endpoints — see below)

### Opportunities
| Method | Path | operationId |
|---|---|---|
| GET | `/{token}/opportunities` | Opportunity-search |
| POST | `/{token}/opportunities` | Opportunity-create |
| GET | `/{token}/opportunities/{id}` | Opportunity-get |
| PUT | `/{token}/opportunities/{id}` | Opportunity-update |
| POST | `/{token}/opportunities/hooks` | Opportunity-trigger (webhook) |
| DELETE | `/{token}/opportunities/hooks/{hookId}` | Delete-opportunity-trigger |
| GET | `/{token}/opportunities/{id}/assets` | Opportunity-assets-get |
| POST | `/{token}/opportunities/{id}/assets` | Opportunity-asset-create |
| PUT | `/{token}/opportunities/{id}/assets/{assetId}` | Opportunity-asset-update |
| GET | `/{token}/opportunities/{id}/liabilities` | Opportunity-liabilities-get |
| POST | `/{token}/opportunities/{id}/liabilities` | Opportunity-liability-create |
| PUT | `/{token}/opportunities/{id}/liabilities/{liabilityId}` | Opportunity-liability-update |
| GET | `/{token}/opportunities/{id}/relatedParties` | Opportunity-related-party-get |
| POST | `/{token}/opportunities/{id}/relatedParties` | Opportunity-related-party-create |
| PUT | `/{token}/opportunities/{id}/relatedParties/{relatedPartyId}` | Opportunity-related-party-update |

### Extension endpoints (undocumented in Swagger spec — found in wiki export only)
| Method | Path | Notes |
|---|---|---|
| GET | `/{token}/opportunities/{id}/extension/livingExpense` | Returns living-expense line items as a JSON-string blob |
| POST | `/{token}/opportunities/{id}/extension/livingExpense` | Creates the extension record (only if GET didn't already return a `uniqueId`) |
| PUT | `/{token}/opportunities/{id}/extension/livingExpense` | Destructive-replace — must resend full existing array |
| GET | `/{token}/opportunities/{id}/extension/otherIncome` | Returns other-income line items as a JSON-string blob |
| POST | `/{token}/opportunities/{id}/extension/otherIncome` | Creates the extension record |
| PUT | `/{token}/opportunities/{id}/extension/otherIncome` | Destructive-replace — must resend full existing array |

### Contacts
| Method | Path | operationId |
|---|---|---|
| GET | `/{token}/contacts` | Contact-search |
| POST | `/{token}/contacts` | Contact-create |
| GET | `/{token}/contacts/{id}` | Contact-get |
| PUT | `/{token}/contacts/{id}` | Contact-update |
| POST | `/{token}/contacts/hooks` | Contact-trigger (webhook) |
| DELETE | `/{token}/contacts/hooks/{hookId}` | Delete-contact-trigger |
| GET | `/{token}/contacts/{id}/contactMethods` | Contact-method-get |
| POST | `/{token}/contacts/{id}/contactMethods` | Contact-method-create |
| PUT | `/{token}/contacts/{id}/contactMethods/{contactMethodId}` | Contact-method-update |
| GET | `/{token}/contacts/{id}/expenses` | Contact-expense-get |
| POST | `/{token}/contacts/{id}/expenses` | Contact-expense-create |
| PUT | `/{token}/contacts/{id}/expenses/{expenseId}` | Contact-expense-update |
| GET | `/{token}/contacts/{id}/incomes` | Contact-income-get |
| POST | `/{token}/contacts/{id}/incomes` | Contact-income-create |
| PUT | `/{token}/contacts/{id}/incomes/{incomeId}` | Contact-income-update |
| GET | `/{token}/contacts/{id}/identification` | Contact-identification-get |
| POST | `/{token}/contacts/{id}/identification` | Contact-dentification-create *(sic — typo in source spec)* |
| PUT | `/{token}/contacts/{id}/identification/{identificationId}` | Contact-identification-update |
| GET | `/{token}/contacts/{id}/addresses` | Contact-address-get |
| POST | `/{token}/contacts/{id}/addresses` | Contact-address-create |
| PUT | `/{token}/contacts/{id}/addresses/{addressId}` | Contact-address-update |
| GET | `/{token}/contacts/{id}/employments` | Contact-employment-get |
| POST | `/{token}/contacts/{id}/employments` | Contact-employment-create |
| PUT | `/{token}/contacts/{id}/employments/{employmentId}` | Contact-employment-update |
| GET | `/{token}/contacts/{id}/opportunities` | Contact-opportunity-get |

### Partner Config & Categories
| Method | Path | operationId |
|---|---|---|
| GET | `/{token}/partner/config` | PartnerConfig-search |
| POST | `/{token}/partner/config` | PartnerConfig-create |
| PUT | `/{token}/partner/config/{id}` | PartnerConfig-update |
| GET | `/{token}/categories` | Category-search |
| POST | `/{token}/categories` | Category-create |
| GET | `/{token}/categories/{id}` | Category-get |
| PUT | `/{token}/categories/{id}` | Category-update |

All endpoints share common responses: `200` success, `400` bad request, `401` unauthorized, `403` forbidden, `404` not found, `500` internal server error — all error bodies use `#/definitions/Error`.

---

## 2. Schema Definitions (26 total)

### PartnerConfig
| Field | Type | Notes |
|---|---|---|
| uniqueId | string (uuid) | maxLength 44 |
| partnerId | string | maxLength 45 |
| key | string | maxLength 45 |
| value | string | maxLength 225 |
| primaryBg | string | maxLength 10 |
| secondaryBg | string | maxLength 10 |
| defaultBg | string | maxLength 10 |
| primaryFont | string | maxLength 10 |
| secondaryFont | string | maxLength 10 |
| defaultFont | string | maxLength 10 |
| vbInherit | integer (int32) | is virtual branch |

### Contact
| Field | Type | Notes |
|---|---|---|
| uniqueId | string (uuid) | maxLength 44 |
| company | string | Partner id, maxLength 36 |
| isDeleted | boolean | **soft-delete flag — filter `isDeleted=false` on all queries** |
| deletedBy | string | maxLength 64 |
| deletedOn | string (date-time) | |
| createdOn | string (date-time) | |
| createdBy | string | maxLength 45 |
| firstName | string | maxLength 64 |
| lastName | string | maxLength 124 |
| middleName | string | maxLength 44 |
| salutation | string | maxLength 64 |
| title | string | enum: Dr, Miss, Ms, Mr, Mrs, Prof, Rev — maxLength 24 |
| occupation | string | |
| employer | string | maxLength 164 |
| jobTitle | string | maxLength 64 |
| maritalStatus | string | enum: Single, Married, DeFacto, Separated, Divorced, Widowed, Other — maxLength 34 |
| driversLicenceNumber | string | maxLength 64 |
| driversLicenceExpiry | string (date) | |
| driversLicenceState | string | enum: ACT, NSW, NT, QLD, SA, TAS, VIC, WA, OTHER — maxLength 16 |
| gender | string | enum: M, F — maxLength 8 |
| dateOfBirth | string (date) | |
| employmentStatus | string | enum: Full Time, Part Time, Contract, Temporary, Commission, Seasonal, Casual, Self-Employed, Unemployed — maxLength 104 |
| employmentCommenced | string (date) | |
| phoneDisplayType1–4 | string (×4) | enum (each): Business, Business 2, Business Fax, Home, Home 2, Home Fax, Mobile, Mobile 2 — maxLength 45 |
| addressDisplay | string | maxLength 45 |
| homePhone | string | maxLength 44 |
| businessPhone | string | maxLength 44 |
| mobile | string | maxLength 44 |
| email | string (email) | maxLength 65535 |
| personDataType | string | maxLength 7 |
| notes | string | maxLength 65535 |
| relationshipManager | string | maxLength 45 |
| annualSalary | number (float) | |
| contactType | string | maxLength 45 |
| abn | string | maxLength 45 |
| acn | string | maxLength 45 |
| trustName | string | maxLength 100 |
| homeSuburb | string | maxLength 104 |
| numberOfDependents | integer (int32) | |
| doNotMail | boolean | |
| funambolUsers | string | maxLength 200 |
| markAsPrivate | boolean | |
| importDocumentId | string | maxLength 45 |
| partnerName | string | maxLength 255 |
| emailBounced | boolean | |
| webPassword | string (password) | maxLength 64 — **never log** |
| webAccess | boolean | |
| relationshipManagerName | string | maxLength 45 |
| lastUpdated | string (date-time) | |
| lastUpdatedBy | string | maxLength 45 |
| externalId | string | maxLength 45 |
| leadSourceId | string | maxLength 124 (iConnect only) |
| leadSourceName | string | maxLength 255 (iConnect only) |
| contactMethods | array\<ContactMethod\> | |
| Identification | array\<Identification\> | (note: capitalized field name, unlike others) |
| expenses | array\<Expense\> | |
| incomes | array\<Income\> | |
| addresses | array\<Address\> | |
| categories | array\<Category\> | |
| myMarketingTactics | array\<MyMarketingTactics\> | |

### ContactMethod
| Field | Type | Notes |
|---|---|---|
| uniqueId | string (uuid) | maxLength 40 |
| company | string | internal, maxLength 36 |
| isDeleted | boolean | internal |
| personID | string (uuid) | internal, maxLength 40 |
| contactMethod | string | enum: Business, Business 2, Business Fax, Email 1, Email 2, Email 3, Home, Home 2, Home Fax, Mobile, Mobile 2 — maxLength 20 |
| content | string | maxLength 100 |
| type | string | enum: email, home, mobile, phone — maxLength 45 |

### Identification
| Field | Type | Notes |
|---|---|---|
| uniqueId | string (uuid) | maxLength 44 |
| company | string | internal, maxLength 36 |
| createdBy | string | maxLength 45 |
| createdOn | string (date-time) | |
| documentIssuedBy | string | maxLength 45 |
| documentNumber | string | maxLength 45 |
| endDate | string (date-time) | expiry |
| isDeleted | boolean | internal |
| parentId | string (uuid) | internal, maxLength 36 |
| nameOnDocument | string | maxLength 128 |
| personId | string (uuid) | internal, maxLength 45 |
| placeOfIssue | string | enum: ACT, NSW, NT, QLD, SA, TAS, VIC, WA, OTHER — maxLength 45 |
| startDate | string (date-time) | |
| versionSighted | string | enum: Original, Certified — maxLength 45 |
| documentType | string | enum (49 values — full list below) — maxLength 45 |

**documentType full enum:** DriversLicenceAust, GovtIssuePilotLicence, BirthCertificate, PassportAust, PassportIntl, ProofOfAgeCard, BirthCertAust, BirthCertIntl, AustCitizenshipCertificate, GovtIssueHealthCard, GovtPensionCard, DriversLicenceIntl, CitizenCertIntl, PassportExpired, BankCreditCard, FinInstCreditCard, BankCashCard, FinInstCashCard, BankPassbook, FinInstPassbook, BankStatement, DeedPoll, DefForceIdentityCard, ExistingCustomer, GovtIssueBoatLicence, GovtIssueEmployeeCard, GovtIssueFinancialBenNot, GovtIssueGunLicence, IdentityCard, IDFromCurrEmployer, LeaseContract, LetterFromCurrEmployer, MarriageCertificate, MedicareCard, OfficialStudentCard, PublicServiceIDCard, RateNotice, Reference, RentReceipt, SecGuardIDCard, SchoolLetterOfIntro, StatementFromLandlord, TaxationNoticeAust, TertiaryStudentIDCard, UtilityStatementElectric, UtilityStatementGas, UtilityStatementPhone, UtilityStatementWater, WrittenRefCustomer, WrittenRefFinancialInst, WrittenRefReferee

### Expense
| Field | Type | Notes |
|---|---|---|
| uniqueId | string (uuid) | maxLength 36 |
| company | string | internal, maxLength 36 |
| isDeleted | boolean | internal |
| personID | string (uuid) | internal, maxLength 36 |
| personName | string | maxLength 189 |
| amount | number (float) | |
| type | string | enum: Credit Card, Home Loan, Investment Loan, Car Loan, Personal Loan, Maintenance, Rent Paid, Living Expenses, Education, Insurance, Other — maxLength 44 |
| frequency | string | enum: Annual, Fortnightly, Monthly, Weekly — maxLength 44 |
| balance | number (float) | |
| creditLimit | number (float) | |
| comment | string | maxLength 104 |

### Employment
| Field | Type | Notes |
|---|---|---|
| uniqueId | string (uuid) | |
| employerName | string | |
| employmentBasis | string | maxLength 104 (Full time, Part time etc — free text, no enum) |
| employmentStatus | string | maxLength 45 (Primary, Secondary, Previous — free text) |
| employmentType | string | maxLength 45 (Payg, self employment etc — free text) |
| jobTitle | string | maxLength 64 |
| natureOfBusiness | string | |
| operatingStructure | string | maxLength 45 |
| paygEmployerType | string | maxLength 45 (Public or Private — free text) |
| abn | string | maxLength 45 |
| personId | string (uuid) | |
| role | string | maxLength 64 |
| startDate | string (date) | |
| endDate | string (date) | |
| onBenefits | boolean | |
| onProbation | boolean | |
| student | boolean | |
| incomes | array\<Income\> | |
| address | Address | single object, not array |

### Income
| Field | Type | Notes |
|---|---|---|
| uniqueId | string (uuid) | maxLength 36 |
| company | string | internal, maxLength 36 |
| isDeleted | boolean | internal |
| personID | string (uuid) | internal, maxLength 36 |
| personName | string | maxLength 189 |
| amount | number (float) | |
| type | string | enum: Bonus, Business Income, Dividends, Family Allowance, Maintenance, Overtime, Pension, Rental, Salary, Self Employed, Other — maxLength 44 |
| frequency | string | enum: Annual, Fortnightly, Monthly, Weekly — maxLength 44 |
| dateCommenced | string (date) | |
| sortKey | integer (int32) | internal |
| comment | string | maxLength 104 |

### Opportunity
| Field | Type | Notes |
|---|---|---|
| uniqueId | string (uuid) | |
| company | string | maxLength 36 |
| isDeleted | boolean | **soft-delete flag** |
| deletedBy | string | maxLength 64 |
| deletedOn | string (date-time) | |
| createdOn | string (date-time) | |
| createdBy | string | maxLength 64 |
| opportunityName | string | maxLength 164 |
| amount | number (float) | Amount borrowed |
| lender | string | maxLength 30 |
| lenderNameShort | string | maxLength 45 |
| status | string | maxLength 84 — free text in spec, but **live Finhub Mercury CRM constrains this to 30 canonical values** (see §4) |
| agent | string | maxLength 64 — CA number |
| personActing | string | maxLength 64 — CA number |
| personResponsible | string | maxLength 44 — CA number |
| lenderReference | string | maxLength 100 |
| financeDate | string (date-time) | |
| expectedSettlementDate | string (date-time) | |
| confirmedSettlementDate | string (date-time) | |
| leadSourceId | string | maxLength 104 |
| leadSourceDisplay | string | maxLength 255 |
| discount | number (float) | |
| existingAmount | number (float) | |
| lmi | number (float) | Loan mortgage insurance |
| settlementDateConfirmed | boolean | |
| discountType | string | maxLength 44 |
| loanPersonRelationship | string | maxLength 164 |
| transactionType | string | enum: Loan, CommercialLoans, PlantAndEquipment, PersonalLoans, Property, FinancialPlanning, Insurance, LifeInsurance, Accounting, TermDeposit, PremiumFunding, CreditCard, CashManagementAcc — maxLength 45 |
| notePadText | string | maxLength 21000 |
| partnerReference | string | maxLength 44 |
| nextGenId | string | maxLength 12 |
| parentId | string | internal, maxLength 44 |
| workspaceUsers | string | maxLength 100 — CA numbers |
| tranxType | string | enum: Pre-Approval, Purchase, Refinance, Top Up, Variation — maxLength 44 |
| connectiveLodgeId | string | maxLength 10 |
| peResidualAmount | number (float) | |
| peRepaymentAmount | number (float) | |
| peEffectiveRate | number (float) | |
| peInterestRate | number (float) | |
| peBrokerage | number (float) | |
| assetDescription | string | maxLength 21000 |
| nextAction | string (date-time) | |
| loanTerm | number (int32) | |
| fixedRateExpiry | string (date-time) | |
| depositDueDate | string (date-time) | |
| barCodeId | string | maxLength 45 |
| agentName | string | maxLength 511 |
| personActingName | string | maxLength 511 |
| personResponsibleName | string | maxLength 44 |
| defaultPath | string | maxLength 21000 |
| partnerName | string | maxLength 255 |
| partnerSharedWithId | string | maxLength 45 |
| partnerSharedWithName | string | maxLength 255 |
| statusLastUpdated | string (date-time) | |
| lastUpdatedBy | string | maxLength 45 |
| lenderComments | string | maxLength 21000 |
| sitRep | string | maxLength 21000 |
| campaignId | string | maxLength 45 |
| campaignName | string | maxLength 255 |
| securityValue | number (float) | |
| aliApplicationId | string | maxLength 40 |
| metlifeApplicationId | string | maxLength 40 |
| interestOnlyExpiry | string (date-time) | |
| lastUpdated | string (date-time) | |
| emailAccountAddress | string (email) | maxLength 70 |
| originationFee | number (float) | |
| metaData | string | maxLength 255 — semicolon-separated categories |
| relatedParties | array\<RelatedParty\> | |
| assets | array\<Asset\> | |
| liabilities | array\<Liability\> | |

### Address
| Field | Type | Notes |
|---|---|---|
| uniqueId | string (uuid) | maxLength 36 |
| company | string | internal, maxLength 36 |
| isDeleted | boolean | internal |
| deletedBy | string | internal, maxLength 64 |
| deletedOn | string (date-time) | internal |
| parentType | string | maxLength 20 |
| parentId | string (uuid) | internal, maxLength 36 |
| type | string | Residence type, maxLength 64 (free text, no enum) |
| streetName | string | maxLength 164 |
| streetNumber | string | maxLength 20 |
| streetType | string | maxLength 64 |
| city | string | maxLength 104 |
| state | string | enum: ACT, NSW, NT, QLD, SA, TAS, VIC, WA, OTHER — maxLength 12 |
| postcode | string (postcode) | maxLength 16 |
| country | string | enum: full ISO-3166-1 alpha-2 list — **⚠ spec bug: `NO` (Norway) rendered as unquoted YAML `no` → parsed as boolean `false`, see line 4545** |
| unitNumber | string | maxLength 44 |
| buildingName | string | maxLength 164 |
| floorNumber | string | maxLength 44 |
| isCorrespondenceAddress | boolean | |
| fromDate | string (date-time) | |
| toDate | string (date-time) | |
| addressBlock | string | maxLength 65535 |
| format | string | maxLength 45 |
| housingSituation | string | enum: Boarding, Caravan, Own Home, Own Home - Mortgage, Renting, With Parents, Other — maxLength 45 |
| requiresConfirmation | boolean | |
| poBoxNumber | string | maxLength 10 |
| poBoxType | string | maxLength 6 |
| personName | string | maxLength 189 |
| addrGeoLatitude | string | maxLength 15 |
| addrGeoLongitude | string | maxLength 15 |

**country enum (ISO 3166-1 alpha-2, A–Z):** AD, AE, AF, AG, AI, AL, AM, AN, AO, AQ, AR, AS, AT, AU, AW, AX, AZ, BA, BB, BD, BE, BF, BG, BH, BI, BJ, BL, BM, BN, BO, BQ, BR, BS, BT, BV, BW, BY, BZ, CA, CC, CD, CF, CG, CH, CI, CK, CL, CM, CN, CO, CR, CU, CV, CW, CX, CY, CZ, DE, DJ, DK, DM, DO, DZ, EC, EE, EG, EH, ER, ES, ET, FI, FJ, FK, FM, FO, FR, GA, GB, GD, GE, GF, GG, GH, GI, GL, GM, GN, GP, GQ, GR, GS, GT, GU, GW, GY, HK, HM, HN, HR, HT, HU, ID, IE, IL, IM, IN, IO, IQ, IR, IS, IT, JE, JM, JO, JP, KE, KG, KH, KI, KM, KN, KP, KR, KW, KY, KZ, LA, LB, LC, LI, LK, LR, LS, LT, LU, LV, LY, MA, MC, MD, ME, MF, MG, MH, MK, ML, MM, MN, MO, MP, MQ, MR, MS, MT, MU, MV, MW, MX, MY, MZ, NA, NC, NE, NF, NG, NI, NL, **~~NO~~ → `false` (bug)**, NP, NR, NU, NZ, OM, PA, PE, PF, PG, PH, PK, PL, PM, PN, PR, PS, PT, PW, PY, QA, RE, RO, RS, RU, RW, SA, SB, SC, SD, SE, SG, SH, SI, SJ, SK, SL, SM, SN, SO, SR, SS, ST, SV, SX, SY, SZ, TC, TD, TF, TG, TH, TJ, TK, TL, TM, TN, TO, TR, TT, TV, TW, TZ, UA, UG, UM, US, UY, UZ, VA, VC, VE, VG, VI, VN, VU, WF, WS, YE, YT, ZA, ZM, ZW

### RelatedParty
| Field | Type | Notes |
|---|---|---|
| uniqueId | string (uuid) | maxLength 36 |
| isDeleted | boolean | internal |
| personID | string (uuid) | mandatory when adding a related party, maxLength 36 |
| relationship | string | enum: Adviser, Agent, Primary applicant, Secondary applicant, Assessor, Bank / Lender, Banker, Broker, Builder, Accountant, Conveyancer, Solicitor, Co-Applicant, Director, Employer, Financial Planner, Insurance referral, Insurer, Joint Borrower, JSG/ PRE, Land Agent, Lender, Loan Writer, NonApplicant, Other — maxLength 164 |

### Asset
| Field | Type | Notes |
|---|---|---|
| uniqueId | string (uuid) | maxLength 36 |
| company | string | internal, maxLength 36 |
| isDeleted | boolean | internal |
| deletedBy | string | internal, maxLength 64 |
| deletedOn | string (date-time) | internal |
| parentType | string | internal, default "Asset", maxLength 20 |
| parentId | string (uuid) | internal, maxLength 36 |
| name | string | enum: Real Estate, Boat, Business Equity, Cash Management, Charge Over Cash, Cheque Account, Debenture Charge, Gifts, Guarantee, Home Contents, Investment Savings, Life Insurance, Managed Funds, Motor Vehicle, Savings Account, Shares, Superannuation, Term Deposit, Other — maxLength 44 |
| type | string | enum: account, realEstate, vehicle, standard — maxLength 45 |
| value | number (float) | |
| valueBasis | string | enum: Applicant Estimate, Certified Valuation, Actual Value — maxLength 45 |
| details | string | maxLength 164 — also used for motorVehicleMake input |
| institution | string | maxLength 44 |
| accountName | string | maxLength 80 |
| accountNumber | string | maxLength 30 |
| accountBSB | string | maxLength 15 |
| realEstateUseAsSecurity | boolean | |
| realEstatePurpose | string | enum: Owner Occupied, Investment — maxLength 45 |
| realEstateZoning | string | maxLength 45 |
| address | Address | single object |
| realEstateToBePurchased | boolean | |
| realEstateRentalIncome | number (float) | |
| realEstateRentalIncomeFrequency | string | enum: annually, fortnightly, monthly, weekly — maxLength 45 |
| realEstateRentalEvidenceOfTenancy | boolean | |
| existingMortgageCreditor | string | maxLength 45 |
| existingMortgageInterestRate | number (float) | |
| existingMortgageBalance | number (float) | |
| existingMortgageRepayment | number (float) | |
| existingMortgageRepaymentFrequency | string | enum: annually, fortnightly, monthly, weekly — maxLength 15 |
| existingMortgageRepaymentClearing | boolean | |
| motorVehicleType | string | maxLength 44 (free text) |
| motorVehiceYear | string | maxLength 12 *(sic — typo in source spec, missing "l")* |
| motorVehicleMake | string | maxLength 164 (display only — use `details` field for writes) |

### Liability
| Field | Type | Notes |
|---|---|---|
| uniqueId | string (uuid) | maxLength 36 |
| company | string | internal, maxLength 36 |
| isDeleted | boolean | internal |
| deletedBy | string | internal, maxLength 64 |
| deletedOn | string (date-time) | internal |
| parentType | string | maxLength 20 |
| parentId | string (uuid) | internal, maxLength 36 |
| name | string | enum: Commercial Bill, Credit Card, HECS, Hire Purchase, Lease, Line Of Credit, Loan As Guarantor, Maintenance, Mortgage Loan, Other Loan, Outstanding Taxation, Overdraft, Personal Loan, Store Card, Term Loan, Other — maxLength 44 |
| type | string | enum: account, realEstate, vehicle, standard — maxLength 45 |
| value | number (float) | |
| details | string | maxLength 164 |
| limit | integer (int32) | |
| institution | string | maxLength 44 |
| accountName | string | maxLength 80 |
| accountNumber | string | maxLength 30 |
| accountBSB | string | maxLength 15 |
| accountRepayment | number (float) | |
| accountRepaymentFrequency | string | enum: annually, fortnightly, monthly, weekly — maxLength 15 |
| creditCardType | string | enum: Amex, Diners, Mastercard, Visa — maxLength 45 |
| accountClearingFromLoan | boolean | |

### Category
| Field | Type | Notes |
|---|---|---|
| uniqueId | string (uuid) | maxLength 36 |
| categoryName | string | maxLength 80 — **live Finhub values follow a `PREF - *` / `FREQ - *` / `REVIEW - *` naming convention, see §4** |
| categoryNotes | string | maxLength 65535 |
| activeCampaignId | string | maxLength 10 |

### MyMarketingTactics
| Field | Type | Notes |
|---|---|---|
| uniqueId | string (uuid) | maxLength 45 |
| itemName | string | maxLength 45 |

### OpportunitySearchResult / ContactSearchResult / PartnerConfigSearchResult / CategorySearchResult
Identical shape, differing only in `results` item type:
| Field | Type |
|---|---|
| totalCount | integer (int32) |
| count | integer (int32) |
| offset | integer (int32) |
| results | array\<Opportunity \| Contact \| PartnerConfig \| Category\> |

### Error
| Field | Type |
|---|---|
| code | integer (int32) — HTTP status |
| contactEmail | string (email) |
| description | string |
| homeRef | string |
| reasonPhrase | integer (int32) |
| uri | string (url) |

### Success
| Field | Type |
|---|---|
| status | integer (int32) |
| uniqueId | string (uuid) |

### OpportunitySearchParams
| Field | Type | Notes |
|---|---|---|
| name | string | |
| isDeleted | boolean | default false |
| statuses | array\<string\> | |
| lastUpdated | string | yyyy-mm-dd or yyyy-mm-dd HH:MM:SS, supports ranges |
| transactionType | string | default "all" |
| user | string | CA number |
| createdOn | string | date/range |
| interestOnlyExpiry | string | date/range |
| fixedRateExpiry | string | date/range |
| confirmedSettlementDate | string | date/range |

### PartnerConfigSearchParams
| Field | Type |
|---|---|
| key | string |
| partnerId | string |

### ContactSearchParams
| Field | Type | Notes |
|---|---|---|
| name | string | |
| isDeleted | boolean | default false |
| excludeDoNotMail | boolean | default false |
| excludeEmailBounced | boolean | default false |
| lastUpdated | string | date/range |
| companyName | string | |
| personType | string | |
| categoryId | string | |
| campaignId | string | |
| contactNumber | string | |
| email | string | |
| createdOn | string | date/range |
| dateOfBirth | string | date/range |
| birthday | string | date/range (anniversary) |

### ContactHookRequestBody
| Field | Type | Notes |
|---|---|---|
| active | boolean | default true, internal |
| name | string | default "web", internal |
| config.subscription_type | string | enum: All available contacts, Contacts in my branch/office, Contacts where I am the relationship manager |
| config.content_type | string | default "json", internal |
| config.url | string | notification URL, internal |
| event | string | enum: Created, Created or updated, Deleted — default "Created" |

### OppHookRequestBody
| Field | Type | Notes |
|---|---|---|
| active | boolean | default true, internal |
| name | string | default "web", internal |
| config.subscription_type | string | enum: All available opportunities, Opportunities in my branch/office, Opportunities where I am the agent, Opportunities where I am the admin/supervisor |
| config.content_type | string | default "json", internal |
| config.url | string | notification URL, internal |
| event | string | enum: Created, Created or updated, Deleted, Opportunity Status Changed — default "Created" |

### WebhookCreationResponse
| Field | Type |
|---|---|
| type | string |
| id | integer |
| name | string |
| active | boolean |
| events | array\<string\> |
| config.content_type | string |
| config.url | string |
| updated_at | string |
| created_at | string |
| url | string |
| test_url | string |
| ping_url | string |
| last_response.code | string |
| last_response.status | string |
| last_response.message | string |

---

## 3. Notable spec issues found

1. **`Address.country` enum bug** (line 4545): unquoted `no` (Norway's ISO code) was interpreted by the YAML parser as boolean `false` instead of the string `"NO"`. If building a typed client, patch this manually to `"NO"`.
2. **Typo in operationId**: `Contact-dentification-create` (missing "I") for the POST `/contacts/{id}/identification` endpoint (line 1914).
3. **Typo in field name**: `motorVehiceYear` (missing "l") on `Asset` (line 4986).
4. **Inconsistent casing**: `Contact.Identification` (capitalized) vs. all other array fields on `Contact` which are lowerCamelCase (`contactMethods`, `expenses`, `incomes`, `addresses`, `categories`).
5. **`Opportunity.status` and `Address.type`/`Employment.*` fields are free-text strings with no enum**, despite Mercury CRM likely constraining them internally — validate against your CRM's actual status/category constants (per your build-discipline rule: status strings from constants only) rather than the spec, since the spec doesn't enumerate them.
6. **6 endpoints exist in production but are entirely absent from the Swagger YAML**: the `extension/livingExpense` and `extension/otherIncome` GET/POST/PUT endpoints (see §1 and §5). They were only discoverable via the wiki export files sitting alongside the spec, not the spec itself.

---

## 4. Live data pulled from Finhub's connected Mercury CRM (2026-07-17)

The static sandbox spec leaves several fields as unconstrained free text. Pulled live via the Mercury CRM MCP (`list_loan_statuses`, `list_contact_categories`, `list_panel_lenders`) to get the actual production-constrained values Finhub uses. These are broker-group-specific — not part of the generic Mercury spec — but far more accurate than guessing. Cross-checked against `LOAN STATUS NAME ..txt` in the same reference folder — both sources match exactly.

### `Opportunity.status` — 30 canonical values

**Active (27):**
1. Lead – Discovery
2. Strategy Appointment Booked & Client Center Portal Send to Clients
2.1 Appointment Conduct & Completed
2.2 Follow-Up Required
2.3 Follow Up Opportunities
3.0 Awaiting Client Documents
3.1 Documents Received & Uploaded
4. Lender Selection & Policy Review
5. Loan Proposal Sent to Client Via Email
5.1 Prepare For Application Lodgement
6. Application Submitted to Lender
6.1 Lender Queries / Outstanding Items (MIR)
6.2 Pre-Approval Issued
6.3. Unconditional Approval Issued
7.0. Loan Documents Issued
7.1 Documents Returned & Certified
8.0 Ready for Settlement
8.1 Settled/Funded
8.2 Settled – Commission Paid
8.3 Construction Loan – Progress Payments
8.4 Loan Currently In Arrear
9.0 Financial Passport Invite Sent
9.1 Financial Passport Invite -Active
9.2 Financial Passport Invite -Expired
9.3 Mortgage Review – 24 Month
9.4 Mortgage Review – 30 Month
9.5 Mortgage Review – 36 Month

**Inactive (3):**
12. Loan Discharged
13. Declined by Lender
14. Client Not Proceeding

> Use these exact strings (including en-dashes `–`, not hyphens, where present) in `search_loans`/`search_opportunity` status filters. Omitting a status filter defaults to the active set.

### `Category.categoryName` — 15 live values (Finhub contact categories)

| id | name |
|---|---|
| 00e98043-c988-4a0c-8af4-60e23f96618b | REVIEW - Client Will Call |
| 0634f266-57ad-4678-b6f9-b0d0f613910e | PREF - Loan Reminders |
| 1cb37611-4930-421c-aab1-8ccad9d840c2 | FREQ - Important Only |
| 1f92c833-f51e-4400-8427-f2ae5576e74b | PREF - Property Market |
| 2fc3f698-f81b-4182-a77d-ffa3676f1bb5 | FREQ - Half Yearly |
| 45d58dc7-3f09-4012-a50b-dee6ea56e449 | REVIEW - 24 Monthly |
| 4aa3c638-3154-4769-918a-ff49329774e1 | PREF - Ad Hoc Only |
| 4b08cb64-f755-4110-8a69-11dcbc9a36c1 | PREF - RBA Updates |
| 787efc54-0808-40b2-910a-d03be5458ce3 | REVIEW - 12 Monthly |
| 9283baca-21c3-4cc4-aa76-e0eb8bab414e | PREF - Lender News |
| b26b0d06-1285-4654-8a1a-f4dfb7ea0456 | FREQ - Monthly |
| c04b50b1-c48d-4069-9bed-f9ca1670abb6 | FREQ - Quarterly |
| c918c560-de17-4704-99a5-b9490c17fc68 | PREF - Investment Property |
| d1863e3d-1c21-441c-96c1-dada191cc375 | PREF - First Home Buyer |
| f4defb1c-7285-489c-a6b7-659b2f003c85 | REVIEW - 6 Monthly |

Three families: `PREF - *` (communication topic preferences), `FREQ - *` (contact frequency), `REVIEW - *` (review cadence).

### Panel lenders (relevance: high)

**CDR-connected (10):** ANZ, CommBank, NAB, Westpac, St.George, Bank of Melbourne, BankSA, Macquarie, ING, Bankwest

**Non-CDR panel lenders (13, no Open Banking API — structural, not a data gap):** Firstmac, Pepper Money, La Trobe Financial, Resimac, Bluebay, RedZed, Better Choice, Better Mortgage Management, Granite Home Loans, HomeStart Finance, Keystart, OwnHome, Deposit Power

Pass `relevance: "all"` on `list_panel_lenders` for the full 40-lender CDR set (not just the 10-lender mainstream default-compare group shown above).

---

## 5. Usage Guide

Source: `Managing Opportunities and contact.txt` (Connective wiki export, found alongside the Swagger spec in the same reference folder — not part of the spec itself). Cross-checked field-for-field against the schema definitions in §2.

### Authentication & URL pattern

Every call substitutes your branch's API token directly into the URL path — it is **not** sent as a bearer header:

```
https://apis.connective.com.au/mercury/v1/{token}/opportunities
```

The `x-api-key` header (broker group API key, per the Swagger spec) is sent in addition to the path token.

### Create → capture the returned uniqueId

```
POST /{token}/opportunities
{ "opportunityName": "Test Opportunity", "amount": "350000" }

→ { "uniqueId": "55c31db1-142c-11e7-a0a2-00155d009933", "emailId": "" }
```

You can create with or without nested entities (assets, liabilities, relatedParties) in the same call, and without supplying nested `uniqueId`s — Mercury auto-generates them:

```
POST /{token}/opportunities
{
  "opportunityName": "Test Opportunity Nested Entities",
  "amount": "350000",
  "assets": [{ "name": "Boat", "type": "standard", "value": 100000 }],
  "liabilities": [{ "name": "Maintenance", "type": "standard", "value": 100000, "details": "" }],
  "relatedParties": [{ "personID": "e2970b4e-a8bc-11e7-9efd-00155d00a466", "relationship": "Primary Applicant" }]
}
```

### Nested entity CRUD rule (applies to assets, liabilities, relatedParties, and equivalents on Contact)

There is no separate create/update/delete endpoint for most nested entities — one `PUT` on the parent handles all three, keyed off whether `uniqueId` is present:

| `uniqueId` present? | `isDeleted` | Effect |
|---|---|---|
| No | — | Creates a new nested entity |
| Yes | absent/false | Updates the existing nested entity |
| Yes | `true` | Soft-deletes the nested entity |

```
PUT /{token}/opportunities/{id}
{
  "amount": 600000,
  "assets": [{ "uniqueId": "4c99eb9d-a8bd-11e7-9efd-00155d00a466", "value": 200000 }],
  "relatedParties": [{ "uniqueId": "0dfeccb8-a8be-11e7-9efd-00155d00a466", "isDeleted": true }]
}
```

Deleting the whole Opportunity is the same pattern applied at the top level:

```
PUT /{token}/opportunities/{id}
{ "isDeleted": true }
```

There is no hard DELETE for these resources — everything soft-deletes via `PUT`. (The one true DELETE verb in the whole API is for webhooks: `DELETE /{token}/opportunities/hooks/{hookId}`.)

### Search: query params, not a separate verb

```
GET /{token}/opportunities?search=true&count=50&offset=50&sortKey=lastModifiedDate&sortOrder=ASC
```

- `search` / `search=true` are equivalent — the param just needs to be present
- `count`: max 100 (values above are silently clamped), default 25
- `offset`: pagination offset, default 0
- `sortKey`: `creationDate` | `lastModifiedDate`, default `creationDate`
- `sortOrder`: `ASC` | `DESC`, default `DESC`
- Every search response returns `totalCount` (total matches in DB), `count` (returned in this page), `offset` (as requested)
- Complex filters go through a **URL-encoded JSON object** in the `searchParams` query param (shape defined by `OpportunitySearchParams` / `ContactSearchParams` in §2)

### Date-range search syntax (used inside `searchParams` values)

| Intent | Syntax | Example |
|---|---|---|
| Between two dates | `start/end` | `"2017-04-01/2017-04-30"` |
| On/after a date (inclusive) | `date/` | `"2017-04-30/"` |
| On/before a date (inclusive) | `/date` | `"/2017-04-01"` |
| Exact date | `date` | `"2017-04-01"` |
| Exact timestamp (AEST) | `date time` | `"2017-04-01 05:00:00"` |
| Between two timestamps | `start time/end time` | `"2017-04-01 12:00:00/2017-04-01 14:00:00"` |

`/`, `..`, or the literal word `to` all work as the range separator.

### Lead source assignment (Opportunity)

Lead source is assigned via `leadSourceId` and/or `leadSourceDisplay` on the Opportunity payload, with merge logic:

- Only `leadSourceDisplay` given: assigns it if it exists, otherwise creates a new Lead Source and assigns it
- Only `leadSourceId` given: assigns it if it exists, otherwise **no assignment happens** (silent no-op — worth guarding against in client code)
- Both given and they match: assigns normally
- Both given and they don't match: if `leadSourceId` exists, only its display name is updated (no assignment); if `leadSourceId` doesn't exist but the display does, a new Lead Source is created and assigned

### Extension endpoints (not in the Swagger spec at all)

Two Opportunity sub-resources exist only as `extension/*` routes and are undocumented in the YAML — `livingExpense` and `otherIncome`. Both follow the same shape:

```
GET /{token}/opportunities/{id}/extension/livingExpense
→ {
    "uniqueId": "ece74c1b-...",
    "parentType": "loan",
    "parentId": "2f280310-...",
    "key": "livingExpense",
    "value": "[{\"uniqueId\":\"29a49080-...\",\"amount\":\"1000.00\",\"type\":\"Clothing & Personal Care\",\"frequency\":\"Monthly\",\"splits\":[{\"personId\":\"5aeef758-...\",\"percent\":60},{\"personId\":\"e885520a-...\",\"percent\":40}]}]"
  }
```

Key quirks:
- **`value` is a JSON string, not structured JSON** — you must `JSON.parse()` it client-side, and `JSON.stringify()` before sending it back.
- If GET already returns a `uniqueId`, **do not POST** — the extension record already exists; go straight to PUT.
- **PUT is a destructive full-replace** of the `value` array — you must resend every existing line item, or they'll be silently deleted. There's no partial-update/append semantic.
- New line items need a **client-generated UUID** before insertion (the wiki links `https://www.uuidgenerator.net/` — in practice, generate this with `crypto.randomUUID()` or your language's UUID v4 library, not a website).
- `splits` (percentage ownership across linked contacts via `personId`) is optional on write — if omitted, ownership is automatically split evenly across all linked contacts.

### Practical checklist when building a client against this API

- [ ] Filter `isDeleted=false` on every search unless you explicitly want deleted records (per your CRM build-discipline rule)
- [ ] Never hardcode `Opportunity.status` strings inline — pull from `list_loan_statuses` / §4 above, not the empty spec enum
- [ ] Treat `extension/*` PUT calls as full-replace — fetch-merge-put, never PATCH-style partial payloads
- [ ] Guard the `leadSourceId`-only-and-not-found case — it silently no-ops rather than erroring
- [ ] Patch the `Address.country` `"NO"` bug if using the generated TypeScript types
- [ ] Treat `createdOn`/`lastUpdated`/`statusLastUpdated` as **Unix epoch milliseconds** (numbers), not `date-time` strings — see §6, the spec's declared format doesn't match live data
- [ ] Don't assume the Swagger spec is a complete field list for `Opportunity` — live production returns ~20 fields it doesn't document at all, see §6

---

## 6. Live production field discoveries (2026-07-17)

Confirmed by a live authenticated GET against `https://apis.connective.com.au/mercury/v1/{token}/opportunities?search=true&count=2` using a real Finhub branch token/API key (schema-only inspection — response values were never logged or written to any persistent file, only field names/types were extracted, then the raw response was deleted). Field values like `invoiceCafStatus`, `applicationPlatform`, and `peBuildYear` confirm this hit a **live production account, not the sandbox** — the response bore no resemblance to the "SOAP UI Test Opportunity" sandbox fixtures shown in the wiki export.

### Format discrepancy: date fields are epoch milliseconds, not ISO strings

The Swagger spec declares `createdOn`, `lastUpdated`, `statusLastUpdated`, `deletedOn`, etc. as `type: string, format: date-time`. **Live data returns these as numbers (Unix epoch milliseconds)**, e.g. `1490756658000`, not `"2017-03-29T00:00:00Z"`-style strings. Any client parsing these fields needs `new Date(epochMs)`, not a date-string parser — trusting the spec's declared format here will silently produce `Invalid Date`.

### Fields present on live `Opportunity` records with no equivalent in the Swagger spec

| Field | Inferred type | Notes |
|---|---|---|
| `volume` | number | new top-level pagination field alongside `totalCount`/`count`/`offset` on search results |
| `deletedByDisplay` | string | display-name companion to `deletedBy` |
| `lenderDisplayName` | string | companion to `lender`/`lenderNameShort` |
| `peResidualPercentage` | number | additional PE (plant & equipment) field beyond the 5 already in spec |
| `peFinanceType` | string | |
| `peAssetType` | string | |
| `peBuildYear` | string | |
| `agentEmail` | string | companion to `agentName` |
| `salePrice` | number | |
| `referrerFee` | number | fee field beyond `originationFee` |
| `docFee` | number | fee field beyond `originationFee` |
| `invoiceId` | string | part of an entirely undocumented invoicing sub-system |
| `invoicePaymentReceived` | boolean | |
| `invoicePersonName` | string | |
| `invoicePersonAddress` | string | |
| `invoiceBrokerReference` | string | |
| `invoiceCafStatus` | string | |
| `applicationPlatform` | string | |
| `otherLoanPeople` | array (shape unknown — empty in sample) | distinct from `relatedParties` |
| `assetLiabilityLinks` | array (shape unknown — empty in sample) | distinct from `assets`/`liabilities` — likely links assets to the liabilities they secure |

> These were empty/absent in the two-record sample pulled, so their item shapes (`otherLoanPeople[]`, `assetLiabilityLinks[]`) are unconfirmed — would need a record that actually populates them to reverse-engineer the nested shape.

### Security note on this discovery

⚠️ The API key and token used to pull this were pasted directly into chat rather than set as environment variables — **rotate/regenerate both in the Mercury/Connective admin panel** before relying on this account for anything beyond this exploration session.
