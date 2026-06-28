import { calcABSDForBuyers, calcBSD } from "./stampDuty";
import type {
  CashflowReadinessRow,
  DownpaymentSavingOutput,
  DownpaymentSavingPropertyInputs,
  DownpaymentSavingState,
  PaymentStage,
  SavingBuyer,
  ScenarioName,
  ScenarioOverrides,
  TimelineInputs,
} from "./types";

const SCENARIO_MAP: Record<ScenarioName, ScenarioOverrides> = {
  conservative: { completionWeeksAfterExercise: 8, legalFee: 8000 },
  baseCase: { completionWeeksAfterExercise: 12, legalFee: 6000 },
  stretched: { completionWeeksAfterExercise: 16, legalFee: 6000 },
};

/** Apply scenario overrides to the given timeline & legal fee. */
export function applyScenarioOverrides(
  scenario: ScenarioName,
  baseLegalFee: number,
  baseCompletionWeeks: number,
): { legalFee: number; completionWeeksAfterExercise: number } {
  const s = SCENARIO_MAP[scenario];
  return {
    legalFee: s.legalFee ?? baseLegalFee,
    completionWeeksAfterExercise: s.completionWeeksAfterExercise ?? baseCompletionWeeks,
  };
}

export function calculatePropertyValue(inputs: DownpaymentSavingPropertyInputs): number {
  if (inputs.manualPropertyValueEnabled) {
    return inputs.manualPropertyValue;
  }
  return inputs.squareFeet * inputs.psf;
}

/** Computed value from sqft 閼?psf (regardless of manual toggle). */
export function computeSqftTimesPsf(inputs: DownpaymentSavingPropertyInputs): number {
  return inputs.squareFeet * inputs.psf;
}

export function calculateDownpayment(propertyValue: number, downpaymentPercent: number): number {
  return propertyValue * (downpaymentPercent / 100);
}

/** Subtotal of a single buyer's available funds (CPF + cash savings + extra savings). */
export function buyerSubtotal(buyer: SavingBuyer): number {
  return buyer.currentCpf + buyer.currentCashSavings + buyer.extraSavings;
}

/** Combined available funds across all buyers. */
export function combinedAvailableFunds(buyers: SavingBuyer[]): number {
  return buyers.reduce((sum, b) => sum + buyerSubtotal(b), 0);
}

/** Monthly CPF + cash accumulation for a single buyer. */
export function buyerMonthlyAccumulation(buyer: SavingBuyer): number {
  return buyer.monthlyCpfContribution + buyer.monthlyCashSaving;
}

/** Combined monthly CPF contribution across all buyers. */
export function combinedMonthlyCpf(buyers: SavingBuyer[]): number {
  return buyers.reduce((sum, b) => sum + b.monthlyCpfContribution, 0);
}

/** Combined monthly cash saving across all buyers. */
export function combinedMonthlyCashSaving(buyers: SavingBuyer[]): number {
  return buyers.reduce((sum, b) => sum + b.monthlyCashSaving, 0);
}

/** Combined monthly accumulation (CPF + cash) across all buyers. */
export function combinedMonthlyAccumulation(buyers: SavingBuyer[]): number {
  return buyers.reduce((sum, b) => sum + buyerMonthlyAccumulation(b), 0);
}

export function calculateTotalPaymentNeeded(
  downpayment: number,
  stampDuty: number,
  legalFee: number,
): number {
  return downpayment + stampDuty + legalFee;
}

export function calculateCurrentDeficit(
  totalPaymentNeeded: number,
  availableFunds: number,
): number {
  return totalPaymentNeeded - availableFunds;
}

export function calculateMonthsNeeded(
  deficit: number,
  monthlyAccumulation: number,
): number {
  if (deficit <= 0 || monthlyAccumulation <= 0) return 0;
  return Math.round((deficit / monthlyAccumulation) * 100) / 100;
}

