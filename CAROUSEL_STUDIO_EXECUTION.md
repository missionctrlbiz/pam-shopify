# Carousel Studio — Execution Spec

Strictly technical. Carousel Studio is built as an isolated module under
`app/admin/studio/*` with its own DB tables, routes, and state — it does not depend on
or write back into the existing `production_calendar_*` / `content_ideas` system.

---

## 1. Scope

One feature surface, one primary object (`content_packages`), one streaming AI loop, one
export-on-demand pipeline. Four platforms (IG/FB/LI/TT) for captions; one carousel format
(1080 px PNG, 3 ratios) for slides.

---

## 2. Stack

### Existing (reused)

| Layer | Package |
|---|---|
| Framework / runtime | Next.js 16 App Router, Vercel |
| DB / Auth / Storage | Supabase (Postgres, RLS, Storage `studio` bucket) |
| AI provider | Google Gemini (`@google/genai`, `gemini-2.5-pro` strategist, `gemini-2.5-flash` gate) |
| Background jobs | Trigger.dev v4 |
| Image render | Satori 0.25 + `@resvg/resvg-js` 2.6.2 |
| Styling | Tailwind v4, Montserrat heading + Open Sans body|

### New dependencies (to add)

| Package | Purpose |
|---|---|
| `ai` (Vercel AI SDK ≥ 4) | `streamObject` + `streamText`; primitive that drives the chat-to-canvas live updates |
| `@ai-sdk/google` | Gemini provider for the AI SDK |
| `@assistant-ui/react` | Pre-built streaming chat UI primitives (message list, composer, attachments). Wraps `useChat`. |
| `zustand` | Local store for the active package (chat history, carousel JSON, captions, dirty flag) |
| `zod` | Schemas for `carousel_json`, `captions_json`, request bodies |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Slide reorder + CTA preset reorder |
| `@tiptap/react` + `@tiptap/starter-kit` | Inline rich text on slide headlines/body — minimal, single-line + bold |
| `pdf-parse` | PDF source ingestion |
| `papaparse` | CSV source ingestion |
| `nanoid` | Slide IDs inside `carousel_json` |

> Not adopted: Konva, Fabric, Excalidraw — overkill. The canvas is structured DOM, not a
> free-draw surface.

---

## 3. Database Schema

All tables prefixed `studio_` to keep isolation from legacy production tables. One Supabase
migration: `supabase/migrations/<ts>_studio_init.sql`.

### `studio_packages`

```sql
create table studio_packages (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  title         text not null default 'Untitled',
  status        text not null default 'DRAFT'
                check (status in ('DRAFT','READY','APPROVED','PUBLISHED','ARCHIVED')),

  source_type   text not null default 'PROMPT'
                check (source_type in ('PROMPT','PDF','CSV','PASTE')),
  source_prompt text,
  source_blob_path text,                       -- supabase storage path
  source_text   text,                          -- normalized source after parsing

  carousel_json jsonb not null default '{}'::jsonb,   -- see §3a
  captions_json jsonb not null default '{}'::jsonb,   -- see §3b
  quality_json  jsonb not null default '{}'::jsonb,   -- gate scores (lazy)

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on studio_packages (owner_id, updated_at desc);
create index on studio_packages (status);
```

#### 3a. `carousel_json` shape

```ts
{
  ratio: '1:1' | '4:5' | '9:16',
  slides: [
    { id: string, kind: 'COVER'|'INSIGHT'|'CTA'|'STAT'|'QUOTE',
      headline: string, body: string,
      stat?: { value: string, label: string },
      bg: 'NAVY'|'WHITE'|'INK'|'GRADIENT',
      assets?: { logo: 'COLOR'|'WHITE'|'NONE', book?: boolean }
    }
  ],
  meta: { palette: string[], font: 'Inter'|'Montserrat' }
}
```

#### 3b. `captions_json` shape

```ts
{
  instagram: { body: string, hashtags: string[], chars: number },
  facebook:  { body: string, hashtags: string[], chars: number },
  linkedin:  { body: string, hashtags: string[], chars: number },
  tiktok:    { body: string, hashtags: string[], chars: number }
}
```

### `studio_messages` (chat history per package)

```sql
create table studio_messages (
  id          uuid primary key default gen_random_uuid(),
  package_id  uuid not null references studio_packages(id) on delete cascade,
  role        text not null check (role in ('user','assistant','system')),
  content     text not null,
  target      text,           -- 'CAROUSEL' | 'SLIDE:<id>' | 'CAPTION:<platform>' | null
  created_at  timestamptz not null default now()
);
create index on studio_messages (package_id, created_at);
```

### `studio_assets` (export-on-demand)

```sql
create table studio_assets (
  id          uuid primary key default gen_random_uuid(),
  package_id  uuid not null references studio_packages(id) on delete cascade,
  kind        text not null check (kind in ('SLIDE_PNG','CAPTION_TXT','BUNDLE_ZIP')),
  ratio       text,           -- '1:1' etc, nullable for caption/bundle
  slide_id    text,           -- nullable — only for SLIDE_PNG
  storage_path text not null,
  bytes       int,
  created_at  timestamptz not null default now()
);
create index on studio_assets (package_id);
```

