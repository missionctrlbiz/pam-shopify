# Headless Content Authority Engine — Architecture & Build Guide

**What:** A protected `/admin/production` suite inside the existing Next.js app that automates the PAM 30-Day Production Calendar. Gemini drafts structured content, an admin approval gate + Anti-Generic Quality Filter validates it, then GCP Cloud Run workers render assets (carousels via Puppeteer, videos via Remotion) and store them in Vercel Blob. Everything tracked in 7 new Prisma models extending the existing schema.

**Why GCP Cloud Run for rendering:** Vercel serverless times out at 60 seconds — carousel and video rendering can take minutes. Cloud Run containers scale to zero (no idle cost), take the full job duration they need, and call back to Next.js via a webhook when done.

---

## Build Status

| Layer    | Component                                                   | Status  |
| -------- | ----------------------------------------------------------- | ------- |
| 0 — Data | `prisma/schema.prisma` (10 enums, 7 models)                 | ✅ Done |
| 0 — Data | `prisma/seed.ts` (130 ClinicalField rows)                   | ✅ Done |
| 1 — AI   | `lib/production/contentStrategist.ts`                       | ✅ Done |
| 1 — AI   | `lib/production/qualityGate.ts`                             | ✅ Done |
| 1 — AI   | `lib/production/repurposingRouter.ts`                       | ✅ Done |
| 2 — API  | `POST /api/production/calendar/generate`                    | ✅ Done |
| 2 — API  | `GET /api/production/calendar`                              | ✅ Done |
| 2 — API  | `GET/PUT /api/production/calendar/[id]`                     | ✅ Done |
| 2 — API  | `PUT /api/production/calendar/[id]/approve`                 | ✅ Done |
| 2 — API  | `POST /api/production/quality-gate`                         | ✅ Done |
| 2 — API  | `POST /api/production/assets/generate`                      | ✅ Done |
| 2 — API  | `GET /api/production/assets/[id]`                           | ✅ Done |
| 2 — API  | `POST /api/production/render-done`                          | ✅ Done |
| 2 — API  | `GET/PUT /api/production/scripts/[id]`                      | ✅ Done |
| 3 — GCP  | Cloud Run: `carousel-renderer`                              | ✅ Done |
| 3 — GCP  | Cloud Run: `repurpose-worker`                               | ✅ Done |
| 3 — GCP  | Cloud Run: `video-renderer`                                 | ✅ Done |
| 3 — GCP  | Remotion composition `PAMVideo` (1080×1920, spring kinetic) | ✅ Done |
| 3 — GCP  | Cloud Tasks queue `pam-render-queue`                        | ⬜ Next |
| 4 — UI   | Admin UI at `/admin/production`                             | ✅ Done |

---

## A. Prisma Schema — 7 New Models (All Additive)

### Enums

