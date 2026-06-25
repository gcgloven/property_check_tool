import { PROGRESSIVE_PAYMENT_SCHEDULE } from "./constants";

export interface ProgressivePaymentRow {
  stage: string;
  pct: number;
  amount: number;
  cumulativeAmount: number;
}

/**
 * Compute the BUC progressive payment cash outlay schedule for a given price.
 * @param schedule optional custom schedule, defaults to the standard SG schedule.
 */
export function progressivePaymentSchedule(
  price: number,
  schedule: ReadonlyArray<{ stage: string; pct: number }> = PROGRESSIVE_PAYMENT_SCHEDULE,
): ProgressivePaymentRow[] {
  let cumulative = 0;
  return schedule.map(({ stage, pct }) => {
    const amount = price * pct;
    cumulative += amount;
    return { stage, pct, amount, cumulativeAmount: cumulative };
  });
}
