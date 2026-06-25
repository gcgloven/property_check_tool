"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AmortizationChart } from "@/components/charts/AmortizationChart";
import { Card, Field, Money, NumberInput } from "@/components/ui";
import { amortizationSchedule, monthlyInstalment } from "@/lib/finance";

export default function MortgagePage() {
  const [loanAmount, setLoanAmount] = useState(1_125_000);
  const [ratePct, setRatePct] = useState(3.5);
  const [tenureYears, setTenureYears] = useState(30);

  const rate = ratePct / 100;
  const monthly = useMemo(
    () => monthlyInstalment(loanAmount, rate, tenureYears),
    [loanAmount, rate, tenureYears],
  );
  const schedule = useMemo(
    () => amortizationSchedule(loanAmount, rate, tenureYears),
    [loanAmount, rate, tenureYears],
  );

  const totalPaid = monthly * tenureYears * 12;
  const totalInterest = totalPaid - loanAmount;

  // Year-end summary: balance, cumulative principal & interest, and the split of
  // the whole loan paid down to date — % of total principal and % of total interest.
  const yearlySummary = useMemo(() => {
    const rows: {
      year: number;
      balance: number;
      cumulativePrincipal: number;
      cumulativeInterest: number;
      principalPct: number;
      interestPct: number;
    }[] = [];
    let interestAcc = 0;
    let principalAcc = 0;
    schedule.forEach((row, idx) => {
      interestAcc += row.interest;
      principalAcc += row.principal;
      if ((idx + 1) % 12 === 0 || idx === schedule.length - 1) {
        rows.push({
          year: Math.ceil((idx + 1) / 12),
          balance: row.balance,
          cumulativePrincipal: principalAcc,
          cumulativeInterest: interestAcc,
          principalPct: loanAmount > 0 ? principalAcc / loanAmount : 0,
          interestPct: totalInterest > 0 ? interestAcc / totalInterest : 0,
        });
      }
    });
    return rows;
  }, [schedule, loanAmount, totalInterest]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">
        ← Back to tools
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Mortgage Calculator</h1>
      <p className="mt-1 text-sm text-slate-600">
        Monthly instalment and amortization summary for a home loan.
      </p>

      <div className="mt-8 space-y-6">
        <Card title="Loan">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Loan amount">
              <NumberInput value={loanAmount} onChange={setLoanAmount} min={0} step={10_000} prefix="S$" />
            </Field>
            <Field label="Interest rate">
              <NumberInput value={ratePct} onChange={setRatePct} min={0} max={20} step={0.1} suffix="%" />
            </Field>
            <Field label="Tenure">
              <NumberInput value={tenureYears} onChange={setTenureYears} min={1} max={35} step={1} suffix="yrs" />
            </Field>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Monthly instalment" value={monthly} accent />
          <Stat label="Total interest" value={totalInterest} />
          <Stat label="Total repayment" value={totalPaid} />
        </div>

        <Card
          title="Cumulative principal vs interest"
          description="How each dollar repaid splits between paying down the loan and servicing interest."
        >
          <AmortizationChart data={yearlySummary} />
        </Card>

        <Card title="Year-end breakdown">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2">Year</th>
                  <th className="pb-2 text-right">Balance</th>
                  <th className="pb-2 text-right">Cum. principal</th>
                  <th className="pb-2 text-right">Cum. interest</th>
                  <th className="pb-2 text-right">% principal</th>
                  <th className="pb-2 text-right">% interest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {yearlySummary.map((row) => (
                  <tr key={row.year}>
                    <td className="py-2 text-slate-600">{row.year}</td>
                    <td className="py-2 text-right text-slate-700">
                      <Money value={row.balance} />
                    </td>
                    <td className="py-2 text-right text-emerald-600">
                      <Money value={row.cumulativePrincipal} />
                    </td>
                    <td className="py-2 text-right text-rose-600">
                      <Money value={row.cumulativeInterest} />
                    </td>
                    <td className="py-2 text-right text-slate-700">
                      {(row.principalPct * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 text-right text-slate-700">
                      {(row.interestPct * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <p className="mt-8 text-xs text-slate-400">Estimates only — not financial advice.</p>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${accent ? "text-indigo-700" : "text-slate-900"}`}>
        <Money value={value} />
      </p>
    </div>
  );
}
