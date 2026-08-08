/**
 * Mercury Public API (Sandbox) — TypeScript types
 * Generated from: Mercury Public API (Sandbox).yaml (Swagger 2.0)
 * Base path: https://apis.connective.com.au/mercury/v1
 * Auth: {token} path param + x-api-key header
 *
 * LIVE CONTRACT PATCH (2026-07-18): confirmed production read fields and
 * formats are incorporated below. Fields labelled read-only have not been write-tested.
 *
 * NOTE: source spec has a bug — Address.country enum contains `false`
 * instead of "NO" (Norway) due to unquoted YAML `no`. Fixed below.
 */

// ---------- Shared enum unions ----------

export type AuState =
  | "ACT" | "NSW" | "NT" | "QLD" | "SA" | "TAS" | "VIC" | "WA" | "OTHER";

export type Frequency = "Annual" | "Fortnightly" | "Monthly" | "Weekly";

export type FrequencyLower = "annually" | "fortnightly" | "monthly" | "weekly";

/** Mercury returns both ISO-like strings and Unix epoch milliseconds across endpoints. */
export type MercuryDateValue = number | string;
/** Mercury occasionally serialises booleans as strings (for example, "true"). */
export type MercuryBooleanValue = boolean | string;

export type AssetLiabilityType = "account" | "realEstate" | "vehicle" | "standard";

export type CountryCode =
  | "AD" | "AE" | "AF" | "AG" | "AI" | "AL" | "AM" | "AN" | "AO" | "AQ" | "AR" | "AS" | "AT" | "AU" | "AW" | "AX" | "AZ"
  | "BA" | "BB" | "BD" | "BE" | "BF" | "BG" | "BH" | "BI" | "BJ" | "BL" | "BM" | "BN" | "BO" | "BQ" | "BR" | "BS" | "BT" | "BV" | "BW" | "BY" | "BZ"
  | "CA" | "CC" | "CD" | "CF" | "CG" | "CH" | "CI" | "CK" | "CL" | "CM" | "CN" | "CO" | "CR" | "CU" | "CV" | "CW" | "CX" | "CY" | "CZ"
  | "DE" | "DJ" | "DK" | "DM" | "DO" | "DZ"
  | "EC" | "EE" | "EG" | "EH" | "ER" | "ES" | "ET"
  | "FI" | "FJ" | "FK" | "FM" | "FO" | "FR"
  | "GA" | "GB" | "GD" | "GE" | "GF" | "GG" | "GH" | "GI" | "GL" | "GM" | "GN" | "GP" | "GQ" | "GR" | "GS" | "GT" | "GU" | "GW" | "GY"
  | "HK" | "HM" | "HN" | "HR" | "HT" | "HU"
  | "ID" | "IE" | "IL" | "IM" | "IN" | "IO" | "IQ" | "IR" | "IS" | "IT"
  | "JE" | "JM" | "JO" | "JP"
  | "KE" | "KG" | "KH" | "KI" | "KM" | "KN" | "KP" | "KR" | "KW" | "KY" | "KZ"
  | "LA" | "LB" | "LC" | "LI" | "LK" | "LR" | "LS" | "LT" | "LU" | "LV" | "LY"
  | "MA" | "MC" | "MD" | "ME" | "MF" | "MG" | "MH" | "MK" | "ML" | "MM" | "MN" | "MO" | "MP" | "MQ" | "MR" | "MS" | "MT" | "MU" | "MV" | "MW" | "MX" | "MY" | "MZ"
  | "NA" | "NC" | "NE" | "NF" | "NG" | "NI" | "NL" | "NO" /* fixed: spec had `false` */ | "NP" | "NR" | "NU" | "NZ"
  | "OM"
  | "PA" | "PE" | "PF" | "PG" | "PH" | "PK" | "PL" | "PM" | "PN" | "PR" | "PS" | "PT" | "PW" | "PY"
  | "QA"
  | "RE" | "RO" | "RS" | "RU" | "RW"
  | "SA" | "SB" | "SC" | "SD" | "SE" | "SG" | "SH" | "SI" | "SJ" | "SK" | "SL" | "SM" | "SN" | "SO" | "SR" | "SS" | "ST" | "SV" | "SX" | "SY" | "SZ"
  | "TC" | "TD" | "TF" | "TG" | "TH" | "TJ" | "TK" | "TL" | "TM" | "TN" | "TO" | "TR" | "TT" | "TV" | "TW" | "TZ"
  | "UA" | "UG" | "UM" | "US" | "UY" | "UZ"
  | "VA" | "VC" | "VE" | "VG" | "VI" | "VN" | "VU"
  | "WF" | "WS"
  | "YE" | "YT"
  | "ZA" | "ZM" | "ZW";

