export function formatSGD(n: number, maximumFractionDigits = 0): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits,
  });
}

export function Money({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return <span className={className}>{formatSGD(value)}</span>;
}