export function calculatePaymentStages(
  propertyValue: number,
  downpayment: number,
  stampDuty: number,
  legalFee: number,
  timeline: TimelineInputs,
): PaymentStage[] {
  const optionFee = propertyValue * (timeline.optionFeePercent / 100);
  const exerciseFee = propertyValue * (timeline.exerciseFeePercent / 100);
  const remainingDownpayment = downpayment - optionFee - exerciseFee;
  const completionPayment = remainingDownpayment + legalFee;
  const stampDutyDay = timeline.otpExerciseDays + timeline.stampDutyDueDaysAfterExercise;
  const completionDay = timeline.otpExerciseDays + timeline.completionWeeksAfterExercise * 7;

  return [
    {
      stage: "Option Fee",
      day: 0,
      amount: optionFee,
      description: "Paid to secure OTP",
    },
    {
      stage: "Exercise Fee",
      day: timeline.otpExerciseDays,
      amount: exerciseFee,
      description: "Paid when exercising OTP",
    },
    {
      stage: "Stamp Duty",
      day: stampDutyDay,
      amount: stampDuty,
      description: "BSD due after OTP exercise",
    },
    {
      stage: "Completion",
      day: completionDay,
      amount: completionPayment,
      description: "Remaining downpayment + legal fee",
    },
  ];
}

export function calculateCashflowReadiness(
  paymentStages: PaymentStage[],
  availableFunds: number,
  monthlyAccumulation: number,
): CashflowReadinessRow[] {
  let cumulativeDue = 0;
  return paymentStages.map((stage) => {
    cumulativeDue += stage.amount;
    const monthsElapsed = stage.day / 30;
    const fundsAtDay = availableFunds + monthlyAccumulation * monthsElapsed;
    const surplusOrDeficit = fundsAtDay - cumulativeDue;
    return {
      stage: stage.stage,
      availableFunds: fundsAtDay,
      cumulativePaymentDue: cumulativeDue,
      surplusOrDeficit,
      status: surplusOrDeficit >= 0 ? "Ready" : "Not Ready",
    };
  });
}

/**
 * Full computation: takes the persisted state and returns all derived outputs.
 * This is a pure function meant to be called inside a useMemo or selector.
 */
export function computeDownpaymentSaving(state: DownpaymentSavingState): DownpaymentSavingOutput {
  const propertyValue = calculatePropertyValue(state.property);
  const computedPropertyValue = computeSqftTimesPsf(state.property);
  const downpayment = calculateDownpayment(propertyValue, state.property.downpaymentPercent);
  // ABSD uses the highest applicable rate among all buyers (joint purchase rule).
  const absdBuyers = state.buyers.map((b) => ({ profile: b.profile, propertyCount: b.propertyCount, cash: 0, cpf: 0 }));
  const stampDuty = calcBSD(propertyValue) + calcABSDForBuyers(propertyValue, absdBuyers);
  const overrides = applyScenarioOverrides(
    state.scenario,
    state.property.legalFee,
    state.timeline.completionWeeksAfterExercise,
  );
  const legalFee = overrides.legalFee;
  const totalPaymentNeeded = calculateTotalPaymentNeeded(downpayment, stampDuty, legalFee);
  const totalFunds = combinedAvailableFunds(state.buyers);
  const currentDeficit = calculateCurrentDeficit(totalPaymentNeeded, totalFunds);
  const cpfMonthly = combinedMonthlyCpf(state.buyers);
  const cashMonthly = combinedMonthlyCashSaving(state.buyers);
  const monthlyAccum = combinedMonthlyAccumulation(state.buyers);
  const monthsNeeded = calculateMonthsNeeded(currentDeficit, monthlyAccum);

  const effectiveTimeline: TimelineInputs = {
    ...state.timeline,
    completionWeeksAfterExercise: overrides.completionWeeksAfterExercise,
  };

  const paymentStages = calculatePaymentStages(
    propertyValue,
    downpayment,
    stampDuty,
    legalFee,
    effectiveTimeline,
  );

  const cashflowReadiness = calculateCashflowReadiness(
    paymentStages,
    totalFunds,
    monthlyAccum,
  );

  const hasPropertyValueMismatch =
    state.property.manualPropertyValueEnabled &&
    Math.abs(state.property.manualPropertyValue - computedPropertyValue) > 0.01;

  return {
    propertyValue,
    downpayment,
    stampDuty,
    legalFee,
    totalPaymentNeeded,
    combinedAvailableFunds: totalFunds,
    currentDeficit,
    combinedMonthlyCpf: cpfMonthly,
    combinedMonthlyCashSaving: cashMonthly,
    combinedMonthlyAccumulation: monthlyAccum,
    monthsNeeded,
    paymentStages,
    cashflowReadiness,
    hasPropertyValueMismatch,
    computedPropertyValue,
  };
}
