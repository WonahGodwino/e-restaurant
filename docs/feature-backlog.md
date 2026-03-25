# E-Restaurant Feature Backlog

Use the items below as GitHub issues when you create your repository.

## Foundation

1. Setup project CI
- Add GitHub Actions for lint, build, and Prisma validation.
- Acceptance: Pull requests run checks on Node 20 and pass.

2. Add authentication for admin page
- Replace header key approach with proper login session.
- Acceptance: Only authenticated admins can access add/update operations.

## Menu and Admin

3. Add menu item editing and delete flow
- Admin can edit all fields and soft-delete dishes.
- Acceptance: Existing item can be updated and hidden from customer menu.

4. Add image upload
- Integrate image hosting (Cloudinary/S3) with upload UI.
- Acceptance: Admin uploads image file and sees preview on menu.

## Ordering and Payments

5. Shopify webhook payment confirmation
- Listen for paid/failed checkout updates and sync order status.
- Acceptance: Order status updates automatically to PAID/FAILED.

6. Delivery fee and minimum order rules
- Apply configurable delivery charges and minimum spend by postcode.
- Acceptance: Basket total includes rules and validates before checkout.

## Customer Experience

7. Add order confirmation page and email
- Show order summary after checkout return and send customer email.
- Acceptance: Customer receives order reference and details.

8. Add accessibility and performance pass
- Meet WCAG basics and optimize LCP/CLS.
- Acceptance: Lighthouse score >= 90 for accessibility and performance.

## UK Compliance

9. Add VAT support
- Handle VAT-inclusive pricing and receipts.
- Acceptance: Order stores VAT values and shows VAT on summaries.

10. Add legal pages
- Privacy policy, terms, and delivery policy pages.
- Acceptance: Footer links and pages are available and indexed.