| Enum                | Values                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `Platform`          | `IG`, `FB`, `TIKTOK`, `LINKEDIN`, `EMAIL`, `VIDEO`                                          |
| `FunnelStage`       | `AWARENESS`, `CONSIDERATION`, `CONVERSION`, `RETENTION`                                     |
| `PostType`          | `CAROUSEL`, `VIDEO`, `TEXT_POST`, `REEL`, `STORY`, `EMAIL_LESSON`                           |
| `PublishStatus`     | `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `GENERATING`, `SCHEDULED`, `PUBLISHED`, `ARCHIVED` |
| `AssetType`         | `CAROUSEL_PNG`, `VIDEO_MP4`, `TEXT_POST`, `EMAIL_HTML`, `AUDIO_MP3`, `VIDEO_SCRIPT_JSON`    |
| `AssetStatus`       | `PENDING`, `GENERATING`, `COMPLETE`, `FAILED`                                               |
| `RenderJobType`     | `CAROUSEL`, `VIDEO`, `AUDIO`, `REPURPOSE`                                                   |
| `RenderJobStatus`   | `QUEUED`, `RUNNING`, `COMPLETE`, `FAILED`                                                   |
| `QualityGateStatus` | `PENDING`, `PASSED`, `FAILED`, `BYPASSED`                                                   |
| `FieldCategory`     | `CHIEF_COMPLAINT`, `MSE`, `DIAGNOSTIC`, `RISK_ASSESSMENT`, `DOCUMENTATION`, `INTERVIEW`     |

### Models

Models are **all additive** — the original 7 models (User, Account, Session, VerificationToken, Buyer, Lead, SoapHistory, UsageEvent) are untouched. User model received two back-relation fields only.

| Model                     | Key Purpose                                                       |
| ------------------------- | ----------------------------------------------------------------- |
| `ClinicalField`           | 130-row seed from CSV — the clinical vocabulary Gemini draws from |
| `ProductionCalendarEntry` | One row per scheduled day (1–30)                                  |
| `ContentIdea`             | Gemini's full `masterJson` output for a calendar slot             |
| `QualityGateResult`       | 5-question quality filter scores + pass/fail                      |
| `VideoScript`             | Scene-by-scene storyboard with ElevenLabs voiceover fields        |
| `ContentAsset`            | One row per generated file (PNG, MP4, TXT, HTML)                  |
| `RenderJob`               | Async GCP Cloud Run job tracker — the bridge to workers           |

---

## B. Gemini Integration — Actual Implementation

### Model in Use

```
gemini-2.0-flash-thinking-exp-01-21
```

This is a **thinking model**. Thinking models do NOT support `responseMimeType: "application/json"` or `responseSchema`. JSON is enforced via:

1. Prompt explicitly instructs: _"Return ONLY the JSON object. No markdown code fences. No explanation text."_
2. Code-fence stripping is applied to the response before `JSON.parse()`.

### Service Files

**`lib/production/contentStrategist.ts`**

- `PRODUCTION_MODEL = "gemini-2.0-flash-thinking-exp-01-21"`
- `generateContentIdea(field, meta)` → `{ masterJson: ContentIdeaMasterJson, rawPrompt: string }`
- Brand voice baked into system prompt: PMHNP-level clinical language, no generic wellness content, PAM methodology only
- Output enforces exactly 6 `slideTextBlocks` entries (carousel slides)
- Platform adaptations generated in one shot: IG, FB, TIKTOK, LINKEDIN, EMAIL

**`lib/production/qualityGate.ts`**

- Imports `PRODUCTION_MODEL` from `contentStrategist`
- `QUALITY_GATE_QUESTIONS` — 5 questions from the SOP Anti-Generic Filter
- Pass threshold: at least 4 of 5 questions score >= 3 individually
- `runQualityGate(idea)` returns `{ score1–5, reasoning1–5, overallScore, passed }`
- `passed` and `overallScore` are **recomputed server-side** — never trusted from model output

**`lib/production/repurposingRouter.ts`** _(to build)_

- Same model — called from inside `repurpose-worker` Cloud Run container
- Single Gemini call → all 5 platform captions returned as one JSON object
- Runs in Cloud Run, NOT in Next.js (avoids Vercel timeout)

### Quality Gate Questions

1. Could this post belong to any generic mental health page, or is it unmistakably specific to psychiatric assessment mastery?
2. Does this post teach a real, actionable clinical skill that a PMHNP student could apply in their next patient encounter?
3. Is this post saveable or shareable — does it contain reference-quality information worth returning to?
4. Does the hook create genuine clinical tension, name a diagnostic trap, or challenge a common misconception?
5. Does the content reinforce trust in Tonia's specific PAM methodology, or does it feel like generic AI output?

Pass = 4 of 5 questions score >= 3. Overall score = mean of all 5 (stored as `Decimal` in DB).

---

## C. Data Flow

```
LAYER 0  ──  SEED (one-time, already done)
  prisma/seed.ts  →  130 ClinicalField rows in PostgreSQL
  Run: npx tsx prisma/seed.ts

LAYER 1  ──  GENERATE (admin triggers once per 30-day cycle)
  POST /api/production/calendar/generate
    → reads all active ClinicalField rows
    → cycles through 30-entry SCHEDULE_TEMPLATE (Platform/PostType/FunnelStage)
    → calls generateContentIdea() for each day (Gemini)
    → creates ProductionCalendarEntry (DRAFT) + ContentIdea per day
    → returns { generated, failed, entries }

LAYER 2  ──  APPROVE (admin reviews each day)
  PUT /api/production/calendar/[id]/approve
    → calls runQualityGate() (Gemini)
    → saves QualityGateResult
    → IF passed: entry → APPROVED, idea qualityGateStatus → PASSED
    → IF failed: entry stays DRAFT, UI shows which questions failed

LAYER 3  ──  RENDER (admin triggers on approved days)
  POST /api/production/assets/generate
    → creates ContentAsset rows (PENDING) and RenderJob rows (QUEUED)
    → enqueues to Cloud Tasks → dispatches to Cloud Run workers
    → returns 202 immediately (async from here)

LAYER 4  ──  WORKERS (GCP Cloud Run, async)
  carousel-renderer  →  6 PNGs at 1080×1080 → Vercel Blob
  repurpose-worker   →  5 platform text variants → DB as TEXT ContentAssets
  video-renderer     →  ElevenLabs .mp3 + Remotion .mp4 → Vercel Blob
  Each worker: POST /api/production/render-done on completion

LAYER 5  ──  STORAGE (Vercel Blob)
  Path: /production/[calendarEntryId]/[assetType]/[fileName]
  Naming: PAM_[Platform]_[YYYYMMDD]_[Topic]_v[N].[ext]
