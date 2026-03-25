# Feature Backlog

This document lists planned features for the UK-focused online restaurant. Create individual GitHub issues from each item below, then work on them independently.

---

## 🔐 Authentication & Security

### [AUTH-1] Production admin authentication
**Area:** Authentication / Admin  
**Priority:** High  
Replace the current header-key auth with a proper session-based admin login (e.g. NextAuth.js with credentials provider, or Clerk).

**Acceptance criteria:**
- [ ] Admin can sign in with email + password
- [ ] Session is persisted via secure HTTP-only cookie
- [ ] Unauthenticated requests to `/admin` redirect to `/admin/login`
- [ ] API routes validate session server-side

---

### [AUTH-2] Rate limiting on order and auth endpoints
**Area:** API / Backend  
**Priority:** Medium  
Add rate limiting to `/api/orders` and admin login to prevent abuse.

---

## 💳 Shopify Integration

### [SHOP-1] Shopify webhook payment confirmation
**Area:** Shopify Integration  
**Priority:** High  
Implement a Shopify webhook endpoint (`/api/webhooks/shopify`) that listens for `orders/paid` events and marks the corresponding order as `paid` in the database.

**Acceptance criteria:**
- [ ] Webhook endpoint verifies HMAC signature using `SHOPIFY_WEBHOOK_SECRET`
- [ ] Order status updated from `pending` → `paid` on successful payment
- [ ] Failed/rejected payments mark order as `payment_failed`

---

### [SHOP-2] Display Shopify product images from Storefront API
**Area:** Customer UI / Shopify Integration  
**Priority:** Low  
Instead of storing image URLs manually, fetch product images from Shopify Storefront API and display them on the menu.

---

## 🍽️ Menu & Ordering

### [MENU-1] Menu item categories management
**Area:** Admin UI  
**Priority:** Medium  
Allow admins to create, rename, and reorder menu categories from the admin panel.

---

### [MENU-2] Allergen & dietary information
**Area:** Customer UI / Admin UI  
**Priority:** Medium  
Add allergen tags (e.g. gluten, dairy, nuts) and dietary badges (vegetarian, vegan, halal) to menu items.

**Acceptance criteria:**
- [ ] Admin can set allergen tags and dietary badges per item
- [ ] Customer sees allergen info and dietary icons on menu cards
- [ ] UK Food Information Regulations compliant display

---

### [MENU-3] Item availability toggle from table view
**Area:** Admin UI  
**Priority:** Low  
Allow toggling item availability with a single click from the admin table, without opening the edit modal.

---

### [ORDER-1] Order history and status page for customers
**Area:** Customer UI / API  
**Priority:** Medium  
After placing an order, customers can view their order status at `/orders/[orderId]` using a lookup token or email + order ID.

---

### [ORDER-2] Admin order management dashboard
**Area:** Admin UI / API  
**Priority:** High  
Add an admin page to view all orders, filter by status, and manually update order status.

**Acceptance criteria:**
- [ ] List all orders with customer name, total, status, and date
- [ ] Filter by status (pending / paid / dispatched / cancelled)
- [ ] Ability to mark order as dispatched or cancelled

---

### [ORDER-3] Order confirmation email
**Area:** API / Backend  
**Priority:** High  
Send an order confirmation email to the customer after placing an order using Resend or SendGrid.

---

## 🚚 Delivery

### [DEL-1] Postcode delivery zone validation
**Area:** Customer UI / API  
**Priority:** Medium  
Validate UK postcodes during checkout and only accept orders within defined delivery zones.

---

### [DEL-2] Estimated delivery time display
**Area:** Customer UI  
**Priority:** Low  
Show an estimated delivery time on the checkout page and order confirmation.

---

## 🎨 UI/UX Improvements

### [UX-1] Menu search and filter
**Area:** Customer UI  
**Priority:** Medium  
Add a search bar and category filter to help customers find items quickly.

---

### [UX-2] Mobile-optimised basket drawer
**Area:** Customer UI  
**Priority:** Medium  
Replace the sidebar basket with a slide-out drawer on mobile devices.

---

### [UX-3] Loading skeletons
**Area:** Customer UI  
**Priority:** Low  
Replace the loading spinner with skeleton cards for a better perceived performance.

---

## ⚙️ DevOps & Infrastructure

### [DEVOPS-1] Add CI/CD with GitHub Actions
**Area:** DevOps / CI  
**Priority:** Medium  
Set up a GitHub Actions workflow that runs linting, type-checking, and builds on every push and pull request.

---

### [DEVOPS-2] Database migrations on deploy
**Area:** DevOps / Database  
**Priority:** Medium  
Add a `prisma migrate deploy` step to the deployment pipeline so schema changes are applied automatically.

---

### [DEVOPS-3] Switch to PostgreSQL for production
**Area:** Database / Prisma  
**Priority:** High  
Replace SQLite with a hosted PostgreSQL database (e.g. Supabase, Neon, or Railway) for production use.

---

## 📊 Analytics

### [ANAL-1] Basic sales dashboard
**Area:** Admin UI / API  
**Priority:** Low  
Show basic metrics on the admin dashboard: total orders today, revenue today, most popular items.
