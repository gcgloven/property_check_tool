import type { BuyerProfile } from "./constants";

export type HoldingMode = "self-stay" | "rent-out";

/** Inputs for the resale (User Story 1) projection. */
export interface ResaleInputs {
  purchaseDate: string; // ISO date (DD/MM/YYYY captured in UI, stored as ISO)
  price: number;
  downPaymentPct: number; // 0..1
  interestRate: number; // annual, 0..1
  loanTenureYears: number;
  buyerProfile: BuyerProfile;
  propertyCount: 1 | 2 | 3; // nth purchase, drives ABSD
  mode: HoldingMode;
  monthlyRental: number;
  rentalGrowthPct: number; // annual, 0..1
  vacancyPct: number; // 0..1
  maintenancePct: number; // 0..1 of annual rental
  appreciationPct: number; // annual, 0..1
  horizonYears: number;
}

/** Inputs for the new-launch / BUC (User Story 2) projection. */
export interface NewLaunchInputs {
  todayMonth: string; // YYYY-MM
  topMonth: string; // YYYY-MM
  priceToday: number;
  preTopAppreciationPct: number; // annual, 0..1
  buyerProfile: BuyerProfile;
  propertyCount: 1 | 2 | 3;
  interestRate: number;
  loanTenureYears: number;
  estimatedRentalAtTop: number;
  rentalGrowthPct: number;
  postTopAppreciationPct: number;
  horizonYearsAfterTop: number;
  /** Rent the buyer currently pays (lives in a rental until TOP). */
  currentMonthlyRent: number;
  /** What the buyer does with the unit after TOP. */
  postTopMode: HoldingMode;
}

/** One row of a year-by-year projection. */
export interface ProjectionYear {
  year: number;
  propertyValue: number;
  outstandingLoan: number;
  equity: number;
  annualMortgage: number;
  netRentalCashflow: number;
  cumulativeCashflow: number;
  /** Cumulative principal paid to date as a share of the whole loan principal. */
  principalPaidPct: number;
  /** Cumulative interest paid to date as a share of the loan's total interest. */
  interestPaidPct: number;
}

/** Summary of a resale projection (User Story 1). */
export interface ResaleSummary {
  /** Down payment + BSD + ABSD paid upfront. */
  upfrontCashIn: number;
  downPayment: number;
  stampDuty: number;
  loanAmount: number;
  finalValue: number;
  finalEquity: number;
  /** Sum of yearly net operating cashflow over the horizon. */
  totalNetCashflow: number;
  /** finalEquity + totalNetCashflow - upfrontCashIn. */
  netPosition: number;
  /** netPosition / upfrontCashIn (simple return over the horizon). */
  totalReturnPct: number;
  rows: ProjectionYear[];
}

/** Summary of a new-launch / BUC projection (User Story 2). */
export interface NewLaunchSummary {
  yearsToTop: number;
  bookingCash: number;
  spPayment: number;
  stampDuty: number;
  /** Cash/CPF needed now (booking + S&P + stamp duty). */
  downPaymentNow: number;
  priceAtTop: number;
  estimatedRentalAtTop: number;
  /** Gross rental yield at TOP (annual rent / price at TOP). */
  rentalYieldAtTop: number;
  loanAmount: number;
  /** Total rent paid while renting until TOP (current rent 脳 months to TOP). */
  totalRentUntilTop: number;
  /** What the buyer does with the unit after TOP. */
  postTopMode: HoldingMode;
  /** Year-by-year projection starting from TOP. */
  postTopProjection: ProjectionYear[];
}

export interface UpfrontCosts {
  downPayment: number;
  bsd: number;
  absd: number;
  total: number;
}

/** A single buyer/co-owner in a purchase. */
export interface Buyer {
  profile: BuyerProfile;
  /** The nth residential property this purchase represents for this buyer (drives ABSD). */
  propertyCount: 1 | 2 | 3;
  /** Cash this buyer brings to the purchase. */
  cash: number;
  /** CPF this buyer brings to the purchase. */
  cpf: number;
}