// ---------- PartnerConfig ----------

export interface PartnerConfig {
  uniqueId?: string;
  partnerId?: string;
  key?: string;
  value?: string;
  primaryBg?: string;
  secondaryBg?: string;
  defaultBg?: string;
  primaryFont?: string;
  secondaryFont?: string;
  defaultFont?: string;
  vbInherit?: number;
}

// ---------- Contact ----------

export type ContactTitle = "Dr" | "Miss" | "Ms" | "Mr" | "Mrs" | "Prof" | "Rev";

export type MaritalStatus =
  | "Single" | "Married" | "DeFacto" | "Separated" | "Divorced" | "Widowed" | "Other";

export type Gender = "M" | "F";

export type EmploymentStatusContact =
  | "Full Time" | "Part Time" | "Contract" | "Temporary" | "Commission"
  | "Seasonal" | "Casual" | "Self-Employed" | "Unemployed";

export type PhoneDisplayType =
  | "Business" | "Business 2" | "Business Fax" | "Home" | "Home 2" | "Home Fax" | "Mobile" | "Mobile 2";

export interface Contact {
  uniqueId?: string;
  company?: string;
  isDeleted?: boolean; // filter isDeleted=false on all searches
  deletedBy?: string;
  deletedOn?: MercuryDateValue; // live: epoch ms or string
  createdOn?: MercuryDateValue; // live: epoch ms or string
  createdBy?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  salutation?: string;
  title?: ContactTitle;
  occupation?: string;
  employer?: string;
  jobTitle?: string;
  maritalStatus?: MaritalStatus;
  driversLicenceNumber?: string;
  driversLicenceExpiry?: string; // date
  driversLicenceState?: AuState;
  gender?: Gender;
  dateOfBirth?: MercuryDateValue; // live: epoch ms or string
  employmentStatus?: EmploymentStatusContact;
  employmentCommenced?: string; // date
  phoneDisplayType1?: PhoneDisplayType;
  phoneDisplayType2?: PhoneDisplayType;
  phoneDisplayType3?: PhoneDisplayType;
  phoneDisplayType4?: PhoneDisplayType;
  addressDisplay?: string;
  homePhone?: string;
  businessPhone?: string;
  mobile?: string;
  email?: string;
  personDataType?: string;
  notes?: string;
  relationshipManager?: string;
  annualSalary?: number;
  contactType?: string;
  abn?: string;
  acn?: string;
  trustName?: string;
  homeSuburb?: string;
  numberOfDependents?: number;
  doNotMail?: boolean;
  funambolUsers?: string;
  markAsPrivate?: boolean;
  importDocumentId?: string;
  partnerName?: string;
  emailBounced?: boolean;
  /** never log this field */
  webPassword?: string;
  webAccess?: boolean;
  relationshipManagerName?: string;
  lastUpdated?: MercuryDateValue; // live: epoch ms or string
  lastUpdatedBy?: string;
  externalId?: string;
  leadSourceId?: string; // iConnect only
  leadSourceName?: string; // iConnect only
  contactMethods?: ContactMethod[];
  /** note: capitalized, inconsistent with sibling array fields (spec quirk) */
  Identification?: Identification[];
  expenses?: Expense[];
  incomes?: Income[];
  addresses?: Address[];
  categories?: Category[];
  myMarketingTactics?: MyMarketingTactics[];

