# Psychiatric Assessment Mastery (PAM)

## AI-Powered Clinical Education Platform

A full-stack platform combining a headless Shopify storefront with a Gemini-driven content
production pipeline. Students get AI tools to master psychiatric documentation; admins get a
complete 30-day content engine that generates, scores, renders, and tracks every piece of
social and educational content.

---

## Architecture Overview

```
Next.js 16 (Vercel)
├── Public storefront  — Shopify Storefront API, lead capture, SOAP Architect tool
├── Admin UI           — /admin (role-gated), full production pipeline shell
└── API Routes         — Gemini, Supabase, Trigger.dev, ElevenLabs, Shopify webhooks

Trigger.dev v4 (Background Tasks)
├── production-calendar-batch  — batch calendar generation via Gemini
├── production-carousel        — Satori + resvg-js → PNG slides → Supabase Storage
├── production-repurpose       — Gemini captions/scripts → Supabase Storage
└── production-video           — Remotion + ElevenLabs TTS → MP4 → Supabase Storage

Supabase
├── Auth     — user sessions, role-based access (USER / ADMIN)
├── Postgres — all application data (see Schema section)
└── Storage  — rendered PNG, MP4, MP3, HTML assets (production bucket)

Shopify
└── Storefront API — products, variants, checkout URLs (client-side SDK)
```

---

## Product Tiers

| Tier              | Price   | Includes                                      |
| ----------------- | ------- | --------------------------------------------- |
| Digital Edition   | $9.99   | PDF / eBook                                   |
| Physical Workbook | $29.99  | Printed workbook                              |
| Mastery Bundle    | $49.99  | Physical + Digital + 1-Year AI Clinical Tools |

---

## AI Clinical Tools (Buyer-Only)

Access is gated behind the Mastery Bundle purchase. Shopify's `orders/paid` webhook
automatically adds the buyer's email to the `buyers` table, granting full access.

- **SOAP Architect** — interactive clinical scenario builder; generates structured SOAP
  notes via Gemini with usage limits for non-buyers and unlimited access for verified
  bundle purchasers.

---

## Admin Production Pipeline

All production features live inside the `/admin` shell under the **Production** tab.
Access requires `role = ADMIN` in the `profiles` table.

### Content Flow

```
1. GENERATE ─────────────────────────────────────────────────────────────────
   POST /api/production/calendar/generate
   └── Trigger.dev: production-calendar-batch  (or inline fallback)
       ├── Reads active ClinicalField rows from DB
       ├── Loops a 30-entry SCHEDULE_TEMPLATE across platforms + funnel stages
       └── Calls Gemini Content Strategist → masterJson saved to content_ideas

2. QUALITY GATE ──────────────────────────────────────────────────────────────
   POST /api/production/quality-gate
   └── Gemini 2.5 Flash scores each idea on 5 Anti-Generic questions (1–5)
       Pass threshold: 4 of 5 questions must score ≥ 3
       PASSED  → PublishStatus: PENDING_APPROVAL
       FAILED  → PublishStatus: DRAFT  (returned for editing)

3. SCENE DIRECTOR ────────────────────────────────────────────────────────────
   POST /api/production/calendar/[id]/scenes
   └── Second Gemini call expands masterJson into a full scene-by-scene
       storyboard + voiceover script with ESL markers
       ([pause], [breath], [emphasize:word]) and a per-platform prompt bank.

4. APPROVE ───────────────────────────────────────────────────────────────────
   POST /api/production/calendar/[id]/approve
   └── Admin manually approves entry → PublishStatus: APPROVED

5. RENDER ────────────────────────────────────────────────────────────────────
   POST /api/production/assets/generate
   └── Dispatches Trigger.dev tasks based on postType:
       CAROUSEL              → production-carousel + production-repurpose
       VIDEO / REEL          → production-video   + production-repurpose
       TEXT_POST / STORY     → production-repurpose only
       EMAIL_LESSON          → production-repurpose only

   Rendering engines:
   ├── Carousel:  Satori SVG → resvg-js → PNG (one file per slide)
   ├── Video:     ElevenLabs TTS → audio/mp3 + Remotion 4 → video/mp4
   └── Repurpose: Gemini → IG/FB/TikTok/LinkedIn captions + email HTML

   All assets saved to Supabase Storage (production bucket).
   Render job status tracked in render_jobs table: QUEUED → RUNNING → COMPLETE / FAILED.

6. TRACK ─────────────────────────────────────────────────────────────────────
   GET /api/production/render-jobs
   └── Live job queue panel with auto-cleanup of stalled jobs (> 30 min).
       Full asset grid per entry once rendering completes.
```

### Platforms & Post Types

| Platforms                           | Post Types                                               |
| ----------------------------------- | -------------------------------------------------------- |
| IG, FB, TikTok, LinkedIn, EMAIL     | CAROUSEL, VIDEO, REEL, TEXT_POST, STORY, EMAIL_LESSON    |

### Funnel Stages

`AWARENESS` → `CONSIDERATION` → `CONVERSION` → `RETENTION`

### Entry Status Lifecycle

