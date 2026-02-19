
// lib/shopify.ts
// This single file replaces the entire Shopify boilerplate.
import Client from 'shopify-buy';

// 1. Initialize the client using your environment variables
export const shopifyClient = Client.buildClient({
    domain: process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || 'your-store.myshopify.com',
    storefrontAccessToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || 'your_token',
    apiVersion: '2025-01',
});

// 2. Helper function to fetch products
export async function getProducts() {
    const products = await shopifyClient.product.fetchAll();
    return products;
}

// 3. Helper function to create a cart and get a checkout URL
export async function createCheckout(variantId: string) {
    // Create an empty checkout
    const checkout = await shopifyClient.checkout.create();

    // Add the selected product to the checkout
    const lineItemsToAdd = [{ variantId, quantity: 1 }];
    const updatedCheckout = await shopifyClient.checkout.addLineItems(checkout.id, lineItemsToAdd);

    // Return the secure Shopify checkout URL
    return updatedCheckout.webUrl;
}