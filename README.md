# Property Check Tool

A Singapore property investment decision-support web app. Model cashflow,
compare buying resale vs a new launch, estimate stamp duty and down payments,
and project your savings timeline — with every assumption adjustable.

**Estimates only, not financial advice.**

---

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Redux Toolkit** + redux-persist (localStorage)
- **Tailwind CSS v4**
- **Recharts** (charts)
- **Vitest** (tests)

---

## Tools

| Tool | Route |
|------|-------|
| Resale Cashflow (Story 1) | `/resale` |
| New Launch / BUC (Story 2) | `/new-launch` |
| Down Payment Estimator | `/tools/down-payment` |
| Stamp Duty Calculator | `/tools/stamp-duty` |
| Mortgage Calculator | `/tools/mortgage` |
| Downpayment Saving Projection | `/downpayment-saving-projection` |

---

## Getting Started (Local)

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
# → http://localhost:3000

# Run tests
npm run test

# Type check
npm run typecheck

# Production build
npm run build
```

---

## Deploy to Vercel

This project is built with Next.js and works out of the box on
[Vercel](https://vercel.com).

### Option 1 — Vercel Dashboard (easiest)

1. Push this repo to GitHub, GitLab, or Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Vercel auto-detects Next.js — no configuration needed.
4. Click **Deploy**.

### Option 2 — Vercel CLI

```bash
# Install the Vercel CLI
npm i -g vercel

# Link the project (one-time)
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Build settings (auto-detected)

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Build Command | `next build` |
| Output Directory | `.next` |
| Install Command | `npm install` |

### Environment variables

No environment variables are required for the app to run. If you add
API keys or secrets later, set them in the Vercel dashboard under
**Settings → Environment Variables**.

---

## Project Structure

```
docs/           ← version logs, documentation (not deployed)
src/
  app/          ← Next.js App Router pages
  components/   ← shared React components (charts, UI primitives)
  lib/finance/  ← pure calculation engine (Singapore rules)
  store/        ← Redux Toolkit slices + persist config
```

All finance math lives in `src/lib/finance/` as pure, unit-tested
functions with no React or Redux dependency.

---

## Security Notes

- `.env*` files are gitignored — never commit secrets.
- The `docs/`, `.agents/`, `skills/` directories are excluded from
  deployment (listed in `.gitignore`).
- All calculations run client-side; no server-side secrets are needed.

---

## Disclaimer

This tool provides estimates based on Singapore property rules
(stamp duty rates, LTV limits, progressive payment schedules).
Actual figures depend on bank approval, valuation, CPF rules, and
prevailing policy. This is **not financial advice**.