`DRAFT` → `PENDING_APPROVAL` → `APPROVED` → `GENERATING` → `SCHEDULED` → `PUBLISHED` → `ARCHIVED`

---

## Tech Stack

| Layer             | Technology                                              |
| ----------------- | ------------------------------------------------------- |
| Framework         | Next.js 16.1.6 (App Router)                             |
| Language          | TypeScript                                              |
| Styling           | Tailwind CSS v4                                         |
| Animations        | Framer Motion                                           |
| Icons             | Lucide React                                            |
| Auth              | Supabase Auth                                           |
| Database          | Supabase Postgres                                       |
| Storage           | Supabase Storage (`production` bucket)                  |
| AI — Content      | Google Gemini 2.5 Flash (`@google/genai`)               |
| AI — Voice        | ElevenLabs (`eleven_multilingual_v2`)                   |
| Commerce          | Shopify Storefront API (`shopify-buy` v3)               |
| Video Rendering   | Remotion 4                                              |
| Image Rendering   | Satori + resvg-js                                       |
| Background Jobs   | Trigger.dev v4                                          |
| Hosting           | Vercel                                                  |

---

## Database Schema

All tables live in the Supabase Postgres project. Key tables:

| Table                          | Purpose                                                    |
| ------------------------------ | ---------------------------------------------------------- |
| `profiles`                     | Extended user record; stores `role` (USER / ADMIN)         |
| `clinical_fields`              | Seed data — psychiatric assessment fields used as content anchors |
| `production_calendar_entries`  | One row per scheduled post; carries platform, postType, status |
| `content_ideas`                | Gemini-generated `masterJson` linked to a calendar entry   |
| `quality_gate_results`         | Per-question scores and pass/fail from the Anti-Generic filter |
| `video_scripts`                | Storyboard JSON + audio metadata from Scene Director       |
| `content_assets`               | Rendered file references (storage URL, type, status)       |
| `render_jobs`                  | Trigger.dev task tracking per content idea                 |
| `audio_cache`                  | SHA-256-keyed ElevenLabs TTS cache (prevents duplicate API calls) |
| `buyers`                       | Verified purchasers (populated by Shopify webhook)         |
| `leads`                        | Emails captured from the lead-magnet form                  |

Migrations live in `supabase/migrations/`.

---

## Local Development

### Prerequisites

- Node.js 20+
- A Supabase project (Auth + Postgres + Storage enabled)
- A Shopify store with Storefront API credentials
- A Google Gemini API key
- An ElevenLabs API key
- A Trigger.dev project

### Setup

```bash
git clone https://github.com/missionctrlbiz/pam-shopify.git
cd pam-shopify
npm install
```

Copy `.env.local` and fill in all values (see **Environment Variables** below):

```bash
cp .env.example .env.local   # or create .env.local manually
npm run dev
```

To run Trigger.dev background tasks locally in parallel:

```bash
npm run trigger:dev
```

---

## Environment Variables

```env
# ── Supabase ─────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE=

# ── Shopify (client-side SDK — NEXT_PUBLIC_ prefix required) ─────────────────
NEXT_PUBLIC_SHOPIFY_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=

# ── AI ───────────────────────────────────────────────────────────────────────
GEMINI_API_KEY=

ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=        # optional — defaults to vCJ255LXSScOjTI93arO

# ── Trigger.dev ───────────────────────────────────────────────────────────────
TRIGGER_SECRET_KEY=
TRIGGER_PROJECT_REF=

# ── Auth (NextAuth session shape — still required by auth.config.ts) ──────────
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://your-domain.vercel.app
```

> All variables must be added to Vercel's **Production**, **Preview**, and **Development**
> environments via the Vercel dashboard.

---

## Deployment

### Vercel (Next.js app)

Every push to `main` triggers an automatic Vercel deployment.
To deploy manually:

```bash
vercel --prod
```

### Trigger.dev (background tasks)

Background task definitions live in `trigger/production.ts`.
Deploy after any changes to that file or to `lib/production/`:

```bash
npm run trigger:deploy
```

For staging:

```bash
npm run trigger:deploy:staging
```

The Trigger.dev config (`trigger.config.ts`) bundles:
- `workers/video-renderer/build/**` — pre-built Remotion composition
- `node_modules/@resvg/resvg-js/**` — native image renderer
- Puppeteer extension (for future use)

### Shopify Webhook

Register the `orders/paid` webhook in your Shopify admin pointing to:

```
https://your-domain.vercel.app/api/webhooks/shopify
```

This webhook automatically adds purchasers to the `buyers` table, unlocking AI tool access.

---

## Project Structure

