"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card, Field, Money, NumberInput, Select, formatSGD } from "@/components/ui";
import {
  breakdownDownPayment,
  validatePurchase,
  type BuyerProfile,
} from "@/lib/finance";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addBuyer,
  removeBuyer,
  resetPurchase,
  setDownPaymentPct,
  setPrice,
  updateBuyer,
} from "@/store/slices/purchaseSlice";

const PROFILE_OPTIONS: ReadonlyArray<{ value: BuyerProfile; label: string }> = [
  { value: "citizen", label: "SG Citizen" },
  { value: "pr", label: "SG PR" },
  { value: "foreigner", label: "Foreigner" },
];

const COUNT_OPTIONS = [
  { value: "1", label: "1st property" },
  { value: "2", label: "2nd property" },
  { value: "3", label: "3rd+ property" },
] as const;

export default function DownPaymentPage() {
  const purchase = useAppSelector((s) => s.purchase);
  const dispatch = useAppDispatch();

  const breakdown = useMemo(() => breakdownDownPayment(purchase), [purchase]);
  const validation = useMemo(() => validatePurchase(purchase), [purchase]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">
        ← Back to tools
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Down Payment Estimator</h1>
      <p className="mt-1 text-sm text-slate-600">
        One or two buyers, each with their own citizenship, CPF and cash. Enforces the 25%
        minimum down payment and 5% minimum cash rules. Joint purchases use the highest ABSD rate.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Inputs */}
        <div className="space-y-6">
          <Card title="Property">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Purchase price">
                <NumberInput
                  value={purchase.price}
                  onChange={(v) => dispatch(setPrice(v))}
                  min={0}
                  step={10_000}
                  prefix="S$"
                />
              </Field>
              <Field label="Down payment" hint="min 25%">
                <NumberInput
                  value={Math.round(purchase.downPaymentPct * 100)}
                  onChange={(v) => dispatch(setDownPaymentPct(v / 100))}
                  min={0}
                  max={100}
                  step={1}
                  suffix="%"
                />
              </Field>
            </div>
          </Card>

          {purchase.buyers.map((buyer, i) => (
            <Card key={i} title={`Buyer ${i + 1}`}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Citizenship">
                  <Select
                    value={buyer.profile}
                    onChange={(profile) =>
                      dispatch(updateBuyer({ index: i, patch: { profile } }))
                    }
                    options={PROFILE_OPTIONS}
                  />
                </Field>
                <Field label="Property count" hint="drives ABSD">
                  <Select
                    value={String(buyer.propertyCount) as "1" | "2" | "3"}
                    onChange={(v) =>
                      dispatch(
                        updateBuyer({
                          index: i,
                          patch: { propertyCount: Number(v) as 1 | 2 | 3 },
                        }),
                      )
                    }
                    options={COUNT_OPTIONS}
                  />
                </Field>
                <Field label="Cash">
                  <NumberInput
                    value={buyer.cash}
                    onChange={(cash) => dispatch(updateBuyer({ index: i, patch: { cash } }))}
                    min={0}
                    step={5_000}
                    prefix="S$"
                  />
                </Field>
                <Field label="CPF">
                  <NumberInput
                    value={buyer.cpf}
                    onChange={(cpf) => dispatch(updateBuyer({ index: i, patch: { cpf } }))}
                    min={0}
                    step={5_000}
                    prefix="S$"
                  />
                </Field>
              </div>
              {purchase.buyers.length > 1 && (
                <button
                  type="button"
                  onClick={() => dispatch(removeBuyer(i))}
                  className="mt-4 text-sm text-rose-600 hover:underline"
                >
                  Remove buyer
                </button>
              )}
            </Card>
          ))}

          <div className="flex gap-3">
            {purchase.buyers.length < 2 && (
              <button
                type="button"
                onClick={() => dispatch(addBuyer())}
                className="rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
              >
                + Add second buyer
              </button>
            )}
            <button
              type="button"
              onClick={() => dispatch(resetPurchase())}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {validation.issues.length > 0 && (
            <div className="space-y-2">
              {validation.issues.map((issue) => (
                <div
                  key={issue.code}
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    issue.severity === "error"
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  <span className="font-medium">
                    {issue.severity === "error" ? "Error: " : "Note: "}
                  </span>
                  {issue.message}
                </div>
              ))}
            </div>
          )}

          <Card title="Upfront cost breakdown">
            <dl className="divide-y divide-slate-100 text-sm">
              <Row label="Down payment" value={breakdown.downPayment} strong />
              <Row label="Minimum cash required (5%)" value={breakdown.minCashRequired} muted />
              <Row label="Buyer's Stamp Duty (BSD)" value={breakdown.bsd} />
              <Row
                label={`Additional BSD (ABSD ${Math.round(
                  (breakdown.absd / breakdown.price) * 100,
                )}%)`}
                value={breakdown.absd}
              />
              <Row label="Total upfront cost" value={breakdown.totalUpfront} strong />
              <Row label="Loan amount" value={breakdown.loanAmount} muted />
            </dl>
          </Card>

          <Card title="Funding">
            <dl className="divide-y divide-slate-100 text-sm">
              <Row label="Total cash available" value={breakdown.funds.totalCash} />
              <Row label="Total CPF available" value={breakdown.funds.totalCpf} />
              <Row label="Cash used for down payment" value={breakdown.allocation.cashUsed} />
              <Row label="CPF used for down payment" value={breakdown.allocation.cpfUsed} />
              {breakdown.allocation.shortfall > 0 && (
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-rose-600">Shortfall</dt>
                  <dd className="font-semibold text-rose-600">
                    {formatSGD(breakdown.allocation.shortfall)}
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        </div>
      </div>

      <p className="mt-8 text-xs text-slate-400">
        Estimates only — not financial advice. Rates configurable in{" "}
        <code>src/lib/finance/constants.ts</code>.
      </p>
    </main>
  );
}

function Row({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: number;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className={muted ? "text-slate-400" : "text-slate-600"}>{label}</dt>
      <dd className={strong ? "font-semibold text-slate-900" : "text-slate-700"}>
        <Money value={value} />
      </dd>
    </div>
  );
}
