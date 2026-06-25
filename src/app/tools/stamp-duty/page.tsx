"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, Field, Money, NumberInput, Select } from "@/components/ui";
import {
  calcBSD,
  calcABSDForBuyers,
  jointAbsdRate,
  type Buyer,
  type BuyerProfile,
} from "@/lib/finance";

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

function newBuyer(): Buyer {
  return { profile: "citizen", propertyCount: 1, cash: 0, cpf: 0 };
}

export default function StampDutyPage() {
  const [price, setPrice] = useState(1_500_000);
  const [buyers, setBuyers] = useState<Buyer[]>([newBuyer()]);

  const bsd = useMemo(() => calcBSD(price), [price]);
  const absd = useMemo(() => calcABSDForBuyers(price, buyers), [price, buyers]);
  const absdPct = useMemo(() => jointAbsdRate(buyers), [buyers]);

  const update = (index: number, patch: Partial<Buyer>) =>
    setBuyers((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">
        ← Back to tools
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Stamp Duty Calculator</h1>
      <p className="mt-1 text-sm text-slate-600">
        Buyer&apos;s Stamp Duty (BSD) plus Additional Buyer&apos;s Stamp Duty (ABSD). Joint
        purchases use the highest ABSD rate among co-owners.
      </p>

      <div className="mt-8 space-y-6">
        <Card title="Purchase">
          <Field label="Purchase price">
            <NumberInput value={price} onChange={setPrice} min={0} step={10_000} prefix="S$" />
          </Field>
        </Card>

        {buyers.map((buyer, i) => (
          <Card key={i} title={`Buyer ${i + 1}`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Citizenship">
                <Select
                  value={buyer.profile}
                  onChange={(profile) => update(i, { profile })}
                  options={PROFILE_OPTIONS}
                />
              </Field>
              <Field label="Property count">
                <Select
                  value={String(buyer.propertyCount) as "1" | "2" | "3"}
                  onChange={(v) => update(i, { propertyCount: Number(v) as 1 | 2 | 3 })}
                  options={COUNT_OPTIONS}
                />
              </Field>
            </div>
            {buyers.length > 1 && (
              <button
                type="button"
                onClick={() => setBuyers((prev) => prev.filter((_, idx) => idx !== i))}
                className="mt-4 text-sm text-rose-600 hover:underline"
              >
                Remove buyer
              </button>
            )}
          </Card>
        ))}

        {buyers.length < 2 && (
          <button
            type="button"
            onClick={() => setBuyers((prev) => [...prev, newBuyer()])}
            className="rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
          >
            + Add second buyer
          </button>
        )}

        <Card title="Stamp duty payable">
          <dl className="divide-y divide-slate-100 text-sm">
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-slate-600">Buyer&apos;s Stamp Duty (BSD)</dt>
              <dd className="text-slate-700">
                <Money value={bsd} />
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-slate-600">
                Additional BSD (ABSD {Math.round(absdPct * 100)}%)
              </dt>
              <dd className="text-slate-700">
                <Money value={absd} />
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="font-semibold text-slate-900">Total stamp duty</dt>
              <dd className="font-semibold text-slate-900">
                <Money value={bsd + absd} />
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <p className="mt-8 text-xs text-slate-400">
        Estimates only — not financial advice.
      </p>
    </main>
  );
}
