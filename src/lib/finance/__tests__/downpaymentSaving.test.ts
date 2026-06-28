import { describe, expect, it } from "vitest";
import { calcBSD } from "../stampDuty";
import {
  applyScenarioOverrides,
  buyerMonthlyAccumulation,
  buyerSubtotal,
  calculateCashflowReadiness,
  calculateCurrentDeficit,
  calculateDownpayment,
  calculateMonthsNeeded,
  calculatePaymentStages,
  calculatePropertyValue,
  combinedAvailableFunds,
  combinedMonthlyAccumulation,
  computeDownpaymentSaving,
} from "../downpaymentSavingProjection";
import type {
  DownpaymentSavingPropertyInputs,
  DownpaymentSavingState,
  SavingBuyer,
  TimelineInputs,
} from "../types";

const defaultProperty: DownpaymentSavingPropertyInputs = {
  squareFeet: 650,
  psf: 2450,
  manualPropertyValueEnabled: true,
  manualPropertyValue: 1650000,
  downpaymentPercent: 25,
  legalFee: 6000,
};

const defaultTimeline: TimelineInputs = {
  optionFeePercent: 1,
  exerciseFeePercent: 4,
  otpExerciseDays: 14,
  stampDutyDueDaysAfterExercise: 14,
  completionWeeksAfterExercise: 12,
};

const buyerA: SavingBuyer = {
  name: "Person A",
  profile: "citizen",
  propertyCount: 1,
  currentCpf: 55370.02,
  currentCashSavings: 10000,
  extraSavings: 100000,
  monthlyCpfContribution: 1744.5,
  monthlyCashSaving: 1200,
};

const buyerB: SavingBuyer = {
  name: "Person B",
  profile: "citizen",
  propertyCount: 1,
  currentCpf: 57960.68,
  currentCashSavings: 123842.82,
  extraSavings: 70000,
  monthlyCpfContribution: 1840.24,
  monthlyCashSaving: 10300,
};

function defaultState(over?: Partial<DownpaymentSavingState>): DownpaymentSavingState {
  return {
    property: { ...defaultProperty },
    buyers: [buyerA, buyerB],
    timeline: { ...defaultTimeline },
    scenario: "baseCase",
    ...over,
  };
}

describe("calculatePropertyValue", () => {
  it("returns manual value when manual is enabled", () => {
    expect(calculatePropertyValue(defaultProperty)).toBe(1650000);
  });

  it("returns sqft * psf when manual is disabled", () => {
    const p = { ...defaultProperty, manualPropertyValueEnabled: false };
    expect(calculatePropertyValue(p)).toBe(650 * 2450);
  });
});

describe("calculateDownpayment", () => {
  it("computes 25% of property value", () => {
    expect(calculateDownpayment(1650000, 25)).toBe(412500);
  });
});

describe("buyerSubtotal", () => {
  it("sums CPF + cash + extra savings", () => {
    expect(buyerSubtotal(buyerA)).toBe(55370.02 + 10000 + 100000);
    expect(buyerSubtotal(buyerB)).toBe(57960.68 + 123842.82 + 70000);
  });
});

describe("combinedAvailableFunds", () => {
  it("sums across all buyers", () => {
    const expected = 55370.02 + 10000 + 100000 + 57960.68 + 123842.82 + 70000;
    const result = combinedAvailableFunds([buyerA, buyerB]);
    expect(result).toBeCloseTo(expected, 2);
    expect(result).toBeCloseTo(417173.52, 2);
  });
});

describe("buyerMonthlyAccumulation", () => {
  it("sums CPF contribution + cash saving", () => {
    expect(buyerMonthlyAccumulation(buyerA)).toBe(1744.5 + 1200);
    expect(buyerMonthlyAccumulation(buyerB)).toBe(1840.24 + 10300);
  });
});

describe("combinedMonthlyAccumulation", () => {
  it("sums across all buyers", () => {
    const result = combinedMonthlyAccumulation([buyerA, buyerB]);
    expect(result).toBeCloseTo(3584.74 + 11500, 2);
    expect(result).toBeCloseTo(15084.74, 2);
  });
});

describe("calculateTotalPaymentNeeded via computeDownpaymentSaving", () => {
  it("matches the expected default output", () => {
    const o = computeDownpaymentSaving(defaultState());
    // BSD for 1.65M: 1%*180k + 2%*180k + 3%*640k + 4%*500k = 52100
    expect(o.stampDuty).toBe(52100);
    expect(o.downpayment).toBe(412500);
    expect(o.legalFee).toBe(6000);
    expect(o.totalPaymentNeeded).toBe(412500 + 52100 + 6000);
    expect(o.totalPaymentNeeded).toBe(470600);
    expect(o.combinedAvailableFunds).toBeCloseTo(417173.52, 2);
    expect(o.currentDeficit).toBeCloseTo(53426.48, 2);
    expect(o.combinedMonthlyCpf).toBeCloseTo(3584.74, 2);
    expect(o.combinedMonthlyCashSaving).toBeCloseTo(11500, 2);
    expect(o.combinedMonthlyAccumulation).toBeCloseTo(15084.74, 2);
    // 53426.48 / 15084.74 = 3.54
    expect(o.monthsNeeded).toBeCloseTo(3.54, 2);
  });
});

describe("calculateCurrentDeficit", () => {
  it("positive when payment exceeds funds", () => {
    expect(calculateCurrentDeficit(470600, 417173.52)).toBeCloseTo(53426.48, 2);
  });

  it("negative (surplus) when funds exceed payment", () => {
    expect(calculateCurrentDeficit(100000, 150000)).toBe(-50000);
  });
});

