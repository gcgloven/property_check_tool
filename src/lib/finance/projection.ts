import { monthlyInstalment, outstandingBalance } from "./mortgage";
import { calcABSD, calcBSD } from "./stampDuty";
import { DEFAULT_LTV, PROGRESSIVE_PAYMENT_SCHEDULE } from "./constants";
import type {
  NewLaunchInputs,
  NewLaunchSummary,
  ProjectionYear,
  ResaleInputs,
  ResaleSummary,
} from "./types";

/**
 * Year-by-year cashflow projection for a resale property (User Story 1).
 *
 * Pure function — no React/Redux. Computes property value (compounded appreciation),
 * outstanding loan, equity, annual mortgage, and net rental cashflow per year.
 */
export function projectResale(input: ResaleInputs): ProjectionYear[] {
  const loanPrincipal = input.price * (1 - input.downPaymentPct);
  const pmt = monthlyInstalment(loanPrincipal, input.interestRate, input.loanTenureYears);
  const annualMortgage = pmt * 12;

  // Whole-loan totals, used as the denominators for the paid-down percentages.
  const totalMonths = input.loanTenureYears * 12;
  const totalInterest = pmt * totalMonths - loanPrincipal;

  const rows: ProjectionYear[] = [];
  let cumulative = 0;

  for (let year = 1; year <= input.horizonYears; year++) {
    const propertyValue = input.price * Math.pow(1 + input.appreciationPct, year);
    const outstandingLoan = outstandingBalance(
      loanPrincipal,
      input.interestRate,
      input.loanTenureYears,
      year * 12,
    );
    const equity = propertyValue - outstandingLoan;

    const monthsElapsed = Math.min(year * 12, totalMonths);
    const principalPaid = loanPrincipal - outstandingLoan;
    const interestPaid = pmt * monthsElapsed - principalPaid;
    const principalPaidPct = loanPrincipal > 0 ? principalPaid / loanPrincipal : 0;
    const interestPaidPct = totalInterest > 0 ? interestPaid / totalInterest : 0;

    let netRentalCashflow = 0;
    if (input.mode === "rent-out") {
      const grossAnnualRent =
        input.monthlyRental * 12 * Math.pow(1 + input.rentalGrowthPct, year - 1);
      const effectiveRent = grossAnnualRent * (1 - input.vacancyPct);
      const maintenance = effectiveRent * input.maintenancePct;
      netRentalCashflow = effectiveRent - maintenance - annualMortgage;
    } else {
      // self-stay: no rental income, mortgage is an outflow
      netRentalCashflow = -annualMortgage;
    }

    cumulative += netRentalCashflow;

    rows.push({
      year,
      propertyValue,
      outstandingLoan,
      equity,
      annualMortgage,
      netRentalCashflow,
      cumulativeCashflow: cumulative,
      principalPaidPct,
      interestPaidPct,
    });
  }

  return rows;
}

/**
 * Summarise a resale projection: upfront cash, final value/equity, total operating
 * cashflow, net position and a simple return over the horizon (User Story 1).
 */
export function summarizeResale(input: ResaleInputs): ResaleSummary {
  const rows = projectResale(input);
  const downPayment = input.price * input.downPaymentPct;
  const stampDuty = calcBSD(input.price) + calcABSD(input.price, input.buyerProfile, input.propertyCount);
  const upfrontCashIn = downPayment + stampDuty;
  const loanAmount = input.price * (1 - input.downPaymentPct);

  const last = rows[rows.length - 1];
  const finalValue = last?.propertyValue ?? input.price;
  const finalEquity = last?.equity ?? input.price - loanAmount;
  const totalNetCashflow = last?.cumulativeCashflow ?? 0;
  const netPosition = finalEquity + totalNetCashflow - upfrontCashIn;
  const totalReturnPct = upfrontCashIn > 0 ? netPosition / upfrontCashIn : 0;

  return {
    upfrontCashIn,
    downPayment,
    stampDuty,
    loanAmount,
    finalValue,
    finalEquity,
    totalNetCashflow,
    netPosition,
    totalReturnPct,
    rows,
  };
}

