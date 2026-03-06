# Psychiatric Assessment Mastery: Strategy & Technical Roadmap

## 1. Product Strategy & The Value Ladder
We use a **Tiered Value Ladder** to maximize Average Order Value (AOV). The goal is to anchor users against the high-value "Mastery Bundle."

| Class | Product Name | Price | What's Included | Target Audience |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1 (Entry)** | Digital "On-the-Go" Edition | **$9.99** | • PDF / eBook Download<br>• Mobile-optimized | Students on a budget or needing quick reference on iPad/Phone. |
| **Tier 2 (Core)** | The Physical Workbook | **$29.99** | • High-quality Paperback (Shipped)<br>• Write-in templates | The primary audience who needs a desk reference for clinicals. |
| **Tier 3 (Anchor)** | ✨ **The Mastery Bundle** | **$49.99** | • Physical Book (Shipped)<br>• Instant PDF Download<br>• **1-Year AI Clinical Tools** | Serious students who want the "unfair advantage" of an AI mentor. |

**Sales Psychology:** The $49.99 bundle feels like a "steal" because the AI tools alone could be a SaaS subscription. You effectively get the digital + AI for just $20 more than the book.

---

## 2. Publishing & Fulfillment Channels

### Amazon KDP (The Volume Channel)
*   **Action:** Publish the **Paperback ($29.99)** and **Kindle eBook ($9.99)** here.
*   **Strategy:** Use Amazon for organic traffic and trust. Amazon takes ~40% royalty but brings the customers.
*   **Critical:** Do **NOT** sell the "Mastery Bundle" here (Amazon doesn't support bundles well). Use the book's first page (QR Code) to drive Amazon buyers back to your site for the "AI Upgrade."

### Shopify Headless (The Margin Channel)
*   **Action:** Sell the **Mastery Bundle** here.
*   **Fulfillment:**
    *   **Digital/AI:** Delivered instantly via Next.js (Access) + Email (PDF).
    *   **Physical:**
        *   *Option A (Manual):* Ship copies from home inventory.
        *   *Option B (Automated):* Connect **Lulu Direct** or **IngramSpark** app to Shopify to print and ship automatically.

---

## 3. Technical Architecture (Deployed)

We have implemented a modern **Headless Architecture** for maximum speed and AI customization.

*   **Frontend:** Next.js 15 (App Router) on Vercel.
    *   *Why:* Perfect SEO, instant page loads, custom AI UI.
*   **Commerce:** Shopify (Storefront API).
    *   *Why:* Best-in-class checkout and inventory management.
*   **AI Engine:** Google Gemini Pro 1.5 (via Next.js API Routes).
    *   *Why:* Fast, cost-effective, and capable of clinical reasoning.
*   **Database:** (Optional) Vercel Postgres / Supabase.
    *   *Usage:* To save user "Saved Scripts" or "Past SOAP Notes" in the future.

### Vercel Environment Configuration
These variables are currently active in your deployment:
*   `GEMINI_API_KEY`: Connects to Google AI.
*   `SHOPIFY_STOREFRONT_ACCESS_TOKEN`: Allows fetching products.
*   `SHOPIFY_STORE_DOMAIN`: `psychassessmentguide.myshopify.com`

---

## 4. Growth Strategy (The "Better Approach")

### A. Lead Capture (The "Money is in the List")
You have a lead magnet section ("Ultimate MSE Cheat Sheet").
*   **Strategy:** Don't just collect emails—nurture them.
*   **Tech:** Integrate **Resend** (API) or **ConvertKit** (Form Embed).
*   **Flow:**
    1.  User enters email for Cheat Sheet.
    2.  System sends immediate email with PDF link.
    3.  System waits 2 days -> Sends "Did you see these Preceptor Red Flags?" (Value).
    4.  System waits 2 days -> Offers "10% Off Mastery Bundle" (Conversion).

### B. SEO & Content
Your new design has an "Author" and "Features" section, but Google loves fresh content.
*   **Strategy:** Add a `/blog` section to the Next.js site.
*   **Topics:** "How to write a Suicide Risk Assessment", "5 Phrases to De-escalate Mania".
*   **AI Leverage:** Use your own Gemini tool to help draft these articles, then review them as the expert.

### C. Analytics & Conversion Rate Optimization (CRO)
*   **Tracking:** Install **Vercel Analytics** (Privacy-friendly) or **Google Analytics 4**.
*   **Heatmaps:** Install **Microsoft Clarity** (Free) to see where students get stuck on the page.
*   **Test:** A/B test the "Hero Headline". Try "Don't Just Read" vs "Stop Faking Clinicals".

---

## 5. AI Prompt Engineering Strategy

To make the AI truly "Mastery" level (and not just generic ChatGPT), we use **Context Injection**.

**Current Script Doctor Prompt:**
> "You are Tonia Ojomo. Provide a direct, empathetic script... Keep tone professional."

**Enhanced Prompt Strategy (Next Step):**
We should inject specific "Golden Phrases" from your book into the prompt background.
*   *Example:* If the user asks about "Suicide Risk", we silently inject your "CASE" acronym details into the prompt so the AI follows *your* methodology.

---

## 6. Launch Checklist
- [x] **Design:** Landing page matches "Workbook" aesthetic.
- [x] **AI:** Script Doctor & SOAP Architect working.
- [ ] **Payments:** Activate Shopify Payments (requires business info).
- [ ] **Domain:** Connect `psychassessmentmastery.com` to Vercel (Custom Domain).
- [ ] **Legal:** Add Privacy Policy & Terms (Footer links) - Required for ads.
- [ ] **Email:** Connect Resend API for the Lead Magnet form.
