# Scriptor

Professional writing, research, editing and documentation platform for a Uganda-based
services company. It combines the public marketing site, the quote-to-delivery workflow
(quote request → quote → payment → assignment → editing → QA → delivery) and the
customer, staff and administrator dashboards in one Next.js application.

## UI showcase branch

The `ui` branch is a database-free walkthrough build. It includes representative catalogue,
project, quote, invoice, organisation, notification and analytics data in memory, signs visitors
into a demo administrator workspace automatically, and simulates form and dashboard actions in
the browser.

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No `.env` file, PostgreSQL container, seed,
object storage, email provider or login credentials are required. Demo changes reset when a page
reloads.

> The brand name `Scriptor` is a placeholder chosen because the specification does not
> name the company. Renaming it means editing `src/lib/site.ts` and the seeded content.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS with a small in-repo component set (`src/components/ui`) |
| Database | PostgreSQL 16 via Prisma |
| Auth | NextAuth (credentials, Argon2 hashes), role-based access in `src/server/policies` |
| Files | S3-compatible storage abstraction (`src/server/providers/storage`), local driver in development |
| Email | Nodemailer with a database-backed outbox |
| Tests | Vitest |

## Running locally

```bash
docker compose up -d          # PostgreSQL + MinIO
cp .env.example .env          # then fill in the values below
npm install
npx prisma migrate deploy
npm run seed
npm run dev                   # http://localhost:3000
```

Required environment variables (see `.env.example` for the full list):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Session signing secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Public base URL of the app |
| `STORAGE_DRIVER` | `local` for development, `s3` for MinIO/S3 |
| `S3_*` | Endpoint, bucket and credentials when `STORAGE_DRIVER=s3` |
| `SMTP_*` | Outbound email; unset means messages stay in the outbox |
| `MAX_UPLOAD_BYTES` | Per-file upload ceiling |

### Seed data

`npm run seed` loads the service catalogue, pricing rules, complexity and rush bands,
industries, FAQs, resource articles, subscription plans, a demo organisation and one
account per role (`admin@`, `manager@`, `editor@`, `qa@`, `finance@`, `customer@` at
`example.com`). The seed prints the shared development password; it is development-only
data and must never be loaded into a production database.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## How the domain fits together

- **Pricing** (`src/server/services/pricing.ts`) is fully configurable: base rate per word,
  complexity and rush multipliers in basis points, add-on fees and a minimum charge. Nothing
  is hard-coded in the UI, and every amount is an integer in minor units.
- **Estimates vs quotes**: the public wizard returns a non-binding estimate. A human sends a
  binding quote, which the customer accepts before an invoice is issued.
- **Workflow** (`src/server/services/workflow.ts`) encodes the 17-status lifecycle as an
  explicit transition map, so payment-before-production and QA-before-completion cannot be
  bypassed by a stray status update.
- **Access control** (`src/server/policies`) is enforced in the service layer, not the UI:
  editors only see projects they are assigned to, customers never see internal notes or
  files that are not marked customer-visible, and file downloads go through short-lived
  signed URLs after an authorisation check.
- **Guest access** (`src/server/services/account-access.ts`): converting a guest quote request
  creates the customer account and emails a single-use, 72-hour password link so the person
  who sent documents can sign in, approve the quote and download deliverables. Only the SHA-256
  hash of the link token is stored, and the same route backs "forgot password".
- **Audit** (`src/server/services/audit.ts`) records critical mutations and file downloads.

## Known limitations

- Payments use a `manual` provider (bank transfer / mobile money confirmed by finance).
  Mobile-money and card providers plug into `src/server/providers/payments`.
- No malware scanner is wired in; uploaded files are stored with `scanStatus: PENDING`
  rather than being claimed clean.
- Legal pages (terms, privacy, confidentiality, refund, acceptable use) are operational
  drafts and need review by a qualified lawyer before launch.
- Marketing content contains no testimonials, logos, statistics or case studies, because
  none were supplied. Seeded testimonials are flagged `isPlaceholder` and are not published.
- `npm audit --omit=dev` still reports transitive advisories that have no fixed release yet.
- Search is database `contains` matching rather than full-text.

## Roadmap after the MVP

Mobile-money and card payment providers, AI-assisted quality checks (suggestions only,
never overwriting a source document), a client portal for style guides and terminology,
full-text search, Playwright end-to-end coverage and per-organisation reporting exports.