/** A property purchase by one or two buyers. */
export interface PurchaseInputs {
  price: number;
  /** Fraction of price paid as down payment (e.g. 0.25). */
  downPaymentPct: number;
  /** One or two buyers (co-owners). */
  buyers: Buyer[];
}

/** How the down payment is funded from pooled cash and CPF. */
export interface FundingAllocation {
  cashUsed: number;
  cpfUsed: number;
  /** Amount of upfront cost not covered by available funds (0 if fully funded). */
  shortfall: number;
}

/** Pooled funds across all buyers. */
export interface PooledFunds {
  totalCash: number;
  totalCpf: number;
  total: number;
}

/** Full breakdown of the upfront cost of a purchase. */
export interface DownPaymentBreakdown {
  price: number;
  downPaymentPct: number;
  downPayment: number;
  /** Minimum cash required for the down payment (5% of price). */
  minCashRequired: number;
  loanAmount: number;
  bsd: number;
  absd: number;
  /** Down payment + BSD + ABSD. */
  totalUpfront: number;
  funds: PooledFunds;
  allocation: FundingAllocation;
}

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  code:
    | "BUYER_COUNT"
    | "DP_BELOW_MIN"
    | "CASH_BELOW_MIN"
    | "INSUFFICIENT_FUNDS"
    | "STAMP_DUTY_FUNDS";
  severity: ValidationSeverity;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}


// ── Downpayment Saving Projection types ──────────────────────────

/** A buyer in the downpayment saving projection (tracks savings, not property count). */
export interface SavingBuyer {
  name: string;
  currentCpf: number;
  currentCashSavings: number;
  extraSavings: number;
  monthlyCpfContribution: number;
  monthlyCashSaving: number;
}

/** Resale payment timeline assumptions. */
export interface TimelineInputs {
  optionFeePercent: number;
  exerciseFeePercent: number;
  otpExerciseDays: number;
  stampDutyDueDaysAfterExercise: number;
  completionWeeksAfterExercise: number;
}

export type ScenarioName = "conservative" | "baseCase" | "stretched";

export interface ScenarioOverrides {
  completionWeeksAfterExercise: number;
  legalFee: number;
}

/** Property inputs for the downpayment saving projection. */
export interface DownpaymentSavingPropertyInputs {
  squareFeet: number;
  psf: number;
  manualPropertyValueEnabled: boolean;
  manualPropertyValue: number;
  downpaymentPercent: number;
  legalFee: number;
}

/** Full persisted state for the Downpayment Saving Projection. */
export interface DownpaymentSavingState {
  property: DownpaymentSavingPropertyInputs;
  buyers: SavingBuyer[];
  timeline: TimelineInputs;
  scenario: ScenarioName;
}

/** One row in the payment stage timeline. */
export interface PaymentStage {
  stage: string;
  day: number;
  amount: number;
  description: string;
}

/** One row in the cashflow readiness table. */
export interface CashflowReadinessRow {
  stage: string;
  availableFunds: number;
  cumulativePaymentDue: number;
  surplusOrDeficit: number;
  status: "Ready" | "Not Ready";
}

/** All computed outputs from the downpayment saving engine. */
export interface DownpaymentSavingOutput {
  propertyValue: number;
  downpayment: number;
  stampDuty: number;
  legalFee: number;
  totalPaymentNeeded: number;
  combinedAvailableFunds: number;
  currentDeficit: number;
  combinedMonthlyCpf: number;
  combinedMonthlyCashSaving: number;
  combinedMonthlyAccumulation: number;
  monthsNeeded: number;
  paymentStages: PaymentStage[];
  cashflowReadiness: CashflowReadinessRow[];
  /** Whether the manual property value differs from sqft × psf. */
  hasPropertyValueMismatch: boolean;
  /** The computed value from sqft × psf (for the mismatch warning). */
  computedPropertyValue: number;
}