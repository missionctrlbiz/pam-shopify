
# Deployment Guide (Vercel + Shopify)

You are ready to launch! Follow these steps to deploy your application to Vercel and connect it to your Shopify domain.

## 1. Prerequisites
- A Vercel account.
- A GitHub/GitLab/Bitbucket repository with this code pushed.
- Your Shopify domain (e.g., `psychassessmentguide.com` or `psychassessmentguide-com.myshopify.com`).

## 2. Deploy to Vercel
1.  **Login to Vercel** and click **"Add New"** -> **"Project"**.
2.  **Import your repository**.
3.  **Configure Project:**
    *   **Framework Preset:** Next.js (should detect automatically).
    *   **Root Directory:** `./` (default).
    *   **Environment Variables:** Copy these from your `.env.local` file:
        *   `NEXT_PUBLIC_SHOPIFY_DOMAIN`: `psychassessmentguide-com.myshopify.com`
        *   `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`: `102e7c793f52b21f18485069051cpd279`
        *   `GEMINI_API_KEY`: `AIzaSyC_gfs8_VS1sLyUDGAogtvPA1qH52EROjI`
4.  Click **Deploy**.

## 3. Connect Custom Domain (if you have one)
1.  In your Vercel Project Dashboard, go to **Settings** -> **Domains**.
2.  Enter your custom domain (e.g., `www.psychassessmentguide.com`).
3.  Vercel will give you DNS records (A Record and CNAME). Add these to your domain registrar (GoDaddy, Namecheap, or Shopify if you bought the domain there).

## 4. Pointing Shopify to Vercel (Headless Setup)
Since this is a headless storefront, you want your main domain to point to Vercel, not the default Shopify theme.

*   **If you manage DNS in Shopify:**
    1.  Go to Shopify Admin -> Settings -> Domains.
    2.  Click on your domain -> DNS Settings.
    3.  Update the A record to Vercel's IP (76.76.21.21) and CNAME to `cname.vercel-dns.com`.
*   **Keep Shopify functionality:** Even though the frontend is Vercel, the checkout will still redirect to `checkout.shopify.com` or your store's checkout domain. This is normal and secure.

## 5. Launch Check
- Verify the "Add to Cart" buttons work on the live Vercel URL.
- Test the AI tools to ensure the API key is working in production.
- Check mobile responsiveness on your phone.

You are good to go! 🚀
