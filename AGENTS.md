# Psychiatric Assessment Mastery (PAM) — Codex Reference

## READ FIRST: Shared Agent Contract

This repo also has Claude-facing guidance. Keep agent behavior aligned across tools.
Before changing code, read:

1. `CLAUDE.md`
2. `MEMORY.md`
3. `SKILLS.md`
4. `CAROUSEL_STUDIO_EXECUTION.md`
5. `CONTENT_MANAGEMENT_OVERHAUL.md`
6. `carousel_studio_prototype.html` when present locally

The most important current constraints:

- No mock data in real Carousel Studio surfaces.
- No social publish/scheduler/platform-token flow in Carousel Studio.
- Partial streamed AI objects must never crash the UI.
- Slide and caption actions must persist; no cosmetic buttons.
- Carousel Studio output must preserve slide-count requests and visual variety.
- Trigger-imported code requires Trigger.dev deploy. Use the repo-pinned CLI version
  `npx trigger.dev@4.4.3 deploy` unless all Trigger packages are upgraded together.
- Run `npx tsc --noEmit` after code edits.

## Project Overview

Full-stack AI-powered clinical education platform. Public storefront + buyer-gated SOAP tools +
an admin content production pipeline that generates, scores, renders, and tracks 30-day social media
calendars. Built on Next.js 16 (App Router), Supabase, Trigger.dev v4, Google Gemini, and ElevenLabs.

Live domain: `psychassessmentguide.com` | Hosted on Vercel | Repo: `github.com/missionctrlbiz/pam-shopify`

---

## CRITICAL: Deployment Architecture

**This is the #1 source of silent failures. Read before touching any generation or rendering code.**

| Code Path | Runs On | How to Test |
|---|---|---|
| `trigger/production.ts` tasks | **Trigger.dev cloud** | Must deploy with `npx trigger.dev@latest deploy` |
| `lib/production/repurposeInline.ts` | Trigger.dev cloud (called from trigger tasks) | Same — deploy required |
| `app/api/production/assets/generate/route.ts` | Vercel serverless | Push to main → auto-deploys |
| `lib/production/calendarGeneration.ts` | Trigger.dev cloud (`production-calendar-batch`) | Deploy required |
| `lib/production/contentStrategist.ts` | Trigger.dev cloud | Deploy required |
| `lib/production/qualityGate.ts` | Vercel serverless (API route calls it directly) | Push to main |
| `lib/production/sceneDirector.ts` | Vercel serverless | Push to main |

### Trigger.dev Tasks (run on cloud, NOT locally unless `npm run trigger:dev` is active)

| Task ID | File | Timeout | Machine |
|---|---|---|---|
| `production-carousel` | `trigger/production.ts` | 15 min | medium-1x |
| `production-repurpose` | `trigger/production.ts` | 15 min | default |
| `production-video` | `trigger/production.ts` | 30 min | large-1x |
| `production-calendar-batch` | `trigger/production.ts` | 30 min | default |

### Before editing any renderer or generator

Ask: "Does this file get called from a Trigger.dev task?"
- If yes → local edits have NO effect until deployed to Trigger.dev cloud
- Deploy command: `npx trigger.dev@latest deploy`
- Or push to a branch and let GitHub Actions handle it (`.github/workflows/`)
- To test locally: `npm run trigger:dev` (runs Trigger.dev dev server in parallel)

### GCP Cloud Run is PARKED

The `.github/workflows/deploy-carousel.yml` / `deploy-repurpose.yml` / `deploy-video.yml` files
are disabled stubs. GCP Cloud Run workers were the original renderer plan; all rendering now runs
via Trigger.dev. Do not attempt to revive those workflows.

---

## Bug Fixing Conventions

### UI Bugs — Always identify the target first

Before writing a single line of fix code:

1. Take a `preview_screenshot` to capture current state
2. Inspect `preview_logs` for console errors
3. Identify the **exact component name** responsible — do not guess from file names
4. Confirm whether the component is rendered client-side or server-side
5. State the target component explicitly before editing

This is mandatory because the admin dashboard has multiple modals, overlays, and panel layers.
Naming is not always 1:1 with component identity.

### Key UI component map for the admin dashboard

| Visual Element | Component File |
|---|---|
| Main tab shell | `components/admin/AdminDashboardClient.tsx` |
| Production calendar row | `components/admin/production/CalendarTable.tsx` |
| Entry detail panel / slide-out | `components/admin/production/DayPanel.tsx` |
| Quality gate scores | `components/admin/production/QualityGatePanel.tsx` |
| Rendered asset grid | `components/admin/production/AssetGrid.tsx` |
| Render job queue | `components/admin/production/RenderJobsTab.tsx` |
| Approved content library | `components/admin/production/StoryBankTab.tsx` |
| Publish controls | `components/admin/production/PublishTab.tsx` |
| Carousel slide viewer | `components/admin/production/CarouselViewInline.tsx` |

### TypeScript

- Run `npx tsc --noEmit` after every batch of edits before declaring done
- `components/admin/production/types.ts` is the shared type source — check it before adding new types
- Enums live in `lib/enums.ts` — do not redefine them locally
- `PLATFORM_META` and `POST_TYPE_META` in `DayPanel.tsx` are typed — use direct indexed access, not `as any`

