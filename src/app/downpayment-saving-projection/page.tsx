"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card, Field, NumberInput, formatSGD } from "@/components/ui";
import {
  computeDownpaymentSaving,
  type ScenarioName,
} from "@/lib/finance";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addBuyer,
  removeBuyer,
  resetDownpaymentSaving,
  setPropertyField,
  setScenario,
  setTimelineField,
  updateBuyer,
} from "@/store/slices/downpaymentSavingSlice";

const SCENARIO_OPTIONS: ReadonlyArray<{ value: ScenarioName; label: string; desc: string }> = [
  { value: "conservative", label: "Conservative", desc: "8-week completion, S$8k legal" },
  { value: "baseCase", label: "Base Case", desc: "12-week completion, S$6k legal" },
  { value: "stretched", label: "Stretched", desc: "16-week completion, S$6k legal" },
];

export default function DownpaymentSavingPage() {
  const state = useAppSelector((s) => s.downpaymentSaving);
  const dispatch = useAppDispatch();

  const output = useMemo(() => computeDownpaymentSaving(state), [state]);

  const showMismatchWarning =
    state.property.manualPropertyValueEnabled &&
    Math.abs(state.property.manualPropertyValue - state.property.squareFeet * state.property.psf) > 0.01;

  const completionDay = state.timeline.otpExerciseDays + state.timeline.completionWeeksAfterExercise * 7;
  const showTimelineWarning = completionDay < 56;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">
        &larr; Back to tools
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Downpayment Saving Projection</h1>
      <p className="mt-1 text-sm text-slate-600">
        Plan your resale purchase savings. Adjust property price, CPF, cash, and monthly savings
        to see how long until you can afford the down payment and whether you can meet each payment stage.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Left Column &mdash; Inputs */}
        <div className="space-y-6">
          {/* Section 1: Property Inputs */}
          <Card title="Property">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Square feet">
                <NumberInput
                  value={state.property.squareFeet}
                  onChange={(v) => dispatch(setPropertyField({ squareFeet: v }))}
                  min={0}
                  step={10}
                  suffix="sqft"
                />
              </Field>
              <Field label="PSF">
                <NumberInput
                  value={state.property.psf}
                  onChange={(v) => dispatch(setPropertyField({ psf: v }))}
                  min={0}
                  step={10}
                  prefix="S$"
                />
              </Field>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={state.property.manualPropertyValueEnabled}
                  onChange={(e) =>
                    dispatch(setPropertyField({ manualPropertyValueEnabled: e.target.checked }))
                  }
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Manual property value
              </label>
              {!state.property.manualPropertyValueEnabled && (
                <span className="text-sm text-slate-400">
                  = {formatSGD(state.property.squareFeet * state.property.psf)}
                </span>
              )}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Property value">
                <NumberInput
                  value={state.property.manualPropertyValue}
                  onChange={(v) => dispatch(setPropertyField({ manualPropertyValue: v }))}
                  min={0}
                  step={10000}
                  prefix="S$"
                />
              </Field>
              <Field label="Down payment" hint="% of price">
                <NumberInput
                  value={state.property.downpaymentPercent}
                  onChange={(v) => dispatch(setPropertyField({ downpaymentPercent: v }))}
                  min={5}
                  max={100}
                  step={1}
                  suffix="%"
                />
              </Field>
              <Field label="Legal fee">
                <NumberInput
                  value={state.property.legalFee}
                  onChange={(v) => dispatch(setPropertyField({ legalFee: v }))}
                  min={0}
                  step={500}
                  prefix="S$"
                />
              </Field>
            </div>
          </Card>

          {/* Section 2: Buyer Funds */}
          {state.buyers.map((buyer, i) => (
            <Card key={i} title={`Buyer ${i + 1} &mdash; ${buyer.name}`}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name">
                  <input
                    type="text"
                    value={buyer.name}
                    onChange={(e) => dispatch(updateBuyer({ index: i, patch: { name: e.target.value } }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </Field>
                <Field label="Current CPF">
                  <NumberInput
                    value={buyer.currentCpf}
                    onChange={(v) => dispatch(updateBuyer({ index: i, patch: { currentCpf: v } }))}
                    min={0}
                    step={1000}
                    prefix="S$"
                  />
                </Field>
                <Field label="Current cash savings">
                  <NumberInput
                    value={buyer.currentCashSavings}
                    onChange={(v) => dispatch(updateBuyer({ index: i, patch: { currentCashSavings: v } }))}
                    min={0}
                    step={1000}
                    prefix="S$"
                  />
                </Field>
                <Field label="Extra savings / family support">
                  <NumberInput
                    value={buyer.extraSavings}
                    onChange={(v) => dispatch(updateBuyer({ index: i, patch: { extraSavings: v } }))}
                    min={0}
                    step={5000}
                    prefix="S$"
                  />
                </Field>
                <Field label="Monthly CPF contribution">
                  <NumberInput
                    value={buyer.monthlyCpfContribution}
                    onChange={(v) => dispatch(updateBuyer({ index: i, patch: { monthlyCpfContribution: v } }))}
                    min={0}
                    step={100}
                    prefix="S$"
                  />
                </Field>
                <Field label="Monthly cash saving">
                  <NumberInput
                    value={buyer.monthlyCashSaving}
                    onChange={(v) => dispatch(updateBuyer({ index: i, patch: { monthlyCashSaving: v } }))}
                    min={0}
                    step={100}
                    prefix="S$"
                  />
                </Field>
              </div>
              {state.buyers.length > 1 && (
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
            {state.buyers.length < 2 && (
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
              onClick={() => dispatch(resetDownpaymentSaving())}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>
          </div>

          {/* Section 3: Timeline Assumptions */}
          <Card title="Timeline Assumptions">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Option fee">
                <NumberInput
                  value={state.timeline.optionFeePercent}
                  onChange={(v) => dispatch(setTimelineField({ optionFeePercent: v }))}
                  min={0}
                  max={100}
                  step={0.5}
                  suffix="%"
                />
              </Field>
              <Field label="Exercise fee">
                <NumberInput
                  value={state.timeline.exerciseFeePercent}
                  onChange={(v) => dispatch(setTimelineField({ exerciseFeePercent: v }))}
                  min={0}
                  max={100}
                  step={0.5}
                  suffix="%"
                />
              </Field>
              <Field label="OTP exercise period">
                <NumberInput
                  value={state.timeline.otpExerciseDays}
                  onChange={(v) => dispatch(setTimelineField({ otpExerciseDays: v }))}
                  min={1}
                  step={1}
                  suffix="days"
                />
              </Field>
              <Field label="Stamp duty deadline after exercise">
                <NumberInput
                  value={state.timeline.stampDutyDueDaysAfterExercise}
                  onChange={(v) => dispatch(setTimelineField({ stampDutyDueDaysAfterExercise: v }))}
                  min={1}
                  step={1}
                  suffix="days"
                />
              </Field>
              <Field label="Completion period after exercise">
                <NumberInput
                  value={state.timeline.completionWeeksAfterExercise}
                  onChange={(v) => dispatch(setTimelineField({ completionWeeksAfterExercise: v }))}
                  min={1}
                  step={1}
                  suffix="weeks"
                />
              </Field>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium text-slate-700">Scenario</p>
              <div className="mt-2 flex gap-2">
                {SCENARIO_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => dispatch(setScenario(opt.value))}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                      state.scenario === opt.value
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                    title={opt.desc}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column &mdash; Results */}
        <div className="space-y-6">
          {/* Warnings */}
          <div className="space-y-2">
            {showMismatchWarning && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <span className="font-medium">Note: </span>
                Your manual property value differs from sqft &times; psf. Sqft &times; PSF = {formatSGD(output.computedPropertyValue, 2)}, while manual value = {formatSGD(state.property.manualPropertyValue, 2)}.
              </div>
            )}

            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <span className="font-medium">Note: </span>
              Stamp duty is usually due shortly after OTP exercise, not at completion. Make sure you have enough liquidity before exercising the OTP.
            </div>

            {output.currentDeficit > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <span className="font-medium">Deficit: </span>
                You are currently short by {formatSGD(output.currentDeficit, 2)}. Based on your monthly CPF and cash savings of {formatSGD(output.combinedMonthlyAccumulation, 2)}/month, you need around {output.monthsNeeded.toFixed(2)} months to close the gap.
              </div>
            )}

            {showTimelineWarning && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <span className="font-medium">Note: </span>
                This is a tight resale timeline. Confirm that your bank loan, CPF usage, legal checks, and fund transfer can be completed in time.
              </div>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <SummaryCard label="Property Value" value={output.propertyValue} />
            <SummaryCard label="Downpayment" value={output.downpayment} />
            <SummaryCard label="Stamp Duty (BSD)" value={output.stampDuty} />
            <SummaryCard label="Legal Fee" value={output.legalFee} />
            <SummaryCard label="Total Payment Needed" value={output.totalPaymentNeeded} strong />
            <SummaryCard label="Combined Available Funds" value={output.combinedAvailableFunds} />
            <SummaryCard
              label="Current Deficit / Surplus"
              value={output.currentDeficit}
              negative={output.currentDeficit > 0}
              strong
            />
            <SummaryCard label="Months Needed" value={output.monthsNeeded} isMonths />
          </div>

          {/* Payment Timeline Table */}
          <Card title="Payment Timeline">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-4">Stage</th>
                    <th className="py-2 pr-4">Day</th>
                    <th className="py-2 pr-4 text-right">Amount</th>
                    <th className="py-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {output.paymentStages.map((stage) => (
                    <tr key={stage.stage} className="border-b border-slate-100">
                      <td className="py-2.5 pr-4 font-medium text-slate-900">{stage.stage}</td>
                      <td className="py-2.5 pr-4 text-slate-600">Day {stage.day}</td>
                      <td className="py-2.5 pr-4 text-right text-slate-900">
                        {formatSGD(stage.amount, 2)}
                      </td>
                      <td className="py-2.5 text-slate-500">{stage.description}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold text-slate-900">
                    <td className="py-2.5 pr-4">Total</td>
                    <td className="py-2.5 pr-4">&mdash;</td>
                    <td className="py-2.5 pr-4 text-right">
                      {formatSGD(output.totalPaymentNeeded, 2)}
                    </td>
                    <td className="py-2.5">Total upfront payment needed</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Cashflow Readiness Table */}
          <Card title="Cashflow Readiness">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-4">Stage</th>
                    <th className="py-2 pr-4 text-right">Available Funds</th>
                    <th className="py-2 pr-4 text-right">Cumulative Due</th>
                    <th className="py-2 pr-4 text-right">Surplus / Deficit</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {output.cashflowReadiness.map((row) => (
                    <tr key={row.stage} className="border-b border-slate-100">
                      <td className="py-2.5 pr-4 font-medium text-slate-900">{row.stage}</td>
                      <td className="py-2.5 pr-4 text-right text-slate-900">
                        {formatSGD(row.availableFunds, 2)}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-slate-900">
                        {formatSGD(row.cumulativePaymentDue, 2)}
                      </td>
                      <td className={`py-2.5 pr-4 text-right ${
                        row.surplusOrDeficit >= 0 ? "text-green-600" : "text-rose-600"
                      }`}>
                        {row.surplusOrDeficit >= 0 ? "Surplus" : "Deficit"} {formatSGD(Math.abs(row.surplusOrDeficit), 2)}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            row.status === "Ready"
                              ? "bg-green-100 text-green-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <p className="mt-8 text-xs text-slate-400">
        Estimates only &mdash; not financial advice. BSD uses Singapore tiered rates.
        Rates configurable in <code>src/lib/finance/constants.ts</code>.
      </p>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  strong,
  negative,
  isMonths,
}: {
  label: string;
  value: number;
  strong?: boolean;
  negative?: boolean;
  isMonths?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`mt-1 text-xl font-bold ${
          negative ? "text-rose-600" : "text-slate-900"
        }`}
      >
        {isMonths ? `${value.toFixed(2)} months` : formatSGD(value, 2)}
      </p>
    </div>
  );
}
