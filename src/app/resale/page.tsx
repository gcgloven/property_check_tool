"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ProjectionChart } from "@/components/charts/ProjectionChart";
import { Card, Field, Money, NumberInput, Select } from "@/components/ui";
import { summarizeResale, type BuyerProfile, type HoldingMode } from "@/lib/finance";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetResale, updateResale } from "@/store/slices/resaleSlice";

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

const MODE_OPTIONS: ReadonlyArray<{ value: HoldingMode; label: string }> = [
  { value: "self-stay", label: "Self-stay" },
  { value: "rent-out", label: "Rent out" },
];

export default function ResalePage() {
  const resale = useAppSelector((s) => s.resale);
  const dispatch = useAppDispatch();
  const summary = useMemo(() => summarizeResale(resale), [resale]);

  const set = <K extends keyof typeof resale>(key: K, value: (typeof resale)[K]) =>
    dispatch(updateResale({ [key]: value }));

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">
        ← Back to tools
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Resale Cashflow Projection</h1>
      <p className="mt-1 text-sm text-slate-600">
        Buy a resale property today and project N years forward. Toggle self-stay vs rent-out and
        adjust capital appreciation and rental growth to see equity and cashflow.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Inputs */}
        <div className="space-y-6">
          <Card title="Purchase">
            <div className="grid gap-4">
              <Field label="Purchase date">
                <input
                  type="date"
                  value={resale.purchaseDate}
                  onChange={(e) => set("purchaseDate", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </Field>
              <Field label="Purchase price">
                <NumberInput value={resale.price} onChange={(v) => set("price", v)} min={0} step={10_000} prefix="S$" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Down payment" hint="min 25%">
                  <NumberInput
                    value={Math.round(resale.downPaymentPct * 100)}
                    onChange={(v) => set("downPaymentPct", v / 100)}
                    min={0}
                    max={100}
                    suffix="%"
                  />
                </Field>
                <Field label="Interest rate">
                  <NumberInput
                    value={Number((resale.interestRate * 100).toFixed(2))}
                    onChange={(v) => set("interestRate", v / 100)}
                    min={0}
                    max={20}
                    step={0.1}
                    suffix="%"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Loan tenure">
                  <NumberInput value={resale.loanTenureYears} onChange={(v) => set("loanTenureYears", v)} min={1} max={35} suffix="yrs" />
                </Field>
                <Field label="Projection">
                  <NumberInput value={resale.horizonYears} onChange={(v) => set("horizonYears", v)} min={1} max={40} suffix="yrs" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Buyer profile">
                  <Select value={resale.buyerProfile} onChange={(v) => set("buyerProfile", v)} options={PROFILE_OPTIONS} />
                </Field>
                <Field label="Property count">
                  <Select
                    value={String(resale.propertyCount) as "1" | "2" | "3"}
                    onChange={(v) => set("propertyCount", Number(v) as 1 | 2 | 3)}
                    options={COUNT_OPTIONS}
                  />
                </Field>
              </div>
            </div>
          </Card>

          <Card title="Usage & growth">
            <div className="grid gap-4">
              <Field label="Mode">
                <Select value={resale.mode} onChange={(v) => set("mode", v)} options={MODE_OPTIONS} />
              </Field>
              <Field label="Annual capital appreciation">
                <NumberInput
                  value={Number((resale.appreciationPct * 100).toFixed(2))}
                  onChange={(v) => set("appreciationPct", v / 100)}
                  min={-10}
                  max={20}
                  step={0.5}
                  suffix="%"
                />
              </Field>
              {resale.mode === "rent-out" && (
                <>
                  <Field label="Monthly rental">
                    <NumberInput value={resale.monthlyRental} onChange={(v) => set("monthlyRental", v)} min={0} step={100} prefix="S$" />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Rental growth">
                      <NumberInput
                        value={Number((resale.rentalGrowthPct * 100).toFixed(2))}
                        onChange={(v) => set("rentalGrowthPct", v / 100)}
                        min={0}
                        max={20}
                        step={0.5}
                        suffix="%"
                      />
                    </Field>
                    <Field label="Vacancy">
                      <NumberInput
                        value={Number((resale.vacancyPct * 100).toFixed(0))}
                        onChange={(v) => set("vacancyPct", v / 100)}
                        min={0}
                        max={100}
                        suffix="%"
                      />
                    </Field>
                  </div>
                  <Field label="Maintenance" hint="of annual rent">
                    <NumberInput
                      value={Number((resale.maintenancePct * 100).toFixed(0))}
                      onChange={(v) => set("maintenancePct", v / 100)}
                      min={0}
                      max={100}
                      suffix="%"
                    />
                  </Field>
                </>
              )}
              <button
                type="button"
                onClick={() => dispatch(resetResale())}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Upfront cash-in" value={summary.upfrontCashIn} />
            <Stat label={`Value (Y${resale.horizonYears})`} value={summary.finalValue} />
            <Stat label={`Equity (Y${resale.horizonYears})`} value={summary.finalEquity} accent />
            <Stat label="Net operating cashflow" value={summary.totalNetCashflow} />
          </div>

          <Card title="Projection">
            <ProjectionChart rows={summary.rows} />
            <p className="mt-3 text-sm text-slate-600">
              Net position (equity + cashflow − upfront):{" "}
              <span className="font-semibold text-slate-900">
                <Money value={summary.netPosition} />
              </span>{" "}
              · Simple return:{" "}
              <span className="font-semibold text-indigo-700">
                {(summary.totalReturnPct * 100).toFixed(0)}%
              </span>
            </p>
          </Card>

          <Card title="Year-by-year">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-2">Yr</th>
                    <th className="pb-2 text-right">Value</th>
                    <th className="pb-2 text-right">Loan</th>
                    <th className="pb-2 text-right">Equity</th>
                    <th className="pb-2 text-right">Net cashflow</th>
                    <th className="pb-2 text-right">Cumulative</th>
                    <th className="pb-2 text-right">% Principal</th>
                    <th className="pb-2 text-right">% Interest</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.rows.map((r) => (
                    <tr key={r.year}>
                      <td className="py-2 text-slate-600">{r.year}</td>
                      <td className="py-2 text-right text-slate-700"><Money value={r.propertyValue} /></td>
                      <td className="py-2 text-right text-slate-500"><Money value={r.outstandingLoan} /></td>
                      <td className="py-2 text-right text-slate-700"><Money value={r.equity} /></td>
                      <td className={`py-2 text-right ${r.netRentalCashflow < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        <Money value={r.netRentalCashflow} />
                      </td>
                      <td className={`py-2 text-right ${r.cumulativeCashflow < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        <Money value={r.cumulativeCashflow} />
                      </td>
                      <td className="py-2 text-right text-slate-700">{(r.principalPaidPct * 100).toFixed(1)}%</td>
                      <td className="py-2 text-right text-slate-700">{(r.interestPaidPct * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <p className="mt-8 text-xs text-slate-400">Estimates only — not financial advice.</p>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white"}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${accent ? "text-indigo-700" : "text-slate-900"}`}>
        <Money value={value} />
      </p>
    </div>
  );
}