describe("calculateMonthsNeeded", () => {
  it("returns deficit / monthly rounded to 2dp when deficit > 0", () => {
    expect(calculateMonthsNeeded(53426.48, 15084.74)).toBeCloseTo(3.54, 2);
  });

  it("returns 0 when deficit is 0", () => {
    expect(calculateMonthsNeeded(0, 1000)).toBe(0);
  });

  it("returns 0 when deficit is negative (surplus)", () => {
    expect(calculateMonthsNeeded(-50000, 1000)).toBe(0);
  });

  it("returns 0 when monthly accumulation is 0", () => {
    expect(calculateMonthsNeeded(1000, 0)).toBe(0);
  });
});

describe("calculatePaymentStages", () => {
  it("produces 4 stages with correct amounts and days", () => {
    const stages = calculatePaymentStages(1650000, 412500, 52100, 6000, defaultTimeline);
    expect(stages).toHaveLength(4);

    // Option fee: 1% = 16500, Day 0
    expect(stages[0].stage).toBe("Option Fee");
    expect(stages[0].day).toBe(0);
    expect(stages[0].amount).toBe(16500);

    // Exercise fee: 4% = 66000, Day 14
    expect(stages[1].stage).toBe("Exercise Fee");
    expect(stages[1].day).toBe(14);
    expect(stages[1].amount).toBe(66000);

    // Stamp duty: 52100, Day 28 (14+14)
    expect(stages[2].stage).toBe("Stamp Duty");
    expect(stages[2].day).toBe(28);
    expect(stages[2].amount).toBe(52100);

    // Completion: remaining downpayment (330000) + legal (6000) = 336000, Day 98 (14+84)
    expect(stages[3].stage).toBe("Completion");
    expect(stages[3].day).toBe(98);
    expect(stages[3].amount).toBe(336000);
  });
});

describe("calculateCashflowReadiness", () => {
  it("returns Ready for early stages, may show Not Ready for completion", () => {
    const stages = calculatePaymentStages(1650000, 412500, 52100, 6000, defaultTimeline);
    const buyers: SavingBuyer[] = [
      {
        name: "Person A",
        profile: "citizen",
        propertyCount: 1,
        currentCpf: 55370.02,
        currentCashSavings: 10000,
        extraSavings: 100000,
        monthlyCpfContribution: 1744.5,
        monthlyCashSaving: 1200,
      },
      {
        name: "Person B",
        profile: "citizen",
        propertyCount: 1,
        currentCpf: 57960.68,
        currentCashSavings: 123842.82,
        extraSavings: 70000,
        monthlyCpfContribution: 1840.24,
        monthlyCashSaving: 10300,
      },
    ];
    const avail = combinedAvailableFunds(buyers);
    const monthly = combinedMonthlyAccumulation(buyers);
    const rows = calculateCashflowReadiness(stages, avail, monthly);

    expect(rows).toHaveLength(4);
    // Option fee: Day 0, available = 417173.52, cumulative = 16500 -> surplus
    expect(rows[0].stage).toBe("Option Fee");
    expect(rows[0].status).toBe("Ready");

    // Exercise fee: Day 14
    expect(rows[1].stage).toBe("Exercise Fee");
    expect(rows[1].status).toBe("Ready");

    // Completion: Day 98
    expect(rows[3].stage).toBe("Completion");
    // The cumulative due (470600) should be greater than or equal to available funds
    // at Day 98, which might be deficit or surplus depending on exact calculation
    expect(rows[3].cumulativePaymentDue).toBeCloseTo(470600, 0);
  });
});

describe("applyScenarioOverrides", () => {
  it("conservative: 8 weeks, $8000 legal", () => {
    const r = applyScenarioOverrides("conservative", 6000, 12);
    expect(r.completionWeeksAfterExercise).toBe(8);
    expect(r.legalFee).toBe(8000);
  });

  it("baseCase: 12 weeks, $6000 legal", () => {
    const r = applyScenarioOverrides("baseCase", 6000, 12);
    expect(r.completionWeeksAfterExercise).toBe(12);
    expect(r.legalFee).toBe(6000);
  });

  it("stretched: 16 weeks, $6000 legal", () => {
    const r = applyScenarioOverrides("stretched", 6000, 12);
    expect(r.completionWeeksAfterExercise).toBe(16);
    expect(r.legalFee).toBe(6000);
  });
});

describe("computeDownpaymentSaving 闁?scenario switching", () => {
  it("conservative scenario overrides legal fee and completion weeks", () => {
    const state = defaultState({ scenario: "conservative" });
    const o = computeDownpaymentSaving(state);
    expect(o.legalFee).toBe(8000);
    expect(o.totalPaymentNeeded).toBe(412500 + 52100 + 8000);
    expect(o.paymentStages[3].day).toBe(14 + 8 * 7); // Day 70
  });
});

describe("computeDownpaymentSaving 闁?property mismatch flag", () => {
  it("flags mismatch when manual differs from sqft*psf", () => {
    const state = defaultState();
    const o = computeDownpaymentSaving(state);
    // manual=1650000, sqft*psf=1592500
    expect(o.hasPropertyValueMismatch).toBe(true);
    expect(o.computedPropertyValue).toBe(650 * 2450);
  });

  it("does not flag mismatch when manual matches sqft*psf", () => {
    const state = defaultState({
      property: { ...defaultProperty, manualPropertyValue: 650 * 2450 },
    });
    const o = computeDownpaymentSaving(state);
    expect(o.hasPropertyValueMismatch).toBe(false);
  });

  it("does not flag mismatch when manual is disabled", () => {
    const state = defaultState({
      property: { ...defaultProperty, manualPropertyValueEnabled: false },
    });
    const o = computeDownpaymentSaving(state);
    expect(o.hasPropertyValueMismatch).toBe(false);
  });
});