```

---

## D. GCP Rendering Pipeline — Step-by-Step Setup

### Prerequisites

```sh
# Install Google Cloud CLI (gcloud)
# Windows installer: https://cloud.google.com/sdk/docs/install-sdk#windows
# After install, open a new terminal:
gcloud init
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### Step 1 — Enable Required GCP APIs

```sh
gcloud services enable \
  run.googleapis.com \
  cloudtasks.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com
```

### Step 2 — Create a Service Account for Workers

```sh
gcloud iam service-accounts create pam-worker-sa \
  --display-name="PAM Render Worker"

# Allow it to read secrets
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:pam-worker-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Allow Cloud Tasks to invoke it (as the OIDC target identity)
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:pam-worker-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.invoker"
```

### Step 3 — Store Secrets in Secret Manager

```sh
# Gemini API Key
printf "YOUR_GEMINI_API_KEY" | gcloud secrets create pam-gemini-api-key --data-file=-

# Vercel Blob Token (BLOB_READ_WRITE_TOKEN from .env)
printf "YOUR_BLOB_TOKEN" | gcloud secrets create pam-vercel-blob-token --data-file=-

# Shared callback secret — generate a random value
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
printf "GENERATED_SECRET" | gcloud secrets create pam-render-callback-secret --data-file=-

# ElevenLabs (add when ready)
printf "YOUR_ELEVENLABS_KEY" | gcloud secrets create pam-elevenlabs-api-key --data-file=-
```

### Step 4 — Create Artifact Registry Repository

```sh
gcloud artifacts repositories create pam-workers \
  --repository-format=docker \
  --location=us-central1 \
  --description="PAM render worker containers"

# Authenticate Docker to push images
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### Step 5 — Create the Cloud Tasks Queue

```sh
gcloud tasks queues create pam-render-queue \
  --location=us-central1 \
  --max-attempts=3 \
  --min-backoff=30s \
  --max-backoff=600s \
  --max-doublings=2
```

### Step 6 — Worker Project Structure

Create three standalone Node.js projects under `workers/` in this repo:

```
workers/
  carousel-renderer/
    package.json
    Dockerfile
    src/
      index.ts        ← Express HTTP server, receives Cloud Tasks POST
      renderer.ts     ← Puppeteer slide rendering logic
      upload.ts       ← Vercel Blob upload helper
  repurpose-worker/
    package.json
    Dockerfile
    src/
      index.ts
      repurposingRouter.ts   ← platform caption generation via Gemini
      upload.ts
  video-renderer/
    package.json
    Dockerfile
    src/
      index.ts
      elevenLabs.ts   ← ElevenLabs TTS API call
      remotion.ts     ← Remotion render-media CLI wrapper
      upload.ts
```

### Step 7 — Worker Dependencies

**carousel-renderer**

```sh
npm install express puppeteer @vercel/blob
npm install -D typescript @types/express @types/node
```

> Use `puppeteer` (not `puppeteer-core`) — it bundles its own Chromium.

**repurpose-worker**

```sh
npm install express @google/generative-ai @vercel/blob
npm install -D typescript @types/express @types/node
```

**video-renderer**

```sh
npm install express @remotion/renderer remotion @vercel/blob axios
npm install -D typescript @types/express @types/node
```

> Remotion requires ffmpeg. Use `node:20` base image (has ffmpeg), not `node:20-slim`.

### Step 8 — Dockerfile Pattern (carousel-renderer)

```dockerfile
FROM node:20-slim

# Chrome dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium fonts-liberation libgbm1 \
    --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist/ ./dist/

EXPOSE 8080
CMD ["node", "dist/index.js"]
```

For **video-renderer**, use `FROM node:20` instead (ffmpeg included).

### Step 9 — Worker HTTP Contract

Each worker is an Express server. Cloud Tasks sends a `POST /` with a JSON body.

**Request body sent by Next.js `assets/generate` route:**

```json
{
  "renderJobId": "clxxxxxxx",
  "contentIdeaId": "clxxxxxxx",
  "masterJson": { "hook": "...", "slideTextBlocks": [...], "cta": "..." },
  "callbackUrl": "https://your-app.vercel.app/api/production/render-done",
  "callbackSecret": "loaded from Secret Manager at startup"
}
```

**Worker responds:** HTTP `200` (Cloud Tasks marks task complete on any 2xx).

**Worker calls back to Next.js after rendering:**

```json
POST /api/production/render-done
{
  "renderJobId": "clxxxxxxx",
  "secret": "same secret",
  "assets": [
    {
      "assetType": "CAROUSEL_PNG",
      "platform": "IG",
      "storageUrl": "https://blob.vercel-storage.com/...",
      "fileName": "PAM_IG_20260315_MSEAffect_v1.png"
    }
  ],
  "error": null
}
```

### Step 10 — Build and Deploy a Worker

```sh
# From workers/carousel-renderer/
npm run build   # tsc → dist/

