# Property Check Tool

An open-source Singapore property investment calculator. Model cashflow,
compare buying resale vs a new launch, estimate stamp duty and down payments,
and project your savings timeline — with every assumption adjustable.

**[Live Demo](https://property-check-tool.vercel.app/)** · **Estimates only, not financial advice.**

---

## Features

- **Resale Cashflow** — Buy an existing property today. Project up to 30 years of self-stay vs rent-out with adjustable appreciation and rental growth.
- **New Launch / BUC** — Buy a building-under-construction project. See current down payment needed, estimated price at TOP, and post-TOP cashflow.
- **Down Payment Estimator** — Up to 2 buyers, each with CPF and cash. Joint ABSD (highest rate), BSD, total upfront, and SG rule validation.
- **Stamp Duty Calculator** — BSD + ABSD with Singapore tiered rates, single or joint buyers.
- **Mortgage Calculator** — Monthly instalment and amortization schedule.
- **Downpayment Saving Projection** — Plan your savings timeline. Simulate resale payment stages and check cashflow readiness at each stage.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| State | Redux Toolkit + redux-persist |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Testing | Vitest |

---

## Getting Started

```bash
git clone https://github.com/gcgloven/property_check_tool.git
cd property_check_tool
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```
npm run test       # Run the test suite
npm run typecheck  # TypeScript check
npm run build      # Production build
```

---

## Architecture

All financial calculations live in `src/lib/finance/` as **pure, unit-tested
functions** with no framework dependency. This keeps the model transparent,
auditable, and usable independently of the UI.

```
src/
├── app/            Next.js App Router pages
├── components/     Shared React components (charts, UI primitives)
├── lib/finance/    Pure calculation engine (Singapore rules)
└── store/          Redux Toolkit slices + persist config
docs/               Version history and documentation
```

---

## Deploy

This is a standard Next.js app. Deploy anywhere that supports Node.js:

- **Vercel** — Import the repo, auto-detects Next.js, no configuration needed.
- **Netlify** — Use the Next.js build plugin.
- **Docker** — Build with `next build && next start`.

See [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for alternatives.

---

## Contributing

Issues and pull requests are welcome. The Singapore property rules
(stamp duty rates, LTV limits, progressive payment schedules) are kept as
editable constants in `src/lib/finance/constants.ts` — if you notice a
policy change, that's the file to update.

Before opening a PR:
- Run `npm run test` to ensure all tests pass.
- Run `npm run typecheck` for a clean TypeScript build.

---

## Disclaimer

This tool provides estimates based on publicly documented Singapore
property rules. Actual figures depend on bank approval, valuation,
CPF policies, and prevailing law. This is **not financial advice**.

---

## License

[MIT](LICENSE)
