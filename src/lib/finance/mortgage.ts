export interface AmortizationRow {
  month: number;
  interest: number;
  principal: number;
  balance: number;
}

/**
 * Monthly mortgage instalment using the standard amortization formula.
 * @param principal loan amount
 * @param annualRate annual interest rate as a fraction (e.g. 0.035)
 * @param tenureYears loan tenure in years
 */
export function monthlyInstalment(principal: number, annualRate: number, tenureYears: number): number {
  if (principal <= 0 || tenureYears <= 0) return 0;
  const n = tenureYears * 12;
  const r = annualRate / 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

/** Full amortization schedule (month-by-month). */
export function amortizationSchedule(
  principal: number,
  annualRate: number,
  tenureYears: number,
): AmortizationRow[] {
  const n = tenureYears * 12;
  const r = annualRate / 12;
  const pmt = monthlyInstalment(principal, annualRate, tenureYears);
  const rows: AmortizationRow[] = [];
  let balance = principal;
  for (let month = 1; month <= n; month++) {
    const interest = balance * r;
    const principalPaid = pmt - interest;
    balance = Math.max(0, balance - principalPaid);
    rows.push({ month, interest, principal: principalPaid, balance });
  }
  return rows;
}

/** Outstanding loan balance after a given number of months. */
export function outstandingBalance(
  principal: number,
  annualRate: number,
  tenureYears: number,
  monthsElapsed: number,
): number {
  if (monthsElapsed <= 0) return principal;
  const n = tenureYears * 12;
  if (monthsElapsed >= n) return 0;
  const r = annualRate / 12;
  if (r === 0) return Math.max(0, principal * (1 - monthsElapsed / n));
  const pmt = monthlyInstalment(principal, annualRate, tenureYears);
  const balance = principal * Math.pow(1 + r, monthsElapsed) - pmt * ((Math.pow(1 + r, monthsElapsed) - 1) / r);
  return Math.max(0, balance);
}