# Build and push Docker image
docker build -t us-central1-docker.pkg.dev/YOUR_PROJECT_ID/pam-workers/carousel-renderer:latest .
docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/pam-workers/carousel-renderer:latest

# Deploy to Cloud Run
gcloud run deploy carousel-renderer \
  --image=us-central1-docker.pkg.dev/YOUR_PROJECT_ID/pam-workers/carousel-renderer:latest \
  --region=us-central1 \
  --service-account=pam-worker-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --no-allow-unauthenticated \
  --memory=2Gi \
  --cpu=2 \
  --concurrency=1 \
  --min-instances=0 \
  --max-instances=3 \
  --set-secrets=GEMINI_API_KEY=pam-gemini-api-key:latest,BLOB_READ_WRITE_TOKEN=pam-vercel-blob-token:latest,RENDER_CALLBACK_SECRET=pam-render-callback-secret:latest
```

Repeat for `repurpose-worker` (`--memory=512Mi --cpu=1`) and `video-renderer` (`--memory=4Gi --cpu=4`, add `ELEVENLABS_API_KEY=pam-elevenlabs-api-key:latest`).

### Step 11 — Grant Cloud Tasks IAM to Invoke Cloud Run

```sh
# Do this for each Cloud Run service
gcloud run services add-iam-policy-binding carousel-renderer \
  --region=us-central1 \
  --member="serviceAccount:pam-worker-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.invoker"
```

### Cloud Run Resources Summary

| Service             | Base Image     | Memory | CPU | Special                      |
| ------------------- | -------------- | ------ | --- | ---------------------------- |
| `carousel-renderer` | `node:20-slim` | 2Gi    | 2   | Install chromium via apt     |
| `repurpose-worker`  | `node:20-slim` | 512Mi  | 1   | None                         |
| `video-renderer`    | `node:20`      | 4Gi    | 4   | ffmpeg included in `node:20` |

All: `--no-allow-unauthenticated`, `--concurrency=1`, `--min-instances=0`, `--max-instances=3`.

---

## E. Remaining Next.js Routes to Build

All use the same admin guard as `app/api/admin/buyers/route.ts`:

```ts
const session = await auth();
if ((session?.user as { role?: string })?.role !== "admin") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

| Route                                   | Method | Key Logic                                                                     |
| --------------------------------------- | ------ | ----------------------------------------------------------------------------- |
| `/api/production/calendar/[id]`         | GET    | Fetch entry + nested idea + assets + qualityGateResult                        |
| `/api/production/calendar/[id]`         | PUT    | Update hook, cta, topic, scheduledAt                                          |
| `/api/production/calendar/[id]/approve` | PUT    | Calls `runQualityGate()` → APPROVED or DRAFT                                  |
| `/api/production/assets/generate`       | POST   | Creates RenderJob rows, enqueues to Cloud Tasks via `@google-cloud/tasks` SDK |
| `/api/production/assets/[id]`           | GET    | Fetch single ContentAsset                                                     |
| `/api/production/render-done`           | POST   | HMAC verify secret → update RenderJob + ContentAsset + calendarEntry          |
| `/api/production/scripts/[id]`          | GET    | Fetch VideoScript                                                             |
| `/api/production/scripts/[id]`          | PUT    | Update scriptJson, elevenLabsJobId, etc.                                      |

**Install Cloud Tasks SDK before building `assets/generate`:**

```sh
npm install @google-cloud/tasks
```

**`render-done` uses the same HMAC pattern as `app/api/webhooks/shopify/route.ts`:**

```ts
import { createHmac, timingSafeEqual } from "crypto";
const sig = createHmac("sha256", process.env.RENDER_CALLBACK_SECRET!)
  .update(rawBody)
  .digest("hex");
if (!timingSafeEqual(Buffer.from(sig), Buffer.from(body.secret))) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

---

## F. Environment Variables

### Next.js (`.env` / Vercel dashboard)

```env
# Already present
GEMINI_API_KEY=
DATABASE_URL=
NEXTAUTH_SECRET=
BLOB_READ_WRITE_TOKEN=

# Add these for the rendering pipeline
RENDER_CALLBACK_SECRET=      # same value as pam-render-callback-secret in GCP
GCP_PROJECT_ID=              # your GCP project ID
GCP_LOCATION=us-central1
CLOUD_TASKS_QUEUE=pam-render-queue
CAROUSEL_RENDERER_URL=       # https://carousel-renderer-xxxx-uc.a.run.app
REPURPOSE_WORKER_URL=        # https://repurpose-worker-xxxx-uc.a.run.app
VIDEO_RENDERER_URL=          # https://video-renderer-xxxx-uc.a.run.app
WORKER_SA_EMAIL=             # pam-worker-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### Cloud Run Workers (injected via `--set-secrets`)

