$ErrorActionPreference = "Stop"
$gh = "C:\Program Files\GitHub CLI\gh.exe"
$repo = "WonahGodwino/e-restaurant"

$items = @(
  @{ t = "Setup project CI"; b = "Add GitHub Actions for lint, build, and Prisma validation.`n`nAcceptance criteria:`n- Pull requests run checks on Node 20`n- Lint, build, and Prisma validation all pass" },
  @{ t = "Add authentication for admin page"; b = "Replace header key approach with proper login session auth for admin.`n`nAcceptance criteria:`n- Only authenticated admins can access add/update operations`n- Admin APIs reject unauthenticated requests" },
  @{ t = "Add menu item editing and delete flow"; b = "Allow admin to edit all menu fields and soft-delete/hide dishes.`n`nAcceptance criteria:`n- Existing item can be updated`n- Hidden/deleted item is not shown to customers" },
  @{ t = "Add image upload"; b = "Integrate image upload storage (Cloudinary or S3) into admin workflow.`n`nAcceptance criteria:`n- Admin uploads image file`n- Uploaded image preview appears on menu" },
  @{ t = "Shopify webhook payment confirmation"; b = "Listen for paid/failed Shopify checkout events and sync local order status.`n`nAcceptance criteria:`n- Order status updates automatically to PAID/FAILED" },
  @{ t = "Delivery fee and minimum order rules"; b = "Apply configurable delivery charges and minimum spend rules by postcode/zone.`n`nAcceptance criteria:`n- Basket total includes delivery fee`n- Checkout blocked with clear message when minimum not met" },
  @{ t = "Add order confirmation page and email"; b = "Create post-checkout confirmation page and send customer confirmation email.`n`nAcceptance criteria:`n- Customer gets order reference and details on page and email" },
  @{ t = "Add accessibility and performance pass"; b = "Implement accessibility and performance improvements for production quality.`n`nAcceptance criteria:`n- Lighthouse accessibility >= 90`n- Lighthouse performance >= 90" },
  @{ t = "Add VAT support"; b = "Handle VAT-inclusive pricing and show VAT breakdown on order summaries/receipts.`n`nAcceptance criteria:`n- Order stores VAT values`n- VAT shown on summaries" },
  @{ t = "Add legal pages"; b = "Add Privacy Policy, Terms, and Delivery Policy pages for UK operations.`n`nAcceptance criteria:`n- Footer links available`n- Pages are accessible and indexed" }
)

$urls = @()
foreach ($i in $items) {
  $url = & $gh issue create --repo $repo --title $i.t --body $i.b --label feature
  $urls += $url
}

$urls | ForEach-Object { Write-Output $_ }