  // Confirmed live read fields absent from the Swagger schema.
  activeCampaignId?: string;
  citizenshipCountry?: CountryCode | string;
  companyRegisteredIn?: CountryCode | string;
  companyType?: string;
  countryOfResidency?: CountryCode | string;
  dateOfBirthDisplay?: string;
  deletedByDisplay?: string;
  employments?: Employment[];
  fullName?: string;
  /** Live API casing; retain `Identification` above only for legacy callers. */
  identifications?: Identification[];
  isPermanentResident?: boolean;
  motherMaidenName?: string;
  residencyStatus?: string;
  salutationOrFirstName?: string;
  syncToDMH?: boolean;
  webAddress?: string;
}

// ---------- ContactMethod ----------

export type ContactMethodEnum =
  | "Business" | "Business 2" | "Business Fax" | "Email 1" | "Email 2" | "Email 3"
  | "Home" | "Home 2" | "Home Fax" | "Mobile" | "Mobile 2";

export type ContactMethodType = "email" | "home" | "mobile" | "phone";

export interface ContactMethod {
  uniqueId?: string;
  company?: string;
  isDeleted?: boolean;
  personID?: string;
  contactMethod?: ContactMethodEnum;
  content?: string;
  type?: ContactMethodType;
  modified?: MercuryDateValue;
}

// ---------- Identification ----------

export type DocumentStatus = "Original" | "Certified";

export type DocumentType =
  | "DriversLicenceAust" | "GovtIssuePilotLicence" | "BirthCertificate" | "PassportAust" | "PassportIntl"
  | "ProofOfAgeCard" | "BirthCertAust" | "BirthCertIntl" | "AustCitizenshipCertificate" | "GovtIssueHealthCard"
  | "GovtPensionCard" | "DriversLicenceIntl" | "CitizenCertIntl" | "PassportExpired" | "BankCreditCard"
  | "FinInstCreditCard" | "BankCashCard" | "FinInstCashCard" | "BankPassbook" | "FinInstPassbook"
  | "BankStatement" | "DeedPoll" | "DefForceIdentityCard" | "ExistingCustomer" | "GovtIssueBoatLicence"
  | "GovtIssueEmployeeCard" | "GovtIssueFinancialBenNot" | "GovtIssueGunLicence" | "IdentityCard"
  | "IDFromCurrEmployer" | "LeaseContract" | "LetterFromCurrEmployer" | "MarriageCertificate" | "MedicareCard"
  | "OfficialStudentCard" | "PublicServiceIDCard" | "RateNotice" | "Reference" | "RentReceipt"
  | "SecGuardIDCard" | "SchoolLetterOfIntro" | "StatementFromLandlord" | "TaxationNoticeAust"
  | "TertiaryStudentIDCard" | "UtilityStatementElectric" | "UtilityStatementGas" | "UtilityStatementPhone"
  | "UtilityStatementWater" | "WrittenRefCustomer" | "WrittenRefFinancialInst" | "WrittenRefReferee";

export interface Identification {
  uniqueId?: string;
  company?: string;
  createdBy?: string;
  createdOn?: string; // date-time
  documentIssuedBy?: string;
  documentNumber?: string;
  endDate?: string; // date-time, expiry
  isDeleted?: boolean;
  parentId?: string;
  nameOnDocument?: string;
  personId?: string;
  placeOfIssue?: AuState;
  startDate?: string; // date-time
  versionSighted?: DocumentStatus;
  documentType?: DocumentType;
  source?: string;
  licenseCardNumber?: string;
}

// ---------- Expense ----------

export type ExpenseType =
  | "Credit Card" | "Home Loan" | "Investment Loan" | "Car Loan" | "Personal Loan"
  | "Maintenance" | "Rent Paid" | "Living Expenses" | "Education" | "Insurance" | "Other";

export interface Expense {
  uniqueId?: string;
  company?: string;
  isDeleted?: boolean;
  personID?: string;
  personName?: string;
  amount?: number;
  type?: ExpenseType;
  frequency?: Frequency;
  balance?: number;
  creditLimit?: number;
  comment?: string;
}

// ---------- Employment ----------