### `studio_settings` (per owner, singleton row)

```sql
create table studio_settings (
  owner_id    uuid primary key references auth.users(id) on delete cascade,
  brand_json  jsonb not null default '{}'::jsonb,   -- see below
  cta_presets jsonb not null default '[]'::jsonb,
  tone        text not null default 'AUTHORITATIVE',
  hook_style  text not null default 'STAT_LED',
  hashtag_cluster text not null default '',
  model_strategist text not null default 'gemini-2.5-pro',
  model_gate       text not null default 'gemini-2.5-flash',
  gate_threshold   numeric(2,1) not null default 3.0,
  default_slides   int not null default 4,
  always_say  text,
  never_say   text,
  updated_at  timestamptz not null default now()
);
```

`brand_json`:
```ts
{
  brand_name: string,
  site_url: string,
  product_url: string,
  audience: string,
  logo_path: string,           // storage
  book_path: string,           // storage
  alt_path?: string,
  palette: string[]            // hex
}
```

### No publish or platform credential tables

Carousel Studio does not store social access tokens, does not enqueue publish jobs, and does
not auto-post. Distribution is manual: export the PNG/ZIP bundle, copy the platform captions,
then schedule/post in the external platform or scheduler.

### RLS

All tables: `enable row level security`. Two policies per table:
- `select/insert/update/delete using (owner_id = auth.uid())` for owner rows
- service-role bypass for server routes

---

## 4. Architecture & Request Lifecycle

```
[Studio UI / Zustand store]
        │
        │ chat send / regen / inline edit
        ▼
[POST /api/studio/packages/:id/chat]   ── streamObject ──▶  Gemini
        │                                               (Zod schema = CarouselUpdate)
        │ partial JSON tokens
        ▼
[useChat / useObject hook]
        │ on each delta → mergeIntoCarouselJson()
        ▼
[Canvas re-renders slide(s) live]
        │
        │ debounce 800ms when stream ends
        ▼
[PATCH /api/studio/packages/:id]   →   studio_packages.carousel_json
```

Key principles:

- **Server is thin.** No queue, no long-poll, no precompute. Routes are streaming
  passthroughs to Gemini via the AI SDK.
- **Client owns the working copy.** Zustand holds `package`, `messages`, `dirty`. The DB
  is the slow side; the canvas is the fast side.
- **Partial-object streaming is the canvas update.** Use `streamObject` with a partial Zod
  schema; the AI SDK delivers `{ partial }` events that we merge slide-by-slide. No diffing.
- **Targeted prompts** carry a `target` field (`SLIDE:<id>` or `CAPTION:<platform>`) so the
  server only asks Gemini to regenerate the requested fragment and the merger only patches
  that key.
- **Captions and slides are independent endpoints.** Regenerating one caption never re-runs
  carousel generation.

---

## 5. API Surface

All under `app/api/studio/`. Each route checks `profiles.role === 'ADMIN'` server-side.

| Route | Method | Purpose |
|---|---|---|
| `packages` | `GET` | Shallow list for Drafts/Library views |
| `packages` | `POST` | Create empty package |
| `packages/:id` | `GET` | Full package + recent messages |
| `packages/:id` | `PATCH` | Partial update (autosave: title, carousel_json, captions_json) |
| `packages/:id` | `DELETE` | Soft delete → status=ARCHIVED |
| `packages/:id/chat` | `POST` | **Streams** carousel/caption updates via `streamObject` |
| `packages/:id/source` | `POST` | Upload PDF/CSV/paste → returns normalized text |
| `packages/:id/quality-gate` | `POST` | Run gate (`gemini-2.5-flash`); writes `quality_json` |
| `packages/:id/approve` | `POST` | Mark package `APPROVED` for manual distribution |
| `packages/:id/export` | `POST` | Dispatch Trigger.dev export task; returns task id or inline assets locally |
| `settings` | `GET`/`PATCH` | Studio settings (singleton per owner) |

No `publish` or `connections` routes in v1.

`packages/:id/chat` request body:
```ts
{ message: string, target?: 'CAROUSEL'|`SLIDE:${id}`|`CAPTION:${'instagram'|...}`, attachments?: {kind,path}[] }
```

Response: AI SDK streaming protocol; client uses `useObject({ schema: PartialCarouselSchema })`.

---

## 6. Client State (Zustand)

```ts
interface StudioStore {
  packageId: string;
  package: Package;                  // hydrated from GET /:id
  messages: ChatMessage[];

  ratio: '1:1'|'4:5'|'9:16';
  activePlatform: 'instagram'|'facebook'|'linkedin'|'tiktok';
  selectedSlideId: string | null;

  dirty: boolean;
  streaming: boolean;

  // mutations
  patchSlide(slideId, patch): void;
  setCaption(platform, body): void;
  mergeStreamingDelta(partial: PartialCarousel): void;
  appendMessage(m): void;
  flushAutosave(): Promise<void>;     // PATCH /:id, debounced 800ms
}
```

