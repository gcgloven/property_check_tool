import { describe, expect, it } from "vitest";
import {
  assertValidPurchase,
  breakdownDownPayment,
  validatePurchase,
} from "../downPayment";
import { calcABSDForBuyers, jointAbsdRate } from "../stampDuty";
import type { Buyer, PurchaseInputs } from "../types";

const citizen1st: Buyer = { profile: "citizen", propertyCount: 1, cash: 0, cpf: 0 };
const citizen2nd: Buyer = { profile: "citizen", propertyCount: 2, cash: 0, cpf: 0 };
const foreigner1st: Buyer = { profile: "foreigner", propertyCount: 1, cash: 0, cpf: 0 };

function inputs(over: Partial<PurchaseInputs> = {}): PurchaseInputs {
  return {
    price: 1_500_000,
    downPaymentPct: 0.25,
    buyers: [{ profile: "citizen", propertyCount: 1, cash: 450_000, cpf: 0 }],
    ...over,
  };
}

describe("joint ABSD", () => {
  it("is 0% for a single citizen first purchase", () => {
    expect(jointAbsdRate([citizen1st])).toBe(0);
  });

  it("uses the highest rate among co-owners (citizen + foreigner = 60%)", () => {
    expect(jointAbsdRate([citizen1st, foreigner1st])).toBe(0.6);
    expect(calcABSDForBuyers(1_500_000, [citizen1st, foreigner1st])).toBe(900_000);
  });

  it("uses the higher count rate (citizen 1st + citizen 2nd = 20%)", () => {
    expect(jointAbsdRate([citizen1st, citizen2nd])).toBe(0.2);
  });
});

describe("breakdownDownPayment", () => {
  it("computes down payment, loan, BSD and ABSD for a single citizen", () => {
    const b = breakdownDownPayment(inputs());
    expect(b.downPayment).toBe(375_000);
    expect(b.loanAmount).toBe(1_125_000);
    expect(b.minCashRequired).toBe(75_000);
    expect(b.absd).toBe(0);
    // BSD for 1.5m: 1%*180k + 2%*180k + 3%*640k + 4%*500k = 44,600
    expect(b.bsd).toBe(44_600);
    expect(b.totalUpfront).toBe(375_000 + 44_600);
  });

  it("allocates cash to cover the 5% minimum before CPF", () => {
    const b = breakdownDownPayment(
      inputs({ buyers: [{ profile: "citizen", propertyCount: 1, cash: 75_000, cpf: 400_000 }] }),
    );
    expect(b.allocation.cashUsed).toBe(75_000);
    expect(b.allocation.cpfUsed).toBe(300_000);
    expect(b.allocation.shortfall).toBe(0);
  });

  it("pools cash and CPF across two buyers", () => {
    const b = breakdownDownPayment(
      inputs({
        buyers: [
          { profile: "citizen", propertyCount: 1, cash: 50_000, cpf: 150_000 },
          { profile: "citizen", propertyCount: 1, cash: 50_000, cpf: 150_000 },
        ],
      }),
    );
    expect(b.funds.totalCash).toBe(100_000);
    expect(b.funds.totalCpf).toBe(300_000);
  });
});

describe("validatePurchase", () => {
  it("passes a valid single-buyer purchase", () => {
    const r = validatePurchase(inputs());
    expect(r.valid).toBe(true);
    expect(r.issues).toHaveLength(0);
  });

  it("flags down payment below 25%", () => {
    const r = validatePurchase(inputs({ downPaymentPct: 0.2 }));
    expect(r.valid).toBe(false);
    expect(r.issues.map((i) => i.code)).toContain("DP_BELOW_MIN");
  });

  it("flags cash below the 5% minimum", () => {
    const r = validatePurchase(
      inputs({ buyers: [{ profile: "citizen", propertyCount: 1, cash: 40_000, cpf: 400_000 }] }),
    );
    expect(r.valid).toBe(false);
    expect(r.issues.map((i) => i.code)).toContain("CASH_BELOW_MIN");
  });

  it("flags insufficient total funds for the down payment", () => {
    const r = validatePurchase(
      inputs({ buyers: [{ profile: "citizen", propertyCount: 1, cash: 100_000, cpf: 100_000 }] }),
    );
    expect(r.valid).toBe(false);
    expect(r.issues.map((i) => i.code)).toContain("INSUFFICIENT_FUNDS");
  });

  it("warns when funds cover down payment but not stamp duties", () => {
    const r = validatePurchase(
      inputs({ buyers: [{ profile: "citizen", propertyCount: 1, cash: 375_000, cpf: 0 }] }),
    );
    expect(r.valid).toBe(true);
    expect(r.issues.map((i) => i.code)).toContain("STAMP_DUTY_FUNDS");
  });

  it("rejects more than two buyers", () => {
    const r = validatePurchase(inputs({ buyers: [citizen1st, citizen1st, citizen1st] }));
    expect(r.issues.map((i) => i.code)).toContain("BUYER_COUNT");
  });
});

describe("assertValidPurchase", () => {
  it("does not throw for a valid purchase", () => {
    expect(() => assertValidPurchase(inputs())).not.toThrow();
  });

  it("throws for a below-minimum down payment", () => {
    expect(() => assertValidPurchase(inputs({ downPaymentPct: 0.2 }))).toThrow(/Invalid purchase/);
  });
});