```env
GEMINI_API_KEY=           # from pam-gemini-api-key
BLOB_READ_WRITE_TOKEN=    # from pam-vercel-blob-token
RENDER_CALLBACK_SECRET=   # from pam-render-callback-secret
ELEVENLABS_API_KEY=       # video-renderer only
```

---

## G. Carousel Slide Design Spec

**Dimensions:** 1080×1080px (square) or 1080×1350px (portrait)

| Property               | Value                                      |
| ---------------------- | ------------------------------------------ |
| Background             | Navy `#1F2A44`                             |
| Body text              | Gray `#6B7280`                             |
| Headings / accent text | White `#FFFFFF`                            |
| Primary font           | Montserrat (Google Fonts CDN)              |
| Body font              | Open Sans (Google Fonts CDN)               |
| Slides per post        | 6 — pulled from `slideTextBlocks[0–5]`     |
| Slide 1                | Hook (large Montserrat, white)             |
| Slides 2–5             | Teaching points (numbered list, Open Sans) |
| Slide 6                | CTA + PAM brand                            |

---

## H. Asset Naming Convention

```
PAM_[PLATFORM]_[YYYYMMDD]_[TopicSlug]_v[N].[ext]

PAM_IG_20260315_MSEAffect_v1.png
PAM_TIKTOK_20260315_MSEAffect_v1.txt
PAM_VIDEO_20260315_RiskAssessment_v1.mp4
```

Blob path: `/production/[calendarEntryId]/[assetType]/[fileName]`

---

## I. Verification Checklist

### Completed ✅

- `npx prisma db push` — 7 models + 10 enums live in DB
- `npx tsx prisma/seed.ts` — 130 ClinicalField rows seeded
- `npx tsc --noEmit` — 0 errors on all production files
- `get_errors` on `lib/production/` + `app/api/production/` — no errors

### Pending

- [ ] POST `/api/production/calendar/generate` smoke test — 30 entries, valid `masterJson`, 6 `slideTextBlocks`
- [ ] POST `/api/production/quality-gate` with weak idea → `passed: false`
- [ ] POST `/api/production/quality-gate` with strong idea → `passed: true`
- [ ] `docker build` each worker — confirm image builds clean
- [ ] `docker run` carousel-renderer with mock payload — 6 PNGs at correct size + colors
- [ ] `gcloud run deploy` one worker — confirm `READY` status
- [ ] End-to-end: generate → approve → assets/generate → Cloud Tasks → Cloud Run → render-done → DB updated

---

## J. Decisions Log

| Decision                  | Choice                                 | Reason                                                                                 |
| ------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------- |
| Gemini model              | `gemini-2.0-flash-thinking-exp-01-21`  | Available on this API key; thinking model improves clinical reasoning quality          |
| JSON output mode          | Prompt-enforced + code-fence stripping | Thinking models don't support `responseMimeType: application/json` or `responseSchema` |
| `passed` / `overallScore` | Recomputed server-side                 | Never trust model output for pass/fail logic                                           |
| Rendering infra           | GCP Cloud Run                          | Decouples rendering from Vercel 60s timeout; scale-to-zero = no idle cost              |
| Job queue                 | GCP Cloud Tasks                        | Built-in retry + OIDC auth to private Cloud Run; no custom infra needed                |
| Storage                   | Vercel Blob                            | Same billing ecosystem; `@vercel/blob` SDK works in Cloud Run via token                |
| Schema workflow           | `db push` only                         | Original tables bootstrapped via `db push` — no migration history in DB                |
| Seed runner               | `npx tsx prisma/seed.ts`               | TypeScript seed, no separate compile step                                              |
| Admin auth guard          | `session.user.role !== "admin"`        | Consistent with all existing `/api/admin/` routes                                      |
| Callback security         | HMAC with shared secret                | Mirrors Shopify webhook pattern in `app/api/webhooks/shopify/route.ts`                 |

| Gemini model (March 2026) | `gemini-2.0-flash` | `gemini-2.0-flash-thinking-exp-01-21` was deprecated; flash is stable + faster |

---

## K. Story Bank — Scene Director & Content Pool Spec

### K.1 Overview

The Story Bank transforms each `ProductionCalendarEntry` from a flat idea into a **fully directed, multi-platform content package**:

- Scene-by-scene video storyboard with per-scene voiceover, visual direction, and timing
- Per-platform Canva prompt banks (IG, TikTok, LinkedIn, Email, Video)
- ElevenLabs ESL-friendly voiceover with SSML gesture cues (`[pause]`, `[breath]`, `[emphasize:word]`)
- Flexible video duration 30–60 s (not capped at 30 s)
- Optional soft background music mixed at 15% volume
- 5th tab in ProductionPanel: "Story Bank" (`BookOpen` icon)
- Per-idea Generate buttons with scope dropdown (Carousel / Video / Repurpose / All)