/** Number of whole months between two YYYY-MM strings (>= 0). */
export function monthsBetween(fromMonth: string, toMonth: string): number {
  const [fy, fm] = fromMonth.split("-").map(Number);
  const [ty, tm] = toMonth.split("-").map(Number);
  if (!fy || !fm || !ty || !tm) return 0;
  return Math.max(0, (ty - fy) * 12 + (tm - fm));
}

/**
 * Project a new-launch (BUC) purchase (User Story 2).
 *
 * Computes the cash needed now (booking + S&P + stamp duty), the estimated price at
 * TOP after pre-TOP appreciation, the gross rental yield at TOP, and a year-by-year
 * projection starting from TOP (loan based on the original purchase price).
 */
export function projectNewLaunch(input: NewLaunchInputs): NewLaunchSummary {
  const yearsToTop = monthsBetween(input.todayMonth, input.topMonth) / 12;

  const bookingPct = PROGRESSIVE_PAYMENT_SCHEDULE[0]?.pct ?? 0.05;
  const spPct = PROGRESSIVE_PAYMENT_SCHEDULE[1]?.pct ?? 0.15;
  const bookingCash = input.priceToday * bookingPct;
  const spPayment = input.priceToday * spPct;
  const stampDuty =
    calcBSD(input.priceToday) + calcABSD(input.priceToday, input.buyerProfile, input.propertyCount);
  const downPaymentNow = bookingCash + spPayment + stampDuty;

  const priceAtTop = input.priceToday * Math.pow(1 + input.preTopAppreciationPct, yearsToTop);
  const rentalYieldAtTop =
    priceAtTop > 0 ? (input.estimatedRentalAtTop * 12) / priceAtTop : 0;

  // The buyer rents elsewhere until TOP.
  const totalRentUntilTop = input.currentMonthlyRent * 12 * yearsToTop;
  const currentRentAnnual = input.currentMonthlyRent * 12;

  const loanAmount = input.priceToday * DEFAULT_LTV;
  const pmt = monthlyInstalment(loanAmount, input.interestRate, input.loanTenureYears);
  const annualMortgage = pmt * 12;

  // Whole-loan totals, used as the denominators for the paid-down percentages.
  const totalMonths = input.loanTenureYears * 12;
  const totalInterest = pmt * totalMonths - loanAmount;

  const postTopProjection: ProjectionYear[] = [];
  let cumulative = 0;
  for (let year = 1; year <= input.horizonYearsAfterTop; year++) {
    const propertyValue = priceAtTop * Math.pow(1 + input.postTopAppreciationPct, year);
    const outstandingLoan = outstandingBalance(
      loanAmount,
      input.interestRate,
      input.loanTenureYears,
      year * 12,
    );
    const equity = propertyValue - outstandingLoan;

    const monthsElapsed = Math.min(year * 12, totalMonths);
    const principalPaid = loanAmount - outstandingLoan;
    const interestPaid = pmt * monthsElapsed - principalPaid;
    const principalPaidPct = loanAmount > 0 ? principalPaid / loanAmount : 0;
    const interestPaidPct = totalInterest > 0 ? interestPaid / totalInterest : 0;

    let netRentalCashflow: number;
    if (input.postTopMode === "rent-out") {
      // Rent out the unit; the buyer still pays their own rent elsewhere.
      const grossAnnualRent =
        input.estimatedRentalAtTop * 12 * Math.pow(1 + input.rentalGrowthPct, year - 1);
      netRentalCashflow = grossAnnualRent - annualMortgage - currentRentAnnual;
    } else {
      // Self-stay: move into the unit, stop paying current rent, pay the mortgage.
      netRentalCashflow = -annualMortgage;
    }
    cumulative += netRentalCashflow;

    postTopProjection.push({
      year,
      propertyValue,
      outstandingLoan,
      equity,
      annualMortgage,
      netRentalCashflow,
      cumulativeCashflow: cumulative,
      principalPaidPct,
      interestPaidPct,
    });
  }

  return {
    yearsToTop,
    bookingCash,
    spPayment,
    stampDuty,
    downPaymentNow,
    priceAtTop,
    estimatedRentalAtTop: input.estimatedRentalAtTop,
    rentalYieldAtTop,
    loanAmount,
    totalRentUntilTop,
    postTopMode: input.postTopMode,
    postTopProjection,
  };
}