Autosave debounce wraps every mutation that flips `dirty=true`. No server-driven realtime
in v1 — single-user-per-package by design.

---

## 7. Render & Export Pipeline

Identical primitives to existing carousel render but isolated:

- `lib/studio/render/carousel.ts` — Satori → resvg → 1080×1080 PNG. Pure function:
  `(slide, brand, ratio) => Buffer`.
- `trigger/studio.ts` — single task `studio-export-package` (machine `medium-1x`,
  timeout 10 min). Inputs: `package_id`. Output: writes N rows to `studio_assets`,
  uploads PNGs to `studio` bucket under `${package_id}/slides/${ratio}/${slide_id}.png`.
- Captions are not pre-rendered; `studio-export-package` writes them as `.txt` only when
  `kind === 'BUNDLE_ZIP'`.
- Bundle export = ZIP via `archiver` streamed to Storage. Single asset row per bundle.

Export is purely on-demand. Generating a draft never enqueues a render.

--
NO PUBLISHING PIPELINE
WE EXTRACT IP AND COPY CAPTION THEN SCHEDULE AND POST MANUALLY
PROCEED

---

## 9. Streaming + Real-Time UX Pattern

```ts
// app/admin/studio/[id]/_hooks/useStreamingCarousel.ts
const { object: partial, submit } = useObject({
  api: `/api/studio/packages/${id}/chat`,
  schema: PartialCarouselSchema,        // zod
  onFinish: () => store.flushAutosave(),
});
useEffect(() => { if (partial) store.mergeStreamingDelta(partial); }, [partial]);
```

`PartialCarouselSchema` mirrors `carousel_json` but with every field optional so partial
deltas are valid mid-stream. The merger is idempotent: each delta replaces the keys it
contains, leaving others untouched.

For caption-only edits the same hook is mounted with `schema: PartialCaptionSchema` and
the request body's `target` field gates which schema the server uses.

---

## 10. Directory Layout

```
app/
  admin/
    studio/
      page.tsx                       (lists Drafts; same component used for Library tab)
      [id]/
        page.tsx                     (full Studio shell — sidebar, canvas, captions)
        _components/
          ChatComposer.tsx           (assistant-ui wrapper)
          CanvasSlide.tsx            (single slide DOM)
          CanvasRail.tsx             (horizontal slide list + dnd-kit)
          CaptionPanel.tsx           (vertical platform rail)
          QualityStrip.tsx
          BottomDock.tsx
          ToneCardGrid.tsx
        _hooks/
          useStudioStore.ts          (zustand)
          useStreamingCarousel.ts
          useAutosave.ts
        _schemas/
          carousel.ts                (zod: PartialCarouselSchema, CarouselSchema)
          caption.ts

app/api/studio/...                   (routes from §5)

lib/studio/
  ai/
    strategist.ts                    (system prompt builder + Gemini call)
    captionWriter.ts                 (per-platform style packs)
    qualityGate.ts
  render/
    carousel.ts                      (Satori → PNG)
    bundle.ts                        (zip)
  parse/
    pdf.ts
    csv.ts
 !NO SOCIAL SCHEDULING!!!!!!

supabase/migrations/<ts>_studio_init.sql
```

---

## 11. Phasing

| Phase | Output | Acceptance |
|---|---|---|
| 1. DB + skeleton | Migration applied; `GET/POST/PATCH /packages` work; empty studio shell renders | Empty draft can be created and re-opened |
| 2. Streaming chat → canvas | `useObject` wired to Gemini via AI SDK; partial slides render live | Typing a prompt produces visible slides within 2s, completed in < 8s |
| 3. Captions + targeted regen | Per-platform regen, char counts, copy buttons | Regenerating IG does not re-run carousel |
| 4. Inline editing | TipTap headline/body, dnd-kit reorder, autosave | Changes survive page reload without a Save button |
| 5. Quality gate + approve | `quality_json` populated lazily; APPROVE flips status | Score chip updates within 3s of click |
| 6. Export on demand | Trigger.dev task writes PNGs + bundle ZIP | Export of a 5-slide carousel completes < 30s |
| 8. Settings persistence | `studio_settings` round-trips brand brief, tone, presets | Brand brief reflected in next generation's slide watermark and CTA |

Each phase ships behind a single feature flag `STUDIO_ENABLED=true` until phase 8????what do u mean??

WHen building with tailwind it must have a Mobile responsive layout. Maintain the same sidebar structure as in main admin

## 12. Out of Scope

- Multi-user collaborative editing (no Supabase Realtime, no Yjs/Liveblocks in v1).
- Free-draw canvas (no Konva/Excalidraw).
- Video, audio, ElevenLabs, Remotion — explicitly excluded; carousel + captions only.
- 
- Calendar, scheduling beyond a single `scheduled_for` per publish job.
- Importing/migrating legacy `production_calendar_entries` rows.
