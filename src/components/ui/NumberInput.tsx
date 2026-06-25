"use client";

interface NumberInputProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
}

export function NumberInput({
  id,
  value,
  onChange,
  min,
  max,
  step,
  prefix,
  suffix,
}: NumberInputProps) {
  return (
    <div className="flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
      {prefix && <span className="pl-3 text-sm text-slate-400">{prefix}</span>}
      <input
        id={id}
        type="number"
        inputMode="decimal"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 outline-none"
      />
      {suffix && <span className="pr-3 text-sm text-slate-400">{suffix}</span>}
    </div>
  );
}