export interface Employment {
  uniqueId?: string;
  employerName?: string;
  /** free text — e.g. Full time, Part time */
  employmentBasis?: string;
  /** free text — e.g. Primary, Secondary, Previous */
  employmentStatus?: string;
  /** free text — e.g. Payg, self employment */
  employmentType?: string;
  jobTitle?: string;
  natureOfBusiness?: string;
  operatingStructure?: string;
  /** free text — e.g. Public, Private */
  paygEmployerType?: string;
  abn?: string;
  personId?: string;
  role?: string;
  startDate?: string; // date
  endDate?: string; // date
  onBenefits?: boolean;
  onProbation?: boolean;
  student?: boolean;
  incomes?: Income[];
  address?: Address;
  email?: string;
  firstName?: string;
  homeDuties?: string;
  phoneNumber?: string;
  surname?: string;
  title?: string;
}

// ---------- Income ----------

export type IncomeType =
  | "Bonus" | "Business Income" | "Dividends" | "Family Allowance" | "Maintenance"
  | "Overtime" | "Pension" | "Rental" | "Salary" | "Self Employed" | "Other";

export interface Income {
  uniqueId?: string;
  company?: string;
  isDeleted?: boolean;
  personID?: string;
  personName?: string;
  amount?: number;
  type?: IncomeType;
  frequency?: Frequency;
  dateCommenced?: string; // date
  sortKey?: number;
  comment?: string;
  /** Live API uses this casing on some endpoints. */
  parentId?: string;
  personId?: string;
}

// ---------- Opportunity ----------

export type OpportunityCategory =
  | "Loan" | "CommercialLoans" | "PlantAndEquipment" | "PersonalLoans" | "Property"
  | "FinancialPlanning" | "Insurance" | "LifeInsurance" | "Accounting" | "TermDeposit"
  | "PremiumFunding" | "CreditCard" | "CashManagementAcc";

export type OpportunityTranxType =
  | "Pre-Approval" | "Purchase" | "Refinance" | "Top Up" | "Variation";

/**
 * Live Finhub Mercury CRM loan pipeline statuses (pulled via list_loan_statuses MCP tool,
 * 2026-07-17) — the spec left Opportunity.status as free text with no enum, but production
 * data is constrained to exactly these 30 values. Note en-dashes (–), not hyphens, where present.
 */
export type LoanStatusActive =
  | "1. Lead – Discovery"
  | "2. Strategy Appointment Booked & Client Center Portal Send to Clients"
  | "2.1 Appointment Conduct & Completed"
  | "2.2 Follow-Up Required"
  | "2.3 Follow Up Opportunities"
  | "3.0 Awaiting Client Documents"
  | "3.1 Documents Received & Uploaded"
  | "4. Lender Selection & Policy Review"
  | "5. Loan Proposal Sent to Client Via Email"
  | "5.1 Prepare For Application Lodgement"
  | "6. Application Submitted to Lender"
  | "6.1 Lender Queries / Outstanding Items (MIR)"
  | "6.2 Pre-Approval Issued"
  | "6.3. Unconditional Approval Issued"
  | "7.0. Loan Documents Issued"
  | "7.1 Documents Returned & Certified"
  | "8.0 Ready for Settlement"
  | "8.1 Settled/Funded"
  | "8.2 Settled – Commission Paid"
  | "8.3 Construction Loan – Progress Payments"
  | "8.4 Loan Currently In Arrear"
  | "9.0 Financial Passport Invite Sent"
  | "9.1 Financial Passport Invite -Active"
  | "9.2 Financial Passport Invite -Expired"
  | "9.3 Mortgage Review – 24 Month"
  | "9.4 Mortgage Review – 30 Month"
  | "9.5 Mortgage Review – 36 Month";

export type LoanStatusInactive =
  | "12. Loan Discharged"
  | "13. Declined by Lender"
  | "14. Client Not Proceeding";

export type LoanStatus = LoanStatusActive | LoanStatusInactive;

/**
 * Live Finhub contact category names (pulled via list_contact_categories MCP tool, 2026-07-17).
 * Three families: PREF - * (comms preference), FREQ - * (contact frequency), REVIEW - * (review cadence).
 * Category.categoryName is free text in the spec — this union reflects actual production values,
 * not a spec-enforced constraint, so don't use it to validate incoming API responses.
 */
