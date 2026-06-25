"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ProjectionChart } from "@/components/charts/ProjectionChart";
import { Card, Field, Money, NumberInput, Select } from "@/components/ui";
import {
  progressivePaymentSchedule,
  projectNewLaunch,
  type BuyerProfile,
  type HoldingMode,
} from "@/lib/finance";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetNewLaunch, updateNewLaunch } from "@/store/slices/newLaunchSlice";

const PROFILE_OPTIONS: ReadonlyArray<{ value: BuyerProfile; label: string }> = [
  { value: "citizen", label: "SG Citizen" },
  { value: "pr", label: "SG PR" },
  { value: "foreigner", label: "Foreigner" },
];

const MODE_OPTIONS: ReadonlyArray<{ value: HoldingMode; label: string }> = [
  { value: "self-stay", label: "Self-stay (move in)" },
  { value: "rent-out", label: "Rent out" },
];

const COUNT_OPTIONS = [
  { value: "1", label: "1st property" },
  { value: "2", label: "2nd property" },
  { value: "3", label: "3rd+ property" },
] as const;

export default function NewLaunchPage() {
  const nl = useAppSelector((s) => s.newLaunch);
  const dispatch = useAppDispatch();
  const summary = useMemo(() => projectNewLaunch(nl), [nl]);
  const schedule = useMemo(() => progressivePaymentSchedule(nl.priceToday), [nl.priceToday]);

  const set = <K extends keyof typeof nl>(key: K, value: (typeof nl)[K]) =>
    dispatch(updateNewLaunch({ [key]: value }));

  const monthInput =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">
        ← Back to tools
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">New Launch (BUC / TOP) Projection</h1>
      <p className="mt-1 text-sm text-slate-600">
        You rent your current home until the project TOPs, then either move in (self-stay) or rent
        out the new unit. See the cash needed now, rent paid until TOP, price &amp; yield at TOP, and
        the growth potential N years after TOP.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Inputs */}
        <div className="space-y-6">
          <Card title="Project timeline">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Today">
                <input type="month" value={nl.todayMonth} onChange={(e) => set("todayMonth", e.target.value)} className={monthInput} />
              </Field>
              <Field label="Estimated TOP">
                <input type="month" value={nl.topMonth} onChange={(e) => set("topMonth", e.target.value)} className={monthInput} />
              </Field>
            </div>
          </Card>

          <Card title="While renting (now until TOP)">
            <Field label="Current monthly rent" hint="paid until TOP">
              <NumberInput value={nl.currentMonthlyRent} onChange={(v) => set("currentMonthlyRent", v)} min={0} step={100} prefix="S$" />
            </Field>
          </Card>

          <Card title="Purchase">
            <div className="grid gap-4">
              <Field label="Price today">
                <NumberInput value={nl.priceToday} onChange={(v) => set("priceToday", v)} min={0} step={10_000} prefix="S$" />
              </Field>
              <Field label="Pre-TOP appreciation" hint="p.a. until TOP">
                <NumberInput
                  value={Number((nl.preTopAppreciationPct * 100).toFixed(2))}
                  onChange={(v) => set("preTopAppreciationPct", v / 100)}
                  min={-10}
                  max={30}
                  step={0.5}
                  suffix="%"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Buyer profile">
                  <Select value={nl.buyerProfile} onChange={(v) => set("buyerProfile", v)} options={PROFILE_OPTIONS} />
                </Field>
                <Field label="Property count">
                  <Select
                    value={String(nl.propertyCount) as "1" | "2" | "3"}
                    onChange={(v) => set("propertyCount", Number(v) as 1 | 2 | 3)}
                    options={COUNT_OPTIONS}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Interest rate">
                  <NumberInput
                    value={Number((nl.interestRate * 100).toFixed(2))}
                    onChange={(v) => set("interestRate", v / 100)}
                    min={0}
                    max={20}
                    step={0.1}
                    suffix="%"
                  />
                </Field>
                <Field label="Loan tenure">
                  <NumberInput value={nl.loanTenureYears} onChange={(v) => set("loanTenureYears", v)} min={1} max={35} suffix="yrs" />
                </Field>
              </div>
            </div>
          </Card>

          <Card title="After TOP">
            <div className="grid gap-4">
              <Field label="Decision at TOP">
                <Select value={nl.postTopMode} onChange={(v) => set("postTopMode", v)} options={MODE_OPTIONS} />
              </Field>
              <Field label="Estimated monthly rental" hint="if renting out">
                <NumberInput value={nl.estimatedRentalAtTop} onChange={(v) => set("estimatedRentalAtTop", v)} min={0} step={100} prefix="S$" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Rental growth">
                  <NumberInput
                    value={Number((nl.rentalGrowthPct * 100).toFixed(2))}
                    onChange={(v) => set("rentalGrowthPct", v / 100)}
                    min={0}
                    max={20}
                    step={0.5}
                    suffix="%"
                  />
                </Field>
                <Field label="Post-TOP growth">
                  <NumberInput
                    value={Number((nl.postTopAppreciationPct * 100).toFixed(2))}
                    onChange={(v) => set("postTopAppreciationPct", v / 100)}
                    min={-10}
                    max={20}
                    step={0.5}
                    suffix="%"
                  />
                </Field>
              </div>
              <Field label="Projection after TOP">
                <NumberInput value={nl.horizonYearsAfterTop} onChange={(v) => set("horizonYearsAfterTop", v)} min={1} max={30} suffix="yrs" />
              </Field>
              <button
                type="button"
                onClick={() => dispatch(resetNewLaunch())}
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
            <Stat label="Down payment needed now" value={summary.downPaymentNow} accent />
            <Stat label={`Price at TOP (${summary.yearsToTop.toFixed(1)} yrs)`} value={summary.priceAtTop} />
            <Stat label="Rental yield at TOP" pct={summary.rentalYieldAtTop} />
            <Stat label={`Rent paid until TOP (${summary.yearsToTop.toFixed(1)} yrs)`} value={summary.totalRentUntilTop} />
          </div>

          <Card title="Cash needed now">
            <dl className="divide-y divide-slate-100 text-sm">
              <Row label="Booking deposit (5%, cash)" value={summary.bookingCash} />
              <Row label="S&P signing (15%)" value={summary.spPayment} />
              <Row label="Stamp duty (BSD + ABSD)" value={summary.stampDuty} />
              <Row label="Total needed now" value={summary.downPaymentNow} strong />
              <Row label="Loan amount (75% LTV)" value={summary.loanAmount} />
            </dl>
          </Card>

          <Card title="Progressive payment schedule" description="Cash outlay tied to construction milestones until TOP & CSC.">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-2">Stage</th>
                    <th className="pb-2 text-right">%</th>
                    <th className="pb-2 text-right">Amount</th>
                    <th className="pb-2 text-right">Cumulative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schedule.map((s) => (
                    <tr key={s.stage}>
                      <td className="py-2 text-slate-600">{s.stage}</td>
                      <td className="py-2 text-right text-slate-500">{Math.round(s.pct * 100)}%</td>
                      <td className="py-2 text-right text-slate-700"><Money value={s.amount} /></td>
                      <td className="py-2 text-right text-slate-500"><Money value={s.cumulativeAmount} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card
            title={`Post-TOP projection — ${
              summary.postTopMode === "self-stay" ? "self-stay" : "rent out"
            }`}
            description={
              summary.postTopMode === "rent-out"
                ? "You collect the unit's rental, still pay your own rent elsewhere, and service the mortgage."
                : "You move in, stop paying your current rent, and service the mortgage."
            }
          >
            <ProjectionChart rows={summary.postTopProjection} />
          </Card>
        </div>
      </div>

      <p className="mt-8 text-xs text-slate-400">Estimates only — not financial advice.</p>
    </main>
  );
}

function Stat({ label, value, pct, accent }: { label: string; value?: number; pct?: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white"}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${accent ? "text-indigo-700" : "text-slate-900"}`}>
        {pct !== undefined ? `${(pct * 100).toFixed(2)}%` : <Money value={value ?? 0} />}
      </p>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className={strong ? "font-medium text-slate-900" : "text-slate-600"}>{label}</dt>
      <dd className={strong ? "font-semibold text-slate-900" : "text-slate-700"}>
        <Money value={value} />
      </dd>
    </div>
  );
}
