# Psychiatric Assessment Mastery™ — Technical Handover Manual

**Prepared for:** Anthonia Ojomo  
**Platform:** psychassessmentguide.com  
**Stack:** Next.js 16 · Vercel · Prisma Postgres · Shopify Storefront API · Google Gemini API  
**Handover target date:** Day 90

---

## Table of Contents

1. [The Master Key Strategy](#1-the-master-key-strategy)
2. [Codebase & GitHub](#2-codebase--github)
3. [Hosting & Database (Vercel)](#3-hosting--database-vercel)
4. [Environment Variables Reference](#4-environment-variables-reference)
5. [Shopify Store](#5-shopify-store)
6. [Google Gemini API](#6-google-gemini-api)
7. [External Services](#7-external-services)
8. [Domain & DNS](#8-domain--dns)
9. [Admin Portal Access](#9-admin-portal-access)
10. [Architecture Overview](#10-architecture-overview)
11. [Codebase Map](#11-codebase-map)
12. [Deployment Workflow](#12-deployment-workflow)
13. [Day 90 Handoff Execution](#13-day-90-handoff-execution)

---

## 1. The Master Key Strategy

**One Gmail. Total control.**

A single admin Google account has been created:

> **psychmasteryadmin@gmail.com**

Every platform in this infrastructure is either registered with this email or has it added as an admin/owner. The GitHub organization `@psychmastery` is already under this account.

At Day 90, you finalize full ownership of the entire platform by doing one thing:

> **Change the password of `psychmasteryadmin@gmail.com` to a password only you know.**

That single action locks out all prior access and transfers control of:

| Platform | Access method |
|---|---|
| GitHub (`@psychmastery`) | Google SSO / email login |
| Vercel | Google SSO via Admin Gmail |
| Prisma Postgres | Tied to Vercel project |
| Google Gemini API | Google Cloud Console via Admin Gmail |
| Google Analytics / Search Console | Google account |
| ElevenLabs | Email login |
| Domain registrar | Email login |

No passwords to collect. No keys to chase. One Gmail change = 100% independently owned.

---

## 2. Codebase & GitHub

### Current state
The production codebase lives at:
```
https://github.com/missionctrlbiz/pam-shopify
```

The transfer target is:
```
https://github.com/psychmastery/pam-shopify
```

### Transfer steps

**Option A — Fork then delete (cleanest)**

1. Log into GitHub as `psychmasteryadmin@gmail.com`
2. Go to `https://github.com/missionctrlbiz/pam-shopify`
3. Click **Fork** → select the `psychmastery` organization as destination
4. The repo is now at `https://github.com/psychmastery/pam-shopify`
5. Update your local remote:
   ```bash
   git remote set-url origin https://github.com/psychmastery/pam-shopify.git
   git push origin main
   ```

**Option B — Transfer ownership (preserves full commit history)**

1. In the current repo: **Settings → Danger Zone → Transfer ownership**
2. Enter `psychmastery` as the destination organization
3. GitHub moves the entire repo including all history

### After transfer — update Vercel

Once the repo is under `@psychmastery`, go to Vercel → Project → **Settings → Git** and re-connect to the new repo URL so deployments continue automatically.

### Protecting the main branch

In GitHub: **Settings → Branches → Add rule** for `main`:
- ✅ Require pull request before merging
- ✅ Require 1 approval

This prevents accidental direct pushes to production.

---

## 3. Hosting & Database (Vercel)

### Create a new Vercel account

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up** → **Continue with Google**
3. Sign in with `psychmasteryadmin@gmail.com`
4. Create a team or use the personal account

### Import the project

1. Vercel dashboard → **Add New Project**
2. Select **Import Git Repository**
3. Connect to GitHub as `psychmasteryadmin@gmail.com` and authorize `@psychmastery`
4. Select `psychmastery/pam-shopify`
5. Vercel auto-detects Next.js — do not change the build settings
6. **Do not deploy yet** — set environment variables first (see Section 4)

### Set up Prisma Postgres (database)

The app uses **Prisma Postgres** (managed by Prisma, accessed via `db.prisma.io`).

1. Go to [prisma.io/postgres](https://prisma.io/postgres) and sign in with the Admin Gmail
2. Create a new project: **New Project → Postgres**
3. Copy the two connection strings provided:
   - **Connection URL** (pooled) → this is your `DATABASE_URL`
   - **Direct URL** → this is your `DIRECT_URL`
4. Add both to Vercel environment variables (see Section 4)
5. After first deploy, run migrations from your local machine:
   ```bash
   npx prisma migrate deploy
   ```
6. Seed the admin user:
   ```bash
   node prisma/seed.js
   ```

> ⚠️ The database connection is separate from Vercel. Even if you move Vercel accounts, the Prisma Postgres project stays active as long as the Prisma account (Admin Gmail) is active.

---

## 4. Environment Variables Reference

Add all of these in **Vercel → Project → Settings → Environment Variables** (Production scope).

| Variable | Where to get it | Required |
|---|---|---|
| `DATABASE_URL` | Prisma Postgres dashboard → Connection URL (pooled) | ✅ |
| `DIRECT_URL` | Prisma Postgres dashboard → Direct URL | ✅ (for migrations) |
| `NEXTAUTH_SECRET` | Generate: `openssl rand -hex 32` | ✅ |
| `NEXTAUTH_URL` | Your live domain e.g. `https://www.psychassessmentguide.com` | ✅ |
| `NEXT_PUBLIC_SHOPIFY_DOMAIN` | Shopify Admin → Settings → Domains → `.myshopify.com` URL | ✅ |
| `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Shopify Admin → Apps → Storefront API | ✅ |
| `GEMINI_API_KEY` | Google AI Studio → [aistudio.google.com](https://aistudio.google.com) → API Keys | ✅ |
| `RESEND_API_KEY` | [resend.com](https://resend.com) dashboard | Optional |

### Important notes

- `NEXT_PUBLIC_` prefixed variables are **exposed to the browser** — they cannot contain secrets. The Shopify keys above are Storefront API keys, which are intentionally public-safe. Do not put your Shopify Admin API key here.
- `NEXTAUTH_SECRET` must be a long random string. Generate a new one: in your terminal run `openssl rand -hex 32` and paste the output.
- `DATABASE_URL` uses the **pooled** connection string. This is critical for Vercel serverless — without pooling, too many functions running at once will exhaust your database connections.
- Never commit `.env` to GitHub. The `.gitignore` already excludes it.

---

## 5. Shopify Store

### Current store
```
psychassessmentguide-com.myshopify.com
```

### What the platform does with Shopify

The website uses Shopify's **Storefront API** (not the Admin API). This means:
- Products, variants, and prices are pulled from Shopify at runtime
- Checkout is handled entirely by Shopify (no payment data touches this server)
- Digital download links are redirected via `next.config.ts` to Shopify's CDN

The platform does **not** store orders or payment data. Shopify owns that entirely.

### Webhook (buyer whitelist)
The app receives Shopify order webhooks at:
```
POST /api/webhooks/shopify
```
When an order is placed, this endpoint adds the buyer's email to the Prisma `Buyer` table, which grants them access to the SOAP Architect tool.

### Transferring Shopify ownership
1. Shopify Admin → **Settings → Users and permissions**
2. Add `psychmasteryadmin@gmail.com` as staff with full permissions
3. Transfer store ownership: **Settings → Store details → Transfer ownership**

### Storefront Access Token
1. Shopify Admin → **Apps → Develop apps**
2. Create app → **Configure Storefront API**
3. Enable: `unauthenticated_read_product_listings`, `unauthenticated_write_checkouts`
4. Copy the **Storefront API access token** → add as `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`

---

## 6. Google Gemini API

The platform uses Google's Gemini API to power the **SOAP Architect** tool (`/soap-architect`).

### How it works
- Route: `POST /api/gemini`  
- Model: `gemini-pro` via `@google/generative-ai`
- Rate-limited: 5 requests per IP per minute (in-memory, resets on function cold start)
- Free users get 2 trial uses (tracked in Prisma `UsageEvent` table)
- Verified buyers (in `Buyer` table) get unlimited access

### Transfer the API key
1. Go to [aistudio.google.com](https://aistudio.google.com) and sign in with Admin Gmail
2. **Get API key → Create API key**
3. Copy it → add as `GEMINI_API_KEY` in Vercel

### Billing
Google provides generous free tier for Gemini. Monitor usage at:
[console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services → Credentials**

Set a **budget alert** at $10/month to get email warnings before any cost.

---

## 7. External Services

### ElevenLabs (AI Voice)
- Sign up / log in at [elevenlabs.io](https://elevenlabs.io) using `psychmasteryadmin@gmail.com`
- Used for producing headless AI voice video content (Phase 2 deliverable)
- Subscription billing is attached to this account

### Resend (Transactional Email)
- Sign up at [resend.com](https://resend.com) with Admin Gmail
- Used for any future email notifications or lead capture follow-ups
- Add your sending domain (`psychassessmentguide.com`) and verify DNS records
- Copy the API key → `RESEND_API_KEY` in Vercel

### Google Analytics / Search Console
- Both tied to Admin Gmail automatically
- Add property: `psychassessmentguide.com`
- Verify via DNS TXT record in your domain registrar

---

## 8. Domain & DNS

### Current domain
```
psychassessmentguide.com
```

### Where it should be registered
Transfer or register at a registrar that supports email login (not just Google SSO):
- Recommended: **Cloudflare Registrar** (cost-price, no markup, excellent DNS management)
- Alternative: **Namecheap**

### Transfer steps
1. Unlock the domain at current registrar
2. Request transfer authorization (EPP/Auth code)
3. Initiate transfer at Cloudflare/Namecheap using the Admin Gmail as the account email

### Required DNS records for Vercel

| Type | Name | Value |
|---|---|---|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

Add these in Vercel: **Project → Settings → Domains → Add domain**

### Shopify download redirect
The `next.config.ts` already contains:
```js
source: "/a/downloads/:path*",
destination: "https://psychassessmentguide-com.myshopify.com/a/downloads/:path*"
```
This handles Shopify's digital download URLs on your custom domain.

---

## 9. Admin Portal Access

The platform has a private admin dashboard at:
```
/admin
```

Login is password-protected via NextAuth credentials. Only users with `role: "admin"` in the database can access it.

### Features
- View total buyers, leads, and usage events
- Add or remove verified buyers by email
- Real-time auto-refresh every 10 seconds

### Create or reset admin user
Run this in a terminal with the database connected:
```bash
node prisma/seed.js
```
Or manually update a user's role in the database:
```sql
UPDATE "User" SET role = 'admin' WHERE email = 'your@email.com';
```

### Admin credentials handoff
At Day 90, provide the client with:
- Admin portal URL: `https://www.psychassessmentguide.com/admin`
- Admin email + password (set separately from the Gmail account)

---

## 10. Architecture Overview

```
Browser
  │
  ├─ Next.js App (Vercel Serverless)
  │     ├─ app/page.tsx          ← Public landing page
  │     ├─ app/soap-architect/   ← SOAP tool (auth-gated)
  │     ├─ app/admin/            ← Admin dashboard (role-gated)
  │     └─ app/api/
  │           ├─ gemini/         ← Gemini AI proxy
  │           ├─ leads/          ← Lead capture
  │           ├─ admin/stats/    ← Dashboard data
  │           ├─ admin/buyers/   ← Buyer whitelist CRUD
  │           ├─ webhooks/shopify/ ← Order → buyer whitelist
  │           └─ auth/[...nextauth]/ ← NextAuth handlers
  │
  ├─ Prisma ORM → Prisma Postgres (db.prisma.io)
  │     Tables: User, Account, Session, Buyer, Lead, SoapHistory, UsageEvent
  │
  ├─ Shopify Storefront API
  │     └─ Products, variants, checkout URLs
  │
  └─ Google Gemini API
        └─ SOAP note structuring
```

### Authentication flow
1. User visits `/admin`
2. Middleware (`middleware.ts`) checks JWT session
3. No valid session → redirected to `/admin/login`
4. Login submits credentials → NextAuth → Prisma `User` lookup → bcrypt password check
5. On success: JWT issued with `id` and `role` embedded
6. All admin API routes re-check `role === "admin"` server-side

### Buyer access flow
1. Customer purchases on Shopify
2. Shopify sends `orders/paid` webhook to `/api/webhooks/shopify`
3. Webhook handler extracts email → inserts into `Buyer` table
4. On next login, SOAP Architect checks `Buyer` table → grants unlimited access

---

## 11. Codebase Map

```
pam-shopify/
├── app/
│   ├── page.tsx                 ← Landing page (hero, pricing, SOAP teaser)
│   ├── layout.tsx               ← Root layout, fonts, theme provider
│   ├── globals.css              ← Tailwind base + custom CSS variables
│   ├── admin/
│   │   ├── page.tsx             ← Admin dashboard (server component, auth guard)
│   │   ├── login/page.tsx       ← Admin login form
│   │   └── cheat-sheet-print/   ← Printable cheat sheet layout
│   ├── soap-architect/page.tsx  ← Full SOAP tool page
│   └── api/                     ← All API routes (see architecture above)
│
├── components/
│   ├── admin/AdminDashboardClient.tsx  ← Full admin UI
│   ├── cheat-sheet/                   ← Cheat sheet page components (5 pages)
│   ├── GeminiTools.tsx                ← SOAP Architect UI widget
│   ├── LeadMagnet.tsx                 ← Email capture component
│   ├── PDFPreview.tsx                 ← Workbook preview modal
│   └── ResponseModal.tsx             ← AI response display
│
├── lib/
│   ├── prisma.ts                ← Prisma singleton (globalThis cached)
│   ├── auth.ts                  ← NextAuth configuration + Prisma adapter
│   ├── auth.config.ts           ← Edge-compatible auth config (for middleware)
│   └── shopify.ts               ← Shopify Storefront API client
│
├── prisma/
│   ├── schema.prisma            ← Database models
│   ├── seed.js                  ← Admin user seeding script
│   └── migrations/              ← Migration history
│
├── content/
│   └── site-content.json        ← All public-facing text/copy (single source of truth)
│
├── public/
│   ├── pam-workbook-sample.pdf  ← Preview PDF shown in modal
│   ├── Mockup.webm              ← Hero video (9:16 phone mockup)
│   ├── 1.png                    ← Hero video fallback image
│   └── *.png / *.webp           ← Brand images
│
├── next.config.ts               ← Shopify download redirect rule
├── middleware.ts                ← Auth protection for /admin routes
├── package.json                 ← Scripts: build runs prisma generate first
└── .env                         ← Local secrets (never committed)
```

### Updating site content

All public-facing text (headlines, pricing copy, navigation, testimonials) lives in one file:
```
content/site-content.json
```
Edit this file to update copy without touching any React code.

---

## 12. Deployment Workflow

Every push to `main` on GitHub triggers an automatic Vercel deployment.

### Build sequence (automatic)
```
npm install
↓
prisma generate        ← generates Prisma client from schema
↓
next build             ← compiles TypeScript, bundles app
↓
deploy to Vercel edge
```

### Running locally
```bash
# 1. Clone the repo
git clone https://github.com/psychmastery/pam-shopify.git
cd pam-shopify

# 2. Install dependencies
npm install

# 3. Create .env file (copy from .env.example or HANDOVER.md Section 4)
# Add DATABASE_URL, NEXTAUTH_SECRET, Shopify keys, Gemini key

# 4. Generate Prisma client
npx prisma generate

# 5. Apply database migrations
npx prisma migrate deploy

# 6. Start dev server
npm run dev
# → http://localhost:3000
```

### Making a change and deploying
```bash
# Make your edit in VS Code
git add -A
git commit -m "describe what you changed"
git push origin main
# → Vercel automatically builds and deploys within ~2 minutes
```

### Checking deployment status
1. Vercel dashboard → Project → **Deployments** tab
2. Click any deployment to see build logs
3. Look for `✓ Build completed` and `✓ Deployed`

### Rollback a bad deployment
In Vercel: Deployments → find the last good deployment → **⋯ → Promote to Production**

---

## 13. Day 90 Handoff Execution

### What you will receive

| Item | Delivery method |
|---|---|
| GitHub access | `@psychmastery` org already under Admin Gmail |
| Vercel access | Project linked to Admin Gmail account |
| Prisma Postgres | Database under Admin Gmail |
| Shopify admin | Ownership transferred to Admin Gmail |
| Domain | Registrar account under Admin Gmail |
| Gemini API | Google Cloud project under Admin Gmail |
| ElevenLabs | Account under Admin Gmail |
| Admin portal credentials | Provided separately at handoff |
| Recorded training sessions | 2 sessions delivered via video |
| Architecture walkthrough | This document |

### Pre-handoff verification checklist

- [ ] Repository transferred to `github.com/psychmastery/pam-shopify`
- [ ] Vercel project deploys successfully from new repo
- [ ] All environment variables set in new Vercel project
- [ ] Database migrations applied and admin user exists
- [ ] Shopify webhook URL updated to new Vercel domain (if domain changed)
- [ ] Custom domain resolving correctly at Vercel
- [ ] Admin login works at `/admin`
- [ ] SOAP Architect functional end-to-end
- [ ] Shopify checkout functional
- [ ] PDF preview loading correctly
- [ ] Gemini API returning responses
- [ ] Two recorded training sessions delivered
- [ ] This document reviewed and understood

### The final step

Once you have confirmed everything above:

> **Log in to `psychmasteryadmin@gmail.com` and change the password to one only you know.**

This is the moment of full ownership transfer.

After doing this:
- No prior party has access to any system
- You control the code, the database, all APIs, and the domain
- The platform is 100% yours

---

## Additional Notes

### What does NOT require ongoing developer access

Once handed over, you can independently:
- Edit all website copy by modifying `content/site-content.json`
- Deploy changes by pushing to GitHub (Vercel auto-deploys)
- Add or remove buyers in the admin portal at `/admin`
- View leads and usage analytics in the admin portal
- Download leads data from the admin portal
- Update the workbook PDF by replacing `public/pam-workbook-sample.pdf` in the repo

### What would require developer support

- Schema changes (adding new database fields or tables)
- New feature development
- Major dependency upgrades
- Shopify product structure changes that affect the integration

### Monitoring

- **Vercel** → Function logs for any runtime errors
- **Prisma Studio** (optional): `npx prisma studio` — visual database browser
- **Google Cloud Console** → Gemini API usage and quota
- **Shopify** → Orders and webhook delivery success

### Security reminders

- Never share `NEXTAUTH_SECRET` — it signs all session tokens
- Never commit `.env` to GitHub
- Rotate `GEMINI_API_KEY` if you suspect it has been exposed (Google AI Studio → Revoke key → Create new)
- The Shopify Storefront API token is public-safe by design — it only allows read access to products and write access to checkouts
- The admin portal is protected server-side — the `role: "admin"` check runs on the server, not the client

---

*Document prepared as part of the 90-Day Technical Stabilization & Infrastructure Transition for Psychiatric Assessment Mastery™.*