export type FinhubContactCategoryName =
  | "REVIEW - Client Will Call"
  | "PREF - Loan Reminders"
  | "FREQ - Important Only"
  | "PREF - Property Market"
  | "FREQ - Half Yearly"
  | "REVIEW - 24 Monthly"
  | "PREF - Ad Hoc Only"
  | "PREF - RBA Updates"
  | "REVIEW - 12 Monthly"
  | "PREF - Lender News"
  | "FREQ - Monthly"
  | "FREQ - Quarterly"
  | "PREF - Investment Property"
  | "PREF - First Home Buyer"
  | "REVIEW - 6 Monthly";

export interface Opportunity {
  uniqueId?: string;
  company?: string;
  isDeleted?: boolean;
  deletedBy?: string;
  /** live production returns Unix epoch ms (number), not the date-time string the spec declares */
  deletedOn?: number | string;
  /** live production returns Unix epoch ms (number), not the date-time string the spec declares */
  createdOn?: number | string;
  createdBy?: string;
  opportunityName?: string;
  amount?: number;
  lender?: string;
  lenderNameShort?: string;
  /** free text in spec; constrained to LoanStatus in live Finhub Mercury CRM data */
  status?: LoanStatus | (string & {});
  agent?: string; // CA number
  personActing?: string; // CA number
  personResponsible?: string; // CA number
  lenderReference?: string;
  financeDate?: string; // date-time
  expectedSettlementDate?: string; // date-time
  confirmedSettlementDate?: string; // date-time
  leadSourceId?: string;
  leadSourceDisplay?: string;
  discount?: number;
  existingAmount?: number;
  lmi?: number;
  settlementDateConfirmed?: boolean;
  discountType?: string;
  loanPersonRelationship?: string;
  transactionType?: OpportunityCategory;
  notePadText?: string;
  partnerReference?: string;
  nextGenId?: string;
  parentId?: string;
  workspaceUsers?: string; // CA numbers
  tranxType?: OpportunityTranxType;
  connectiveLodgeId?: string;
  peResidualAmount?: number;
  peRepaymentAmount?: number;
  peEffectiveRate?: number;
  peInterestRate?: number;
  peBrokerage?: number;
  assetDescription?: string;
  nextAction?: string; // date-time
  loanTerm?: number;
  fixedRateExpiry?: string; // date-time
  depositDueDate?: string; // date-time
  barCodeId?: string;
  agentName?: string;
  personActingName?: string;
  personResponsibleName?: string;
  defaultPath?: string;
  partnerName?: string;
  partnerSharedWithId?: string;
  partnerSharedWithName?: string;
  /** live production returns Unix epoch ms (number), not the date-time string the spec declares */
  statusLastUpdated?: number | string;
  lastUpdatedBy?: string;
  lenderComments?: string;
  sitRep?: string;
  campaignId?: string;
  campaignName?: string;
  securityValue?: number;
  aliApplicationId?: string;
  metlifeApplicationId?: string;
  interestOnlyExpiry?: string; // date-time
  /** live production returns Unix epoch ms (number), not the date-time string the spec declares */
  lastUpdated?: number | string;
  emailAccountAddress?: string;
  originationFee?: number;
  /** semicolon-separated list of categories */
  metaData?: string;
  relatedParties?: RelatedParty[];
  assets?: Asset[];
  liabilities?: Liability[];

  // ---- Fields confirmed present on live production records but absent from the
  // ---- Swagger spec entirely (discovered 2026-07-17 via live GET, schema-only). ----
  deletedByDisplay?: string;
  lenderDisplayName?: string;
  peResidualPercentage?: number;
  peFinanceType?: string;
  peAssetType?: string;
  peBuildYear?: string;
  agentEmail?: string;
  salePrice?: number;
  referrerFee?: number;
  docFee?: number;
  invoiceId?: string;
  invoicePaymentReceived?: boolean;
  invoicePersonName?: string;
  invoicePersonAddress?: string;
  invoiceBrokerReference?: string;
  invoiceCafStatus?: string;
  applicationPlatform?: string;
  /** item shape unconfirmed — empty in the sample record used for discovery */
  otherLoanPeople?: unknown[];
  /** item shape unconfirmed — likely links an Asset to the Liability it secures */
  assetLiabilityLinks?: unknown[];