---

### K.2 `ContentIdeaMasterJson` — Extended Interface

Add these fields to the existing interface in `lib/production/contentStrategist.ts`:

```typescript
// ─── ADDED FOR STORY BANK ────────────────────────────────────────────────────
scenes: PAMScene[]              // scene-by-scene breakdown (generated by sceneDirector.ts)
voiceoverFull: string           // complete voiceover script with [pause]/[breath]/[emphasize:word]
platformPromptBank: PlatformPromptBank // per-platform Canva + caption prompts
totalDurationSecs: number       // sum of scene.durationSecs, 30–60 s
```

```typescript
export interface PAMScene {
  type: "COVER" | "TEACHING" | "CTA";
  durationSecs: number; // COVER=5, TEACHING=4-8 (word-count based), CTA=5-6
  voiceoverText: string; // includes [pause]/[breath]/[emphasize:word] cues
  visualDirection: string; // 1-2 sentence Canva/Remotion direction
  textOverlay: string; // headline text shown on-screen
  emojiAccent?: string; // optional emoji for visual flavour
}

export interface PlatformPromptBank {
  IG_CAROUSEL: {
    canvaSlidePrompts: string[]; // 1 per slide, up to 10
    captionHook: string;
    hashtagSet: string[];
  };
  TIKTOK_VIDEO: {
    spokenScript: string; // complete TikTok voiceover (concise, hooks first)
    textOverlays: string[]; // per-scene overlay text
    soundSuggestion: string; // trending audio concept
  };
  LINKEDIN: {
    professionalPost: string; // 150-300 word authority post
    postHook: string;
    cta: string;
  };
  EMAIL: {
    subjectLine: string;
    preheaderText: string;
    bodyThreeParagraphs: string[]; // [hook_para, teaching_para, cta_para]
  };
  VIDEO: {
    sceneDirectorNotes: string[]; // one note per PAMScene
    thumbnailConceptPrompt: string;
    descriptionSEO: string;
  };
}
```

---

### K.3 `lib/production/sceneDirector.ts` — New File

**Purpose:** Takes a complete `ContentIdeaMasterJson` + platform/postType context and expands it into `scenes[]`, `voiceoverFull`, and `platformPromptBank` via a second Gemini call.

```typescript
export async function expandToSceneDirectorScript(
  masterJson: ContentIdeaMasterJson,
  platform: string,
  postType: string,
): Promise<{
  scenes: PAMScene[];
  voiceoverFull: string;
  platformPromptBank: PlatformPromptBank;
  totalDurationSecs: number;
}>;
```

**Scene construction rules (for Gemini prompt):**

- COVER scene: always first, 5 s, hook text as overlay
- TEACHING scenes: one per teaching point, durationSecs = Math.min(8, Math.ceil(words/2.5)), minimum 4 s
- CTA scene: always last, 5-6 s
- Total must be 30-60 s; if under 30 s add 2 s to each TEACHING scene; if over 60 s trim longest TEACHING scenes
- ESL-friendly speech markers embedded in every voiceoverText:
  - `[pause]` after key clinical terms (0.5 s break in SSML)
  - `[breath]` between scene transitions (~0.3 s)
  - `[emphasize:word]` for the single most critical term per scene

---

### K.4 New API Route — `app/api/production/calendar/[id]/scenes/route.ts`

```typescript
// POST /api/production/calendar/[id]/scenes
// Auth-guarded (admin only)
// Body: { platform?: string; postType?: string }
// 1. Fetch entry + its scriptJson from DB
// 2. If scriptJson.scenes already populated — return cached
// 3. Call expandToSceneDirectorScript(masterJson, platform, postType)
// 4. Save result back to VideoScript.scriptJson (merge, not replace)
// 5. Return { scenes, voiceoverFull, platformPromptBank, totalDurationSecs }
```

---

### K.5 ElevenLabs Upgrade — `workers/video-renderer/src/elevenLabs.ts`

| Setting          | Old                           | New                                                                                                                                         |
| ---------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Model            | `eleven_turbo_v2_5`           | `eleven_multilingual_v2`                                                                                                                    |
| Voice            | Rachel `21m00Tcm4TlvDq8ikWAM` | Sarah `EXAVITQu4vr4xnSDxMaL` (default) or George `JBFqnCBsd6RMkjVDRZzb`                                                                     |
| SSML processing  | None                          | `[pause]` to `<break time="0.5s"/>`, `[breath]` to `<break time="0.3s"/>`, `[emphasize:word]` to `<emphasis level="strong">word</emphasis>` |
| Background music | None                          | Optional `backgroundMusicUrl` param; ffmpeg mix at -18 dB (~15% volume)                                                                     |