```
pam-shopify/
├── app/
│   ├── page.tsx                         ← Public landing page (storefront + SOAP tool)
│   ├── layout.tsx                       ← Root layout, Vercel Analytics
│   ├── globals.css                      ← Tailwind base + CSS variables
│   ├── soap-architect/page.tsx          ← Standalone SOAP Architect page
│   ├── admin/
│   │   ├── page.tsx                     ← Admin dashboard entry (auth guard)
│   │   ├── login/                       ← Supabase login form
│   │   ├── cheat-sheet-print/           ← Printable clinical cheat sheet
│   │   └── production/                  ← Redirects to /admin (production is a tab)
│   └── api/
│       ├── gemini/                      ← SOAP note generation proxy
│       ├── leads/                       ← Lead capture endpoint
│       ├── audio/generate/              ← ElevenLabs TTS + audio cache
│       ├── verify-buyer/                ← Buyer access check
│       ├── webhooks/shopify/            ← Order paid → buyer whitelist
│       ├── admin/
│       │   ├── buyers/                  ← Buyer CRUD
│       │   ├── content/                 ← Content editor
│       │   ├── stats/                   ← Dashboard metrics
│       │   └── seed-fields/             ← Clinical fields seeder
│       └── production/
│           ├── calendar/                ← GET list, POST generate, [id] CRUD + approve + scenes
│           ├── quality-gate/            ← Gemini Anti-Generic scorer
│           ├── assets/generate/         ← Trigger.dev dispatch (carousel / video / repurpose)
│           ├── assets/[id]/             ← Single asset fetch
│           ├── assets/proxy/            ← Supabase Storage proxy
│           ├── render-jobs/             ← Job queue + bulk ops
│           └── scripts/[id]/            ← Video script detail
│
├── components/
│   ├── ClinicalTools.tsx                ← SOAP Architect UI widget
│   ├── LeadMagnet.tsx                   ← Email capture component
│   ├── PDFPreview.tsx                   ← Workbook preview modal
│   ├── ResponseModal.tsx                ← AI response display
│   └── admin/
│       ├── AdminDashboardClient.tsx     ← Full admin shell (tabs: Buyers, Leads, Analytics, Production)
│       ├── ContentEditor.tsx            ← Site content editor
│       └── production/
│           ├── ProductionDashboardClient.tsx  ← Production pipeline shell
│           ├── CalendarTable.tsx              ← Calendar list view
│           ├── DayPanel.tsx                   ← Entry detail + actions
│           ├── QualityGatePanel.tsx           ← QG scores display
│           ├── AssetGrid.tsx                  ← Rendered asset viewer
│           ├── RenderJobsTab.tsx              ← Job queue management
│           ├── StoryBankTab.tsx               ← Approved content library
│           ├── PublishTab.tsx                 ← Publishing controls
│           └── types.ts                       ← Shared TypeScript types
│
├── lib/
│   ├── ai.ts                            ← GoogleGenAI singleton + PRODUCTION_MODEL constant
│   ├── auth.ts                          ← Supabase-backed auth() wrapper
│   ├── auth.config.ts                   ← NextAuth session/JWT shape config
│   ├── enums.ts                         ← All shared enums (Platform, PostType, etc.)
│   ├── shopify.ts                       ← Shopify Storefront client
│   ├── supabase.ts                      ← Supabase browser + admin clients
│   ├── supabase.server.ts               ← Supabase SSR server client
│   ├── ai/
│   │   └── prompts.ts                   ← Gemini response schemas + prompt builders
│   ├── audio/
│   │   └── elevenLabs.ts                ← TTS client, retry logic, MP3 duration parser, ESL marker stripper
│   └── production/
│       ├── calendarGeneration.ts        ← 30-day batch generation orchestrator
│       ├── contentStrategist.ts         ← Gemini Content Strategist (masterJson generator)
│       ├── qualityGate.ts               ← Gemini Quality Gate service
│       ├── qualityGateUtils.ts          ← Scoring logic + thresholds (testable without AI)
│       ├── sceneDirector.ts             ← Storyboard + voiceover expander (second Gemini pass)
│       └── repurposeInline.ts           ← Inline rendering engine (carousel / video / repurpose)
│
├── trigger/
│   └── production.ts                    ← Trigger.dev task definitions
│
├── workers/
│   └── video-renderer/
│       └── remotion-src/                ← Remotion composition (PAMVideo, scenes, types)
│
├── supabase/
│   └── migrations/                      ← SQL migration files
│
├── content/
│   └── site-content.json                ← All public-facing copy (single source of truth)
│
├── trigger.config.ts                    ← Trigger.dev project config + build extensions
├── next.config.ts                       ← Next.js config (Shopify redirect, external packages)
└── tsconfig.json
```

---

## Content Copy

All public-facing text — headlines, pricing, navigation labels, testimonials, feature
descriptions — lives in a single file:

```
content/site-content.json
```

Edit this file to update copy without touching any React code.

---

## ElevenLabs Audio Cache

To avoid re-billing identical voiceover scripts, every generated audio clip is cached in
the `audio_cache` Supabase table. The cache key is a SHA-256 hash of
`"<voiceId>:<cleanText>"`. On a cache hit, the stored Supabase Storage URL is returned
immediately with no ElevenLabs API call. ESL markers (`[pause]`, `[breath]`,
`[emphasize:word]`) are stripped from the text before hashing and before sending to
ElevenLabs, but are preserved in the storyboard JSON for Remotion's visual direction.

---

## License

Proprietary — All rights reserved.

---

## Author

**MissionCTRL Labs** · [missionctrl.com.ng](https://missionctrl.com.ng)  
GitHub: [@missionctrlbiz](https://github.com/missionctrlbiz)