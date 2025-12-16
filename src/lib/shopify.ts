// src/lib/shopify.ts
const SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN!;
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!;
const API_VERSION = process.env.SHOPIFY_API_VERSION;

if (!SHOP_DOMAIN || !ADMIN_TOKEN) {
  throw new Error(
    "Missing Shopify env vars. Check SHOPIFY_SHOP_DOMAIN and SHOPIFY_ADMIN_API_ACCESS_TOKEN."
  );
}

export async function shopifyAdminFetch<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(
    `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": ADMIN_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
      // Important: ensure this runs only on the server (server actions do this by default)
      cache: "no-store",
    }
  );

  const json = await res.json();

  if (!res.ok || json.errors) {
    console.error("Shopify Admin API error:", JSON.stringify(json, null, 2));
    throw new Error("Shopify Admin API request failed");
  }

  return json.data as T;
}