New export:

```typescript
export async function generateAudioWithSSML(
  voiceoverFull: string,
  options: {
    voiceId?: string;
    backgroundMusicPath?: string;
    outputPath: string;
  },
): Promise<string>;
```

Background music file: `/public/audio/ambient-clinical.mp3` (royalty-free, 60 s loop, ~80 BPM soft piano).

---

### K.6 Remotion Update — `workers/video-renderer/remotion-src/PAMVideo.tsx`

**Current:** accepts `teachingPoints: string[]` with hardcoded per-scene durations.

**Target:** accept `scenes: PAMScene[]` and compute total duration dynamically.

```typescript
interface PAMVideoProps {
  scenes: PAMScene[];
  backgroundAudioUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

// Dynamic total
const totalFrames = scenes.reduce((sum, s) => sum + s.durationSecs * FPS, 0); // max 1800

function buildScenesFromDirectorScript(scenes: PAMScene[]): RemotionScene[] {
  let startFrame = 0;
  return scenes.map((scene) => {
    const durationFrames = scene.durationSecs * FPS;
    const r = { ...scene, startFrame, durationFrames };
    startFrame += durationFrames;
    return r;
  });
}
```

Audio layers: voiceover at 100% volume, background music at 15% volume (if provided).

---

### K.7 Story Bank UI Components

**`components/admin/production/IdeaCard.tsx`** (~300 lines)

- Topic / platform / status / funnel-stage badges
- Scene count pill + timing strip (COVER=navy `#041f50`, TEACHING=blue `#3B82F6`, CTA=purple `#af5ce9`)
- Platform prompt bank accordion — one section per platform with copy-to-clipboard
- Voiceover preview with `[pause]`/`[breath]`/`[emphasize:X]` highlighted in distinct colours
- Voice selector toggle: Sarah / George
- Background music toggle: Off / Soft Ambient / Clinical Pulse
- Generate scope dropdown: Carousel | Video | Repurpose | All
- "Expand scenes" button — calls `POST /api/production/calendar/[id]/scenes`

**`components/admin/production/StoryBankTab.tsx`** (~600 lines)

- Card grid / table view toggle (persisted in `localStorage`)
- Filters: Platform, PostType, FunnelStage, Status, topic search (client-side)
- Shows ALL 30 entries regardless of status
- Bulk generate: `POST /api/production/assets/generate` with `{ entryIds, scope }`
- Pool counter: "X / 30 ideas have scenes · Y have full asset packages"

**`ProductionPanel.tsx` additions:**

```typescript
type ProdView = "calendar" | "assets" | "metrics" | "schedule" | "storybank"

// VIEWS array addition
{ id: "storybank", label: "Story Bank", icon: BookOpen }

// AnimatePresence block addition
{activeView === "storybank" && (
  <StoryBankTab entries={entries} onRefresh={fetchCalendar} />
)}
```

---

### K.8 30+ Unique Content Pool Design

The seed schedule (`prisma/seed.ts: SCHEDULE_TEMPLATE`) has 30 unique entries across:

- 6 PostTypes: `IG_CAROUSEL`, `TIKTOK_VIDEO`, `LINKEDIN_POST`, `EMAIL_NURTURE`, `BLOG_DRAFT`, `VIDEO_SCRIPT`
- 5 FunnelStages: `AWARENESS`, `CONSIDERATION`, `DECISION`, `RETENTION`, `ADVOCACY`
- Multiple clinical domains: MSE, Safety Assessment, Diagnostic Criteria, Psychopharmacology, etc.

Content pool rules for Gemini prompt:

- Each idea must be clinically unique — no two entries share the same teaching angle
- `slideTextBlocks` cap lifted 6 → 10 slides per carousel
- `estimatedReadTimeSecs` must reflect actual slide count (target: 45–90 s for carousels)

---

## L. Story Bank — Implementation Task Checklist

> Mark `[x]` as each item is completed. Resume from first unchecked item.

### Phase 0 — Fix Generate (Immediate)

- [x] Fix `PRODUCTION_MODEL` in `lib/production/contentStrategist.ts` → `gemini-2.0-flash`
- [x] Fix `PRODUCTION_MODEL` in `workers/repurpose-worker/src/repurposingRouter.ts` → `gemini-2.0-flash`
- [x] Update decision log entry (Section J) in this doc
- [x] Delete `prisma/checkSeed.ts` (temp diagnostic file)
- [ ] Commit + push + Vercel deploy
- [ ] Smoke test: `POST /api/production/calendar/generate` → 200 + 30 entries in DB
- [ ] Verify entries appear in CalendarTab in admin UI

### Phase 1 — Enrich Content Schema

