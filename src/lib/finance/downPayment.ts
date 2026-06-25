import { DEFAULT_LTV, MIN_CASH_DOWN, type BuyerProfile } from "./constants";
import { calcABSD, calcABSDForBuyers, calcBSD } from "./stampDuty";
import type {
  DownPaymentBreakdown,
  PurchaseInputs,
  UpfrontCosts,
  ValidationIssue,
  ValidationResult,
} from "./types";

/** Minimum total down payment as a fraction of price (LTV-derived, 25%). */
export const MIN_DOWN_PAYMENT = 1 - DEFAULT_LTV;

/**
 * Estimate upfront cash/CPF needed to purchase: down payment + BSD + ABSD.
 * @param downPaymentPct fraction of price paid as down payment (default 0.25).
 */
export function estimateUpfront(
  price: number,
  profile: BuyerProfile,
  propertyCount: number,
  downPaymentPct = 0.25,
): UpfrontCosts {
  const downPayment = price * downPaymentPct;
  const bsd = calcBSD(price);
  const absd = calcABSD(price, profile, propertyCount);
  return {
    downPayment,
    bsd,
    absd,
    total: downPayment + bsd + absd,
  };
}

/** Minimum cash component of the down payment (rest may be CPF). */
export function minCashDown(price: number): number {
  return price * MIN_CASH_DOWN;
}

/**
 * Compute the upfront cost breakdown for a single- or joint-buyer purchase.
 *
 * Pools cash and CPF across buyers, computes BSD and the joint ABSD (highest
 * applicable rate among co-owners), and allocates funding: cash covers the 5%
 * minimum first, then CPF is used for the remainder of the down payment.
 */
export function breakdownDownPayment(inputs: PurchaseInputs): DownPaymentBreakdown {
  const { price, downPaymentPct, buyers } = inputs;

  const downPayment = price * downPaymentPct;
  const minCashRequired = minCashDown(price);
  const loanAmount = price * (1 - downPaymentPct);
  const bsd = calcBSD(price);
  const absd = calcABSDForBuyers(price, buyers);
  const totalUpfront = downPayment + bsd + absd;

  const totalCash = buyers.reduce((sum, b) => sum + b.cash, 0);
  const totalCpf = buyers.reduce((sum, b) => sum + b.cpf, 0);
  const totalFunds = totalCash + totalCpf;

  // CPF can fund at most (downPayment - minCashRequired); the 5% min must be cash.
  const cpfEligibleForDown = Math.max(0, downPayment - minCashRequired);
  const cpfUsed = Math.min(totalCpf, cpfEligibleForDown);
  const cashUsed = Math.min(totalCash, downPayment - cpfUsed);
  const shortfall = Math.max(0, totalUpfront - totalFunds);

  return {
    price,
    downPaymentPct,
    downPayment,
    minCashRequired,
    loanAmount,
    bsd,
    absd,
    totalUpfront,
    funds: { totalCash, totalCpf, total: totalFunds },
    allocation: { cashUsed, cpfUsed, shortfall },
  };
}

const sgd = (n: number) =>
  n.toLocaleString("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 0 });

/**
 * Validate a purchase against SG down-payment rules. Returns a UI-friendly result
 * (does not throw). Errors block the purchase; warnings are advisory.
 */
export function validatePurchase(inputs: PurchaseInputs): ValidationResult {
  const issues: ValidationIssue[] = [];
  const { price, downPaymentPct, buyers } = inputs;

  if (buyers.length < 1 || buyers.length > 2) {
    issues.push({
      code: "BUYER_COUNT",
      severity: "error",
      message: "A purchase must have one or two buyers.",
    });
  }

  if (downPaymentPct < MIN_DOWN_PAYMENT) {
    issues.push({
      code: "DP_BELOW_MIN",
      severity: "error",
      message: `Down payment must be at least ${Math.round(MIN_DOWN_PAYMENT * 100)}% of the price.`,
    });
  }

  const totalCash = buyers.reduce((sum, b) => sum + b.cash, 0);
  const totalCpf = buyers.reduce((sum, b) => sum + b.cpf, 0);
  const minCashRequired = minCashDown(price);
  const downPayment = price * downPaymentPct;
  const bsd = calcBSD(price);
  const absd = calcABSDForBuyers(price, buyers);
  const totalUpfront = downPayment + bsd + absd;

  if (totalCash < minCashRequired) {
    issues.push({
      code: "CASH_BELOW_MIN",
      severity: "error",
      message: `At least ${Math.round(MIN_CASH_DOWN * 100)}% of the price (${sgd(
        minCashRequired,
      )}) must be paid in cash.`,
    });
  }

  if (totalCash + totalCpf < downPayment) {
    issues.push({
      code: "INSUFFICIENT_FUNDS",
      severity: "error",
      message: `Cash and CPF (${sgd(totalCash + totalCpf)}) do not cover the down payment (${sgd(
        downPayment,
      )}). Short by ${sgd(downPayment - (totalCash + totalCpf))}.`,
    });
  } else if (totalCash + totalCpf < totalUpfront) {
    issues.push({
      code: "STAMP_DUTY_FUNDS",
      severity: "warning",
      message: `Funds cover the down payment but not the full upfront cost including stamp duties (${sgd(
        totalUpfront,
      )}).`,
    });
  }

  const valid = issues.every((i) => i.severity !== "error");
  return { valid, issues };
}

/**
 * Strict variant of {@link validatePurchase}: throws an Error if any validation
 * error is present (e.g. below-minimum down payment or cash).
 */
export function assertValidPurchase(inputs: PurchaseInputs): void {
  const result = validatePurchase(inputs);
  if (!result.valid) {
    const messages = result.issues
      .filter((i) => i.severity === "error")
      .map((i) => i.message)
      .join(" ");
    throw new Error(`Invalid purchase: ${messages}`);
  }
}
