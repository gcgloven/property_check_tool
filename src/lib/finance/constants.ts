// Singapore property policy defaults (v0.0.0).
// These are configurable constants — surface them in the UI so users can override
// when policy changes. Rates reflect publicly known 2023+ residential rules.

/** Loan-to-Value for 1st housing loan. 25% down payment. */
export const DEFAULT_LTV = 0.75;

/** Minimum cash portion of the down payment (rest can be CPF). */
export const MIN_CASH_DOWN = 0.05;

/** Max private property loan tenure (years). */
export const MAX_LOAN_TENURE = 30;

/** TDSR cap as a fraction of gross monthly income. */
export const TDSR_CAP = 0.55;

/** Stress-test interest rate used for TDSR affordability. */
export const TDSR_STRESS_RATE = 0.04;

/** Buyer's Stamp Duty (BSD) tiered bands for residential property. */
export const BSD_BANDS: ReadonlyArray<{ upTo: number; rate: number }> = [
  { upTo: 180_000, rate: 0.01 },
  { upTo: 360_000, rate: 0.02 },
  { upTo: 1_000_000, rate: 0.03 },
  { upTo: 1_500_000, rate: 0.04 },
  { upTo: 3_000_000, rate: 0.05 },
  { upTo: Infinity, rate: 0.06 },
];

export type BuyerProfile = "citizen" | "pr" | "foreigner";

/** ABSD rates by buyer profile and the number of residential properties owned (the nth purchase). */
export const ABSD_RATES: Record<BuyerProfile, { first: number; second: number; third: number }> = {
  citizen: { first: 0.0, second: 0.2, third: 0.3 },
  pr: { first: 0.05, second: 0.3, third: 0.35 },
  foreigner: { first: 0.6, second: 0.6, third: 0.6 },
};

/** Default new-launch (BUC) progressive payment schedule. */
export const PROGRESSIVE_PAYMENT_SCHEDULE: ReadonlyArray<{ stage: string; pct: number }> = [
  { stage: "Booking (OTP)", pct: 0.05 },
  { stage: "S&P signing", pct: 0.15 },
  { stage: "Foundation", pct: 0.1 },
  { stage: "Reinforced concrete framework", pct: 0.1 },
  { stage: "Partition walls", pct: 0.05 },
  { stage: "Roofing / ceiling", pct: 0.05 },
  { stage: "Door / window frames", pct: 0.05 },
  { stage: "Carpark / roads / drains", pct: 0.05 },
  { stage: "TOP", pct: 0.25 },
  { stage: "CSC (legal completion)", pct: 0.15 },
];