- [ ] Add `scenes[]`, `voiceoverFull`, `platformPromptBank`, `totalDurationSecs` to `ContentIdeaMasterJson` in `contentStrategist.ts`
- [ ] Add `PAMScene` and `PlatformPromptBank` interfaces (see K.2)
- [ ] Expand Gemini prompt to output the new fields (see K.3 prompt rules)
- [ ] Remove 6-slide hard cap on `slideTextBlocks` — allow up to 10
- [ ] Update `estimatedReadTimeSecs` prompt instruction (45–90 s for carousels)
- [ ] Smoke test regenerated entry — inspect `scriptJson` for `scenes` key

### Phase 2 — Scene Director Service

- [ ] Create `lib/production/sceneDirector.ts` with `expandToSceneDirectorScript()` (see K.3)
- [ ] Implement COVER / TEACHING / CTA scene rules + 30-60 s clamp
- [ ] ESL marker validation: retry once if output missing `[pause]`/`[breath]` cues
- [ ] Create `app/api/production/calendar/[id]/scenes/route.ts` (see K.4)
- [ ] Auth-guard with `session.user.role !== "admin"` check
- [ ] Cache check: return existing `scriptJson.scenes` if already populated

### Phase 3 — ElevenLabs Upgrade

- [ ] Update `workers/video-renderer/src/elevenLabs.ts`: model → `eleven_multilingual_v2` (see K.5)
- [ ] Add voice picker: Sarah `EXAVITQu4vr4xnSDxMaL` + George `JBFqnCBsd6RMkjVDRZzb`
- [ ] Build `processSSMLMarkers()` — `[pause]`/`[breath]`/`[emphasize:word]` → SSML (strip before TTS, ElevenLabs ignores SSML natively)
- [ ] Add `backgroundMusicPath` param + ffmpeg mix at -18 dB
- [ ] Add `/public/audio/ambient-clinical.mp3` (royalty-free 60 s piano loop)
- [ ] Export `generateAudioWithSSML(voiceoverFull, options): Promise<string>`

### Phase 4 — Remotion Update

- [ ] Update `PAMVideo.tsx` props: `teachingPoints: string[]` → `scenes: PAMScene[]` (see K.6)
- [ ] Add `buildScenesFromDirectorScript()` helper
- [ ] Dynamic `durationInFrames` per scene: `scene.durationSecs * 30`
- [ ] Total duration = sum of all scene durations (max 1800 frames = 60 s @ 30 fps)
- [ ] Progress bar tracks dynamic total duration
- [ ] Optional `backgroundAudioUrl` prop (ambient at 15%, voiceover at 100%)
- [ ] Update `workers/video-renderer/src/renderVideo.ts` to pass `scenes` instead of `teachingPoints`

### Phase 5 — Story Bank UI

- [ ] Create `components/admin/production/IdeaCard.tsx` (~300 lines) — see K.7
  - [ ] Badge row: topic / platform / status / funnel-stage
  - [ ] Scene timing strip (COVER=navy `#041f50` / TEACHING=blue `#3B82F6` / CTA=purple `#af5ce9`)
  - [ ] Platform prompt accordion with copy-to-clipboard
  - [ ] Voiceover preview with colour-coded gesture cues
  - [ ] Voice selector + music toggle + generate scope dropdown
  - [ ] "Expand scenes" button → `POST /api/production/calendar/[id]/scenes`
- [ ] Create `components/admin/production/StoryBankTab.tsx` (~600 lines) — see K.7
  - [ ] Card / table view toggle (persisted to `localStorage`)
  - [ ] Client-side filters: Platform, PostType, FunnelStage, Status, text search
  - [ ] Shows ALL 30 entries (unlike CalendarTab)
  - [ ] Bulk generate + pool counter
- [ ] Add `"storybank"` to `ProdView` type in `ProductionPanel.tsx`
- [ ] Add `{ id: "storybank", label: "Story Bank", icon: BookOpen }` to `VIEWS` array
- [ ] Import and render `<StoryBankTab>` inside `AnimatePresence` block
- [ ] Confirm `BookOpen` imported from `lucide-react`

### Phase 6 — End-to-End Test

- [ ] Generate 30 entries — confirms Phase 0 fix
- [ ] Expand one entry scenes via `POST /api/production/calendar/[id]/scenes`
- [ ] Inspect `voiceoverFull` for `[pause]`/`[breath]`/`[emphasize:X]` cues
- [ ] Trigger video render — confirm ElevenLabs uses new model + voice
- [ ] Confirm rendered duration matches `totalDurationSecs` (not hardcoded 30 s)
- [ ] Load Story Bank tab — 30 cards visible with prompt accordions populated
- [ ] Copy Canva prompt from IG_CAROUSEL accordion — verify clinical specificity
- [ ] Voice selector + music toggle persist state without page reload

---

_Last updated: March 2026 — Story Bank spec added (Sections K–L). Model fixed: gemini-2.0-flash._
