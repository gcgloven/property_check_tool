import { describe, expect, it } from "vitest";
import {
  monthsBetween,
  projectNewLaunch,
  projectResale,
  summarizeResale,
} from "../projection";
import type { NewLaunchInputs, ResaleInputs } from "../types";

const resale: ResaleInputs = {
  purchaseDate: "2026-01-01",
  price: 1_500_000,
  downPaymentPct: 0.25,
  interestRate: 0.035,
  loanTenureYears: 30,
  buyerProfile: "citizen",
  propertyCount: 1,
  mode: "rent-out",
  monthlyRental: 4_500,
  rentalGrowthPct: 0.03,
  vacancyPct: 0.05,
  maintenancePct: 0.1,
  appreciationPct: 0.03,
  horizonYears: 10,
};

describe("projectResale", () => {
  it("produces one row per horizon year", () => {
    expect(projectResale(resale)).toHaveLength(10);
  });

  it("appreciates property value and reduces the loan over time", () => {
    const rows = projectResale(resale);
    expect(rows[0].propertyValue).toBeCloseTo(1_500_000 * 1.03, 0);
    expect(rows[9].outstandingLoan).toBeLessThan(rows[0].outstandingLoan);
    expect(rows[9].equity).toBeGreaterThan(rows[0].equity);
  });

  it("self-stay has no rental income (negative operating cashflow)", () => {
    const rows = projectResale({ ...resale, mode: "self-stay" });
    expect(rows[0].netRentalCashflow).toBeLessThan(0);
  });

  it("reports principal/interest paid as a share of the whole loan and total interest", () => {
    const rows = projectResale(resale);
    // Early in a 30-year loan most of each payment is interest, so the share of
    // total interest paid outpaces the share of principal paid down.
    expect(rows[0].principalPaidPct).toBeGreaterThan(0);
    expect(rows[0].principalPaidPct).toBeLessThan(rows[0].interestPaidPct);
    // Percentages are monotonically increasing and never exceed 100%.
    expect(rows[9].principalPaidPct).toBeGreaterThan(rows[0].principalPaidPct);
    expect(rows[9].interestPaidPct).toBeGreaterThan(rows[0].interestPaidPct);
    expect(rows[9].principalPaidPct).toBeLessThanOrEqual(1);
    expect(rows[9].interestPaidPct).toBeLessThanOrEqual(1);
  });
});

describe("summarizeResale", () => {
  it("includes stamp duty in the upfront cash-in", () => {
    const s = summarizeResale(resale);
    expect(s.downPayment).toBe(375_000);
    expect(s.stampDuty).toBe(44_600); // BSD for 1.5m, ABSD 0 for citizen 1st
    expect(s.upfrontCashIn).toBe(375_000 + 44_600);
    expect(s.rows).toHaveLength(10);
  });
});

describe("monthsBetween", () => {
  it("counts whole months forward", () => {
    expect(monthsBetween("2026-01", "2029-01")).toBe(36);
    expect(monthsBetween("2026-06", "2026-09")).toBe(3);
  });

  it("never goes negative", () => {
    expect(monthsBetween("2029-01", "2026-01")).toBe(0);
  });
});

const newLaunch: NewLaunchInputs = {
  todayMonth: "2026-06",
  topMonth: "2029-06",
  priceToday: 1_800_000,
  preTopAppreciationPct: 0.04,
  buyerProfile: "citizen",
  propertyCount: 1,
  interestRate: 0.035,
  loanTenureYears: 30,
  estimatedRentalAtTop: 5_500,
  rentalGrowthPct: 0.03,
  postTopAppreciationPct: 0.03,
  horizonYearsAfterTop: 5,
  currentMonthlyRent: 3_500,
  postTopMode: "self-stay",
};

describe("projectNewLaunch", () => {
  it("computes down payment now as booking + S&P + stamp duty", () => {
    const s = projectNewLaunch(newLaunch);
    expect(s.bookingCash).toBe(1_800_000 * 0.05);
    expect(s.spPayment).toBe(1_800_000 * 0.15);
    expect(s.downPaymentNow).toBeCloseTo(s.bookingCash + s.spPayment + s.stampDuty, 6);
  });

  it("appreciates price to TOP over the years to TOP", () => {
    const s = projectNewLaunch(newLaunch);
    expect(s.yearsToTop).toBe(3);
    expect(s.priceAtTop).toBeCloseTo(1_800_000 * Math.pow(1.04, 3), 0);
  });

  it("computes gross rental yield at TOP", () => {
    const s = projectNewLaunch(newLaunch);
    expect(s.rentalYieldAtTop).toBeCloseTo((5_500 * 12) / s.priceAtTop, 6);
  });

  it("projects the post-TOP horizon", () => {
    const s = projectNewLaunch(newLaunch);
    expect(s.postTopProjection).toHaveLength(5);
    expect(s.postTopProjection[4].equity).toBeGreaterThan(s.postTopProjection[0].equity);
  });

  it("totals the rent paid while renting until TOP", () => {
    const s = projectNewLaunch(newLaunch);
    expect(s.totalRentUntilTop).toBe(3_500 * 12 * 3);
  });

  it("self-stay after TOP has no rental income (negative cashflow)", () => {
    const s = projectNewLaunch({ ...newLaunch, postTopMode: "self-stay" });
    expect(s.postTopProjection[0].netRentalCashflow).toBeLessThan(0);
  });

  it("rent-out subtracts both the mortgage and the buyer's own rent", () => {
    const rentOut = projectNewLaunch({ ...newLaunch, postTopMode: "rent-out" });
    const selfStay = projectNewLaunch({ ...newLaunch, postTopMode: "self-stay" });
    const annualMortgage = rentOut.postTopProjection[0].annualMortgage;
    const grossRent = 5_500 * 12;
    const ownRent = 3_500 * 12;
    expect(rentOut.postTopProjection[0].netRentalCashflow).toBeCloseTo(
      grossRent - annualMortgage - ownRent,
      6,
    );
    // rent-out year-1 cashflow differs from self-stay by (grossRent - ownRent)
    expect(
      rentOut.postTopProjection[0].netRentalCashflow -
        selfStay.postTopProjection[0].netRentalCashflow,
    ).toBeCloseTo(grossRent - ownRent, 6);
  });
});