---

## Content Production Pipeline

```
1. GENERATE
   POST /api/production/calendar/generate
   └── Trigger.dev: production-calendar-batch
       ├── Reads active clinical_fields rows
       ├── Loops SCHEDULE_TEMPLATE (30 entries × platforms × funnel stages)
       └── Calls Gemini Content Strategist → masterJson → content_ideas table

2. QUALITY GATE
   POST /api/production/quality-gate
   └── Gemini 2.5 Flash scores 5 Anti-Generic questions (1–5 scale)
       Pass threshold: 4 of 5 questions score ≥ 3
       PASSED → PublishStatus.PENDING_APPROVAL
       FAILED → PublishStatus.DRAFT

3. SCENE DIRECTOR
   POST /api/production/calendar/[id]/scenes
   └── Expands masterJson → storyboard + voiceover with ESL markers
       ([pause], [breath], [emphasize:word])

4. APPROVE
   POST /api/production/calendar/[id]/approve
   └── Admin approves → PublishStatus.APPROVED

5. RENDER (dispatched to Trigger.dev cloud)
   POST /api/production/assets/generate
   └── Based on postType:
       CAROUSEL              → production-carousel + production-repurpose
       VIDEO / REEL          → production-video   + production-repurpose
       TEXT_POST / STORY     → production-repurpose only
       EMAIL_LESSON          → production-repurpose only

   Carousel:  Satori SVG → @resvg/resvg-js → PNG (1080×1080, one per slide)
   Video:     ElevenLabs TTS → MP3 + Remotion 4 → MP4
   Repurpose: Gemini → IG / FB / TikTok / LinkedIn captions + email HTML

6. TRACK
   GET /api/production/render-jobs
   └── Job queue panel, auto-cleans stalled jobs (> 30 min)
```

### Entry Status Lifecycle

`DRAFT` → `PENDING_APPROVAL` → `APPROVED` → `GENERATING` → `SCHEDULED` → `PUBLISHED` → `ARCHIVED`

### Carousel output spec

- Single ratio: **1080 × 1080 px PNG only**
- Multi-ratio (1:1 / 4:5 / 9:16) and ZIP export were removed — do not reintroduce
- Slides rendered in `runCarouselInline()` in `lib/production/repurposeInline.ts`

---

## Database Schema (Supabase Postgres)

| Table | Purpose |
|---|---|
| `profiles` | Extended user; `role` field: `USER` or `ADMIN` |
| `clinical_fields` | 130-row seed — clinical vocabulary Gemini draws from |
| `production_calendar_entries` | One row per scheduled post |
| `content_ideas` | Gemini `masterJson` linked to calendar entry |
| `quality_gate_results` | Per-question scores + pass/fail |
| `video_scripts` | Storyboard JSON + audio metadata |
| `content_assets` | Rendered file URLs + type + status |
| `render_jobs` | Trigger.dev task tracking (QUEUED → RUNNING → COMPLETE / FAILED) |
| `audio_cache` | SHA-256-keyed ElevenLabs cache keyed on `"<voice_id>:<text>"` |
| `buyers` | Verified purchasers (populated by Shopify webhook) |
| `leads` | Emails from lead-magnet form |

Migrations live in `supabase/migrations/`.

---

## AI Models

| Service | Model | Used For |
|---|---|---|
| Google Gemini | `gemini-2.5-pro` | Content Strategist (primary) |
| Google Gemini | `gemini-2.5-flash` | Quality Gate, SOAP Architect, fallback |
| ElevenLabs | `eleven_multilingual_v2` | TTS voiceover for video pipeline |

Model singleton: `lib/ai.ts` (`PRODUCTION_MODEL` constant). Change the model there, not in individual files.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Auth | Supabase Auth + NextAuth 5 beta |
| Database | Supabase Postgres |
| Storage | Supabase Storage (`production` bucket) |
| Commerce | Shopify Storefront API (`shopify-buy` v3) |
| AI — Content | Google Gemini 2.5 (`@google/genai`) |
| AI — Voice | ElevenLabs (`eleven_multilingual_v2`) |
| Video | Remotion 4 (Remotion composition: `PAMVideo`) |
| Images | Satori 0.25 + `@resvg/resvg-js` 2.6.2 |
| Background Jobs | Trigger.dev v4 |
| Hosting | Vercel |

---

## Directory Map

