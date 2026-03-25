type ShopifyCartLineInput = {
  merchandiseId: string;
  quantity: number;
};

type ShopifyCartCreateResponse = {
  data?: {
    cartCreate?: {
      cart?: {
        id: string;
        checkoutUrl: string;
      };
      userErrors?: Array<{ field?: string[]; message: string }>;
    };
  };
  errors?: Array<{ message: string }>;
};

export async function createShopifyCart(lines: ShopifyCartLineInput[]) {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const storefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  if (!storeDomain || !storefrontToken) {
    throw new Error("Shopify environment variables are missing.");
  }

  const endpoint = `https://${storeDomain}/api/2025-01/graphql.json`;
  const query = `
    mutation CartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      lines,
      buyerIdentity: {
        countryCode: "GB",
      },
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": storefrontToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to connect to Shopify checkout service.");
  }

  const json = (await response.json()) as ShopifyCartCreateResponse;

  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message ?? "Shopify error.");
  }

  const userErrors = json.data?.cartCreate?.userErrors ?? [];
  if (userErrors.length) {
    throw new Error(userErrors[0]?.message ?? "Shopify checkout could not be created.");
  }

  const cart = json.data?.cartCreate?.cart;
  if (!cart?.checkoutUrl) {
    throw new Error("Shopify did not return a checkout URL.");
  }

  return {
    cartId: cart.id,
    checkoutUrl: cart.checkoutUrl,
  };
}
