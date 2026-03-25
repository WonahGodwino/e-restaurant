const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ?? "";
const SHOPIFY_STOREFRONT_ACCESS_TOKEN =
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? "";

const STOREFRONT_API_URL = `https://${SHOPIFY_STORE_DOMAIN}/api/2024-04/graphql.json`;

interface ShopifyLineItem {
  variantId: string;
  quantity: number;
}

interface ShopifyAddress {
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  country: string;
  zip: string;
  phone?: string;
}

interface ShopifyCheckoutResponse {
  checkoutCreate: {
    checkout: {
      id: string;
      webUrl: string;
    } | null;
    checkoutUserErrors: Array<{ message: string; field: string[] }>;
  };
}

/**
 * Creates a Shopify Storefront checkout session and returns the hosted checkout URL.
 * Call this from a Server Action or API route – never expose the token in client code.
 */
export async function createShopifyCheckout(
  lineItems: ShopifyLineItem[],
  shippingAddress: ShopifyAddress,
  email: string
): Promise<string> {
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
    throw new Error(
      "Shopify environment variables are not configured. " +
        "Set NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN and NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN."
    );
  }

  const mutation = `
    mutation checkoutCreate($input: CheckoutCreateInput!) {
      checkoutCreate(input: $input) {
        checkout {
          id
          webUrl
        }
        checkoutUserErrors {
          message
          field
        }
      }
    }
  `;

  const variables = {
    input: {
      email,
      lineItems: lineItems.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      shippingAddress,
    },
  };

  const response = await fetch(STOREFRONT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query: mutation, variables }),
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as { data: ShopifyCheckoutResponse };
  const { checkout, checkoutUserErrors } = json.data.checkoutCreate;

  if (checkoutUserErrors.length > 0) {
    throw new Error(
      `Shopify checkout errors: ${checkoutUserErrors.map((e) => e.message).join(", ")}`
    );
  }

  if (!checkout) {
    throw new Error("Shopify did not return a checkout session.");
  }

  return checkout.webUrl;
}