  // Confirmed live read fields absent from the Swagger schema.
  assetCategory?: string;
  assetSource?: string;
  confirmedSettlementDateDisplay?: string;
  dischargeDate?: string;
  dischargeReason?: string;
  emailId?: string;
  extSource?: string;
  isNCCPEnabled?: MercuryBooleanValue;
  loanAccountNumber?: string;
  nextActionDisplay?: string;
  nextActionPerson?: string;
  opportunitySubtype?: string;
  preApprovalExpiry?: string;
  primaryUse?: string;
  purchasePrice?: number;
  settlementOfficer?: string;
  submittedToLenderDate?: MercuryDateValue;
}

// ---------- Address ----------

export type HousingSituation =
  | "Boarding" | "Caravan" | "Own Home" | "Own Home - Mortgage" | "Renting" | "With Parents" | "Other";

export interface Address {
  uniqueId?: string;
  company?: string;
  isDeleted?: boolean;
  deletedBy?: string;
  deletedOn?: string; // date-time
  parentType?: string;
  parentId?: string;
  /** Alternate live casing, returned alongside `parentId` by some endpoints. */
  parentID?: string;
  /** free text — residence type */
  type?: string;
  streetName?: string;
  streetNumber?: string;
  streetType?: string;
  city?: string;
  state?: AuState;
  postcode?: string;
  country?: CountryCode;
  unitNumber?: string;
  buildingName?: string;
  floorNumber?: string;
  isCorrespondenceAddress?: boolean;
  fromDate?: string; // date-time
  toDate?: string; // date-time
  addressBlock?: string;
  format?: string;
  housingSituation?: HousingSituation;
  requiresConfirmation?: boolean;
  poBoxNumber?: string;
  poBoxType?: string;
  personName?: string;
  addrGeoLatitude?: string;
  addrGeoLongitude?: string;
}

// ---------- RelatedParty ----------

export type RelatedPartyRelationship =
  | "Adviser" | "Agent" | "Primary applicant" | "Secondary applicant" | "Assessor"
  | "Bank / Lender" | "Banker" | "Broker" | "Builder" | "Accountant" | "Conveyancer"
  | "Solicitor" | "Co-Applicant" | "Director" | "Employer" | "Financial Planner"
  | "Insurance referral" | "Insurer" | "Joint Borrower" | "JSG/ PRE" | "Land Agent"
  | "Lender" | "Loan Writer" | "NonApplicant" | "Other";

export interface RelatedParty {
  uniqueId?: string;
  isDeleted?: boolean;
  /** mandatory when adding a related party */
  personID?: string;
  relationship?: RelatedPartyRelationship;

  // Hydrated relation fields returned by GET; treat as read-only until write-tested.
  addressBlock?: string;
  addressId?: string;
  dateOfBirth?: MercuryDateValue;
  email?: string;
  firstName?: string;
  fullName?: string;
  gender?: Gender;
  housingSituation?: HousingSituation;
  lastName?: string;
  middleName?: string;
  mobile?: string;
  salutation?: string;
}

// ---------- Asset ----------

export type AssetName =
  | "Real Estate" | "Boat" | "Business Equity" | "Cash Management" | "Charge Over Cash"
  | "Cheque Account" | "Debenture Charge" | "Gifts" | "Guarantee" | "Home Contents"
  | "Investment Savings" | "Life Insurance" | "Managed Funds" | "Motor Vehicle"
  | "Savings Account" | "Shares" | "Superannuation" | "Term Deposit" | "Other";

export type ValueBasis = "Applicant Estimate" | "Certified Valuation" | "Actual Value";

export type RealEstatePurpose = "Owner Occupied" | "Investment";

