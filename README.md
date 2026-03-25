# 🍽️ The British Table – UK Online Restaurant

A production-style full-stack Next.js restaurant web application built for the UK market.
Customers can browse the menu, add items to a basket, enter delivery details, and pay securely via Shopify Checkout. Admins can manage the menu through a protected admin panel.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database ORM | Prisma 7 (SQLite dev / PostgreSQL prod) |
| Payments | Shopify Storefront API |
| Locale | `en-GB` · GBP (£) · UK address format |

---

## Features

### Customer
- Browse available menu items grouped by category
- Add items to basket with quantity control
- Sticky basket sidebar with item totals
- Checkout modal with UK-format delivery address
- Secure Shopify-hosted payment page redirect

### Admin (`/admin`)
- Key-based admin login (replace with proper auth for production)
- Add, edit, and delete menu items
- Fields: name, description, category, GBP price, image URL, Shopify Variant ID, availability
- Availability toggle to show/hide items from customers

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/your-username/e-restaurant.git
cd e-restaurant
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
# Required
DATABASE_URL="file:./prisma/dev.db"
ADMIN_API_KEY="your-strong-random-secret"

# Required for Shopify payments
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN="your-store.myshopify.com"
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN="your-storefront-access-token"
```

### 3. Set up the database

```bash
npx prisma migrate dev
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the customer menu.  
Open [http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel.

---

## Shopify Configuration

1. Log in to your [Shopify Admin](https://admin.shopify.com).
2. Go to **Apps → Develop apps → Create an app**.
3. Under **API credentials → Storefront API access scopes**, enable:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_write_checkouts`
4. Copy the **Storefront API access token** into `.env` as `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`.
5. Set `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` to your store domain (e.g. `my-store.myshopify.com`).
6. For each menu item, copy its **Variant GID** from the product page in Shopify Admin and paste it into the **Shopify Variant ID** field in the admin panel. The format is `gid://shopify/ProductVariant/123456789`.

---

## API Reference

All admin endpoints require the `x-admin-key` header.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/menu` | List all available menu items (public) |
| `GET` | `/api/admin/menu` | List all menu items (admin) |
| `POST` | `/api/admin/menu` | Create a new menu item (admin) |
| `PUT` | `/api/admin/menu/:id` | Update a menu item (admin) |
| `DELETE` | `/api/admin/menu/:id` | Delete a menu item (admin) |
| `POST` | `/api/orders` | Place a new order (returns Shopify checkout URL) |

---

## UK Notes

- Currency formatted as GBP (`£`) with `en-GB` locale
- Delivery address format: `Street Address, City, Postcode`
- UK phone number placeholder (`07700 900000`)
- Footer notes: *All prices include VAT*
- `lang="en-GB"` set on the HTML element

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Customer menu & basket
│   ├── admin/page.tsx            # Admin menu management
│   ├── layout.tsx                # Shared header/footer (en-GB)
│   └── api/
│       ├── menu/route.ts         # Public menu API
│       ├── admin/menu/
│       │   ├── route.ts          # Admin menu CRUD
│       │   └── [id]/route.ts     # Admin single-item update/delete
│       └── orders/route.ts       # Order placement + Shopify checkout
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   └── shopify.ts                # Shopify Storefront checkout helper
└── generated/prisma/             # Auto-generated Prisma client

prisma/
├── schema.prisma                 # Data models: MenuItem, Order, OrderItem
└── migrations/                   # Database migrations

docs/
└── feature-backlog.md            # Planned features as issue candidates

.github/
└── ISSUE_TEMPLATE/
    ├── feature.yml               # Feature request template
    └── bug.yml                   # Bug report template
```

---

## Issue-Driven Workflow

This project is designed to be developed feature-by-feature using GitHub Issues.

1. **Push** this project to your GitHub repo.
2. **Create issues** from [`docs/feature-backlog.md`](docs/feature-backlog.md).
3. **Assign** one issue at a time (or a prioritised set).
4. Each issue maps to a focused, scoped change.

### Recommended first issues

| Priority | Issue | Description |
|---|---|---|
| 🔴 High | AUTH-1 | Replace header-key auth with proper session auth |
| 🔴 High | SHOP-1 | Shopify webhook payment confirmation |
| 🔴 High | ORDER-2 | Admin order management dashboard |
| 🔴 High | ORDER-3 | Order confirmation email |
| 🔴 High | DEVOPS-3 | Switch to PostgreSQL for production |

---

## Production Checklist

- [ ] Replace `ADMIN_API_KEY` auth with session-based authentication (AUTH-1)
- [ ] Switch `DATABASE_URL` to a hosted PostgreSQL database
- [ ] Set `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` and `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`
- [ ] Run `npx prisma migrate deploy` on each deploy
- [ ] Set up Shopify webhooks for payment confirmation (SHOP-1)
- [ ] Configure HTTPS and a custom domain

---

## Licence

MIT