```
app/
├── page.tsx                        Public landing page
├── admin/page.tsx                  Admin dashboard entry (auth guard)
├── admin/login/page.tsx            Supabase login
├── admin/cheat-sheet-print/        Printable clinical reference
├── soap-architect/page.tsx         SOAP Architect tool
└── api/
    ├── gemini/                     SOAP note generation
    ├── leads/                      Lead capture
    ├── audio/generate/             ElevenLabs TTS + audio cache
    ├── verify-buyer/               Buyer access check
    ├── webhooks/shopify/           Order paid → buyers table
    ├── admin/                      Buyers, stats, seed-fields CRUD
    └── production/
        ├── calendar/               CRUD + generate + approve + scenes
        ├── assets/generate/        Trigger.dev dispatch
        ├── quality-gate/           Gemini Anti-Generic scorer
        ├── render-jobs/            Job queue tracking
        └── scripts/[id]/           Video script detail

components/
├── admin/AdminDashboardClient.tsx  Main admin shell (tabs)
└── admin/production/               All production pipeline UI components

lib/
├── ai.ts                           Gemini singleton + model constants
├── auth.ts / auth.config.ts        Supabase + NextAuth
├── enums.ts                        All shared enums (Platform, PostType, etc.)
├── supabase.ts / supabase.server.ts Supabase clients
└── production/
    ├── calendarGeneration.ts       30-day batch orchestrator
    ├── contentStrategist.ts        Gemini Content Strategist
    ├── qualityGate.ts              Anti-Generic Quality Gate
    ├── qualityGateUtils.ts         Scoring + threshold logic
    ├── sceneDirector.ts            Storyboard + voiceover expander
    └── repurposeInline.ts          Inline renderer (carousel / video / repurpose)

trigger/
└── production.ts                   All Trigger.dev task definitions

workers/
└── video-renderer/remotion-src/    Remotion composition (PAMVideo)

supabase/migrations/                SQL migration history
content/site-content.json           All public-facing copy (single source of truth)
```

---

## Local Development

```bash
npm install
npm run dev           # Next.js at localhost:3000
npm run trigger:dev   # Run Trigger.dev tasks locally (required to test generation)
npx tsc --noEmit      # Type check (no output files)
```

**If you are testing carousel / video / repurpose generation locally, you MUST run
`npm run trigger:dev` in a separate terminal. Otherwise tasks will dispatch to the cloud.**

### Deploy Trigger.dev changes

```bash
npx trigger.dev@latest deploy
```

Run this any time `trigger/production.ts` or anything it imports changes.
Local builds only affect Vercel — they do not update the Trigger.dev cloud runtime.

### Deploy Next.js changes

Push to `main` — Vercel auto-deploys within ~2 minutes.

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE=

# Shopify (public-safe Storefront API keys)
NEXT_PUBLIC_SHOPIFY_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=

# AI
GEMINI_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=          # optional; defaults to vCJ255LXSScOjTI93arO

# Trigger.dev
TRIGGER_SECRET_KEY=
TRIGGER_PROJECT_REF=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=                 # e.g. https://www.psychassessmentguide.com
```

---

## Agentic Workflow Guidelines

### Before touching any code, answer these two questions:

1. **Where does this code actually execute?** (Vercel serverless, Trigger.dev cloud, or both?)
2. **Which exact component/function is the source of the bug?** (Confirm via screenshot + DOM before editing)

### Use subagents for investigation

Spawn parallel Task Agents before making changes to complex features:
- Agent 1: Map execution path (local vs Trigger.dev cloud)
- Agent 2: Screenshot + identify exact component from DOM

### End-of-session deployment checklist

When any session touches `trigger/production.ts` or files under `lib/production/` that are
called from Trigger.dev tasks:
1. Run `npx trigger.dev@latest deploy`
2. Re-trigger the failing case from the admin dashboard
3. Tail logs in the Trigger.dev dashboard to confirm new code executed

### Available skills (invoke with /skillname)

| Skill | When to use |
|---|---|
| `/ui-bug` | Fixing any modal, overlay, panel, or CSS layout bug |
| `/trigger-deploy` | After changing any file called from a Trigger.dev task |
| `/pr-fix` | Addressing PR review comments |
| `/map-execution` | Before editing generation/rendering code — map what runs where |

---

## Common Patterns

### Checking if a file is called from Trigger.dev

```bash
grep -r "runCarouselInline\|runRepurposeInline\|runVideoScriptInline\|runCalendarGenerationBatch" trigger/
```

If the function appears in `trigger/production.ts`, edits to it require a Trigger.dev deploy.

### Finding the component rendering a UI element

Use `preview_screenshot` to capture the DOM, then:
```bash
grep -r "className.*<suspicious-class>\|<suspicious-text>" components/admin/
```

### Audio cache key format

```ts
const key = crypto.createHash('sha256').update(`${voiceId}:${cleanedText}`).digest('hex')
```

Stored in `audio_cache` table. If TTS output sounds wrong, check whether a stale cached URL exists.

### Quality Gate threshold

Pass condition: at least 4 out of 5 questions score ≥ 3.
Defined in `lib/production/qualityGateUtils.ts`. Do not change without reviewing all QG-dependent status flows.

---

## Security Notes

- `SUPABASE_SERVICE_ROLE` bypasses RLS — only use in server-side API routes, never client components
- `NEXT_PUBLIC_` vars are exposed to the browser — they contain only Shopify Storefront keys (intentionally public)
- Shopify webhook at `/api/webhooks/shopify` validates HMAC signature before processing
- Admin routes re-check `role === ADMIN` server-side on every request — do not rely on client-side guards
- ElevenLabs and Gemini keys are server-only — never import `lib/audio/elevenLabs.ts` or `lib/ai.ts` in client components