export interface Asset {
  uniqueId?: string;
  company?: string;
  isDeleted?: boolean;
  deletedBy?: string;
  deletedOn?: string; // date-time
  parentType?: string; // default "Asset"
  parentId?: string;
  name?: AssetName;
  type?: AssetLiabilityType;
  value?: number;
  valueBasis?: ValueBasis;
  /** also used to carry motorVehicleMake on write when type is Motor Vehicle */
  details?: string;
  institution?: string;
  accountName?: string;
  accountNumber?: string;
  accountBSB?: string;
  realEstateUseAsSecurity?: boolean;
  realEstatePurpose?: RealEstatePurpose;
  realEstateZoning?: string;
  address?: Address;
  realEstateToBePurchased?: boolean;
  realEstateRentalIncome?: number;
  realEstateRentalIncomeFrequency?: FrequencyLower;
  realEstateRentalEvidenceOfTenancy?: boolean;
  existingMortgageCreditor?: string;
  existingMortgageInterestRate?: number;
  existingMortgageBalance?: number;
  existingMortgageRepayment?: number;
  existingMortgageRepaymentFrequency?: FrequencyLower;
  existingMortgageRepaymentClearing?: boolean;
  /** free text */
  motorVehicleType?: string;
  /** sic: spec typo, missing "l" (motorVehicleYear) */
  motorVehiceYear?: string;
  /** display-only; use `details` field for writes */
  motorVehicleMake?: string;

  existingMortgageRemainingLoanTerm?: number;
  investmentCost?: number;
  investmentCostFrequency?: FrequencyLower;
  otherAssetsToBePurchased?: boolean;
  otherAssetsUseAsSecurity?: boolean;
  propertyStatus?: string;
  propertyTitleType?: string;
  propertyType?: string;
  proposedLoanAmount?: number;
  proposedLvr?: number;
  realEstateFinanceType?: string;
  servicingAddress?: Address;
  /** Item shape has not yet been observed populated. */
  valueObjectOwnershipList?: unknown[];
}

// ---------- Liability ----------

export type LiabilityName =
  | "Commercial Bill" | "Credit Card" | "HECS" | "Hire Purchase" | "Lease" | "Line Of Credit"
  | "Loan As Guarantor" | "Maintenance" | "Mortgage Loan" | "Other Loan" | "Outstanding Taxation"
  | "Overdraft" | "Personal Loan" | "Store Card" | "Term Loan" | "Other";

export type CreditCardType = "Amex" | "Diners" | "Mastercard" | "Visa";

export interface Liability {
  uniqueId?: string;
  company?: string;
  isDeleted?: boolean;
  deletedBy?: string;
  deletedOn?: string; // date-time
  parentType?: string;
  parentId?: string;
  name?: LiabilityName;
  type?: AssetLiabilityType;
  value?: number;
  details?: string;
  limit?: number;
  institution?: string;
  accountName?: string;
  accountNumber?: string;
  accountBSB?: string;
  accountRepayment?: number;
  accountRepaymentFrequency?: FrequencyLower;
  creditCardType?: CreditCardType;
  accountClearingFromLoan?: boolean;
  interestRate?: number;
  nextGenData?: string;
  priority?: number;
  remainingTerm?: number;
  /** Item shape has not yet been observed populated. */
  valueObjectOwnershipList?: unknown[];
}

// ---------- Category / MyMarketingTactics ----------

export interface Category {
  uniqueId?: string;
  /** free text in spec; live Finhub values follow FinhubContactCategoryName's PREF-/FREQ-/REVIEW- convention */
  categoryName?: FinhubContactCategoryName | (string & {});
  categoryNotes?: string;
  activeCampaignId?: string;
  company?: string;
  readonly?: boolean;
  vbInherit?: number;
}

export interface MyMarketingTactics {
  uniqueId?: string;
  itemName?: string;
}

// ---------- Search results ----------

export interface SearchResult<T> {
  totalCount?: number;
  count?: number;
  offset?: number;
  /** undocumented in spec; observed on live Opportunity search responses (2026-07-17) */
  volume?: number;
  results?: T[];
}

export type OpportunitySearchResult = SearchResult<Opportunity>;
export type ContactSearchResult = SearchResult<Contact>;
export type PartnerConfigSearchResult = SearchResult<PartnerConfig>;
export type CategorySearchResult = SearchResult<Category>;

// ---------- Error / Success ----------

export interface MercuryError {
  code?: number;
  contactEmail?: string;
  description?: string;
  homeRef?: string;
  reasonPhrase?: number;
  uri?: string;
}

export interface MercurySuccess {
  status?: number;
  uniqueId?: string;
}

