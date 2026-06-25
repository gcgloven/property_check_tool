import Link from "next/link";

const tools = [
  {
    href: "/resale",
    title: "Resale Cashflow",
    desc: "Buy a resale property today. Project N years of self-stay vs rent-out with adjustable appreciation & rental growth.",
    badge: "User Story 1",
    ready: true,
  },
  {
    href: "/new-launch",
    title: "New Launch (BUC / TOP)",
    desc: "Buy a new project that TOPs in the future. See down payment now, estimated price at TOP, and post-TOP growth.",
    badge: "User Story 2",
    ready: true,
  },
  {
    href: "/tools/down-payment",
    title: "Down Payment Estimator",
    desc: "1 or 2 buyers (citizenship, CPF, cash): down payment + BSD + ABSD + total upfront, with SG rule checks.",
    badge: "Tool",
    ready: true,
  },
  {
    href: "/tools/stamp-duty",
    title: "Stamp Duty Calculator",
    desc: "Buyer's Stamp Duty (BSD) and Additional Buyer's Stamp Duty (ABSD), single or joint buyers.",
    badge: "Tool",
    ready: true,
  },
  {
    href: "/tools/mortgage",
    title: "Mortgage Calculator",
    desc: "Monthly instalment and amortization schedule.",
    badge: "Tool",
    ready: true,
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10">
        <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">
          Singapore Property Investment
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Property Check Tool
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Model cashflow, compare buying resale vs a new launch, and see the true cost of
          ownership — with every assumption adjustable. Estimates only, not financial advice.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {tool.badge}
              </span>
              {!tool.ready && (
                <span className="text-xs font-medium text-amber-600">Coming in v0.1</span>
              )}
            </div>
            <h2 className="mt-3 text-lg font-semibold group-hover:text-indigo-700">
              {tool.title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{tool.desc}</p>
          </Link>
        ))}
      </section>

      <footer className="mt-12 text-xs text-slate-400">
        v0.0.0 — foundation scaffold. Calculation engine in <code>src/lib/finance</code>.
      </footer>
    </main>
  );
}
