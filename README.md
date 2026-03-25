# E-Restaurant UK

Fullstack online restaurant app for UK usage, including:

- Customer menu and basket with GBP pricing
- Customer order placement with quantities
- Shopify online payment checkout integration
- Admin dashboard to add menu items and toggle availability
- Prisma + SQLite data layer for menu and order persistence

## Tech Stack

- Next.js (App Router) + TypeScript
- Prisma ORM + SQLite
- Shopify Storefront API for checkout
- Tailwind CSS

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
copy .env.example .env
```

3. Set required environment values in `.env`:

- `DATABASE_URL`
- `ADMIN_DASHBOARD_KEY`
- `SHOPIFY_STORE_DOMAIN`
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN`

4. Run database migration:

```bash
npx prisma migrate dev
```

5. Start app:

```bash
npm run dev
```

App URLs:

- Customer: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

## Shopify Setup Notes

1. Create products/variants in Shopify.
2. For each dish, store the Shopify variant GID in admin (format like `gid://shopify/ProductVariant/...`).
3. Ensure Storefront API access token has cart/checkout access.

The app creates a Shopify cart and redirects customer to the Shopify checkout URL.

## Scripts

- `npm run dev` - run development server
- `npm run build` - production build
- `npm run lint` - lint code
- `npm run prisma:generate` - regenerate Prisma client
- `npm run prisma:migrate` - run Prisma migrations in dev mode
- `npm run prisma:studio` - open Prisma Studio

## GitHub Issue-Driven Workflow

This repository includes:

- feature issue template: `.github/ISSUE_TEMPLATE/feature.yml`
- bug issue template: `.github/ISSUE_TEMPLATE/bug.yml`
- initial backlog: `docs/feature-backlog.md`

Recommended process:

1. Create a GitHub repo from this project.
2. Create GitHub issues from `docs/feature-backlog.md`.
3. Assign one issue at a time.
4. I can implement each issue in sequence and keep changes scoped per issue/PR.

## UK-Focused Defaults

- Locale set to `en-GB`
- GBP formatting for all menu and basket totals
- Delivery address captured in UK-friendly free-form style