// ---------- Search params ----------

export interface OpportunitySearchParams {
  name?: string;
  isDeleted?: boolean; // default false
  statuses?: string[];
  lastUpdated?: string; // yyyy-mm-dd[ HH:MM:SS], supports ranges
  transactionType?: string; // default "all"
  user?: string; // CA number
  createdOn?: string;
  interestOnlyExpiry?: string;
  fixedRateExpiry?: string;
  confirmedSettlementDate?: string;
}

export interface PartnerConfigSearchParams {
  key?: string;
  partnerId?: string;
}

export interface ContactSearchParams {
  name?: string;
  isDeleted?: boolean; // default false
  excludeDoNotMail?: boolean; // default false
  excludeEmailBounced?: boolean; // default false
  lastUpdated?: string;
  companyName?: string;
  personType?: string;
  categoryId?: string;
  campaignId?: string;
  contactNumber?: string;
  email?: string;
  createdOn?: string;
  dateOfBirth?: string;
  birthday?: string;
}

// ---------- Webhooks ----------

export type ContactWebhookSubscriptionType =
  | "All available contacts" | "Contacts in my branch/office" | "Contacts where I am the relationship manager";

export type ContactWebhookEvent = "Created" | "Created or updated" | "Deleted";

export interface ContactHookRequestBody {
  active?: boolean; // default true
  name?: string; // default "web"
  config?: {
    subscription_type?: ContactWebhookSubscriptionType;
    content_type?: string; // default "json"
    url?: string;
  };
  event?: ContactWebhookEvent; // default "Created"
}

export type OpportunityWebhookSubscriptionType =
  | "All available opportunities" | "Opportunities in my branch/office"
  | "Opportunities where I am the agent" | "Opportunities where I am the admin/supervisor";

export type OpportunityWebhookEvent =
  | "Created" | "Created or updated" | "Deleted" | "Opportunity Status Changed";

export interface OppHookRequestBody {
  active?: boolean; // default true
  name?: string; // default "web"
  config?: {
    subscription_type?: OpportunityWebhookSubscriptionType;
    content_type?: string; // default "json"
    url?: string;
  };
  event?: OpportunityWebhookEvent; // default "Created"
}

export interface WebhookCreationResponse {
  type?: string;
  id?: number;
  name?: string;
  active?: boolean;
  events?: string[];
  config?: {
    content_type?: string;
    url?: string;
  };
  updated_at?: string;
  created_at?: string;
  url?: string;
  test_url?: string;
  ping_url?: string;
  last_response?: {
    code?: string;
    status?: string;
    message?: string;
  };
}

// ---------- Extension endpoints (undocumented in Swagger spec) ----------

export type LivingExpenseType =
  | "Clothing & Personal Care" | "Child & Spouse Maintenance" | (string & {});

/** One split of ownership/attribution across a linked contact, by percentage. */
export interface ExtensionSplit {
  personId?: string;
  percent?: number;
}

/** A single line item inside the JSON-stringified `value` array on an extension record. */
export interface LivingExpenseLineItem {
  /** client-generated UUID v4 for new items */
  uniqueId?: string;
  amount?: string; // note: string, not number, per observed payloads
  type?: LivingExpenseType;
  frequency?: Frequency;
  /** if omitted on write, ownership is split evenly across linked contacts */
  splits?: ExtensionSplit[];
}

export interface OtherIncomeLineItem {
  uniqueId?: string;
  amount?: string;
  type?: IncomeType | (string & {});
  frequency?: Frequency;
  splits?: ExtensionSplit[];
}

/**
 * Shape of the raw extension record. `value` is a JSON-encoded string (not structured JSON) —
 * parse it client-side into LivingExpenseLineItem[] / OtherIncomeLineItem[], and re-stringify
 * the FULL array before PUT (destructive full-replace, no partial update).
 */
export interface OpportunityExtensionRecord {
  uniqueId?: string;
  parentType?: "loan" | (string & {});
  parentId?: string;
  key?: "livingExpense" | "otherIncome" | (string & {});
  /** JSON.stringify(LivingExpenseLineItem[] | OtherIncomeLineItem[]) */
  value?: string;
}
