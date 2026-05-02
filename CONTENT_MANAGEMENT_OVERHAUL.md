# Content Management Overhaul

## Core Definition

This should no longer be treated like a complicated internal CMS.

The correct structure is:

- `Content Management` remains the broader admin area
- `Carousel Studio` becomes a distinct visual creation workspace above the current content management flow
- the system is built to create rich, non-generic carousels with platform-matched captions
- the experience should feel like a visual studio for creating carousels, not a calendar dashboard or render queue manager

The main job is:

- start from a prompt, pasted content, CSV, or PDF
- structure the material with AI
- generate a carousel and four platform-specific caption variants
- edit the output directly in a canvas-style UI
- export assets and copy Facebook, Instagram, TikTok, and LinkedIn captions without reload friction

## Naming

- `Content Management` replaces the old internal-CMS framing
- `Carousel Studio` is the new creation surface inside that area

This distinction matters.

`Content Management` is the management layer.

`Carousel Studio` is the making layer.

## Studio Behavior

The input model should be flexible.

Supported starting points:

- prompt only
- prompt plus upload
- CSV upload
- PDF upload
- pasted source material

Whatever is provided should be processed into carousel-ready structure.

If the source is weak or unstructured, AI should enhance it into a usable carousel outline and caption set.

The prompt area should read like a chatbot-style interface:

- enter prompt
- attach supporting file if needed
- refine the original prompt
- issue targeted prompt edits to a specific slide or caption block

## Visual Direction

`Carousel Studio` must feel visually distinct from the current production dashboard.

It should not feel like:

- a spreadsheet
- a calendar table
- a generic admin panel
- a queue monitor

It should feel like:

- a visual studio for carousel creation
- a content canvas
- a prompt-to-design workspace

### Recommended workspace layout

1. Left: prompt and source input
2. Center: live carousel canvas
3. Right: caption variants and actions

### Left panel

- prompt entry
- CSV and PDF upload
- source material paste area
- brand voice controls when needed
- regenerate instructions for the whole output or a selected element

### Center panel

- slide-by-slide carousel editor
- reorder slides
- inline edit headline and body
- duplicate or remove slide
- strong design preview, not plain text placeholders

### Right panel

- Facebook caption
- Instagram caption
- TikTok caption
- LinkedIn caption
- one-click copy per platform
- regenerate one platform only
- quick notes for channel-specific constraints

### Bottom action bar

- `Generate Carousel`
- `Regenerate Captions`
- `Save Draft`
- `Export Assets`
- `Approve for Manual Publish`

## Current Problems in the Existing Repo

The current experience is still built around pipeline mechanics instead of operator speed.

Examples:

- the main production UI is still centered on `Overview`, `Data Table`, `Import & Generate`, and `Assets Queue` in [components/admin/production/ProductionPanel.tsx](components/admin/production/ProductionPanel.tsx)
- the detail flow still relies on `Content`, `Quality Gate`, and `Assets` tabs in [components/admin/production/DayPanel.tsx](components/admin/production/DayPanel.tsx)
- the user is still forced to think in terms of calendar rows, render jobs, and approval states instead of prompt -> carousel -> captions -> export

That is the core reason the workflow feels overloaded.

## Backend Reality

The backend has already partly moved toward simplification.

What is already true:

- video generation is intentionally blocked in [app/api/production/assets/generate/route.ts](app/api/production/assets/generate/route.ts)
- the active production path is mainly carousel, text, and email generation

What still adds drag:

- `VIDEO` still exists in [lib/enums.ts](lib/enums.ts)
- video and audio asset types still exist in [lib/enums.ts](lib/enums.ts)
- `production-video` still exists in [trigger/production.ts](trigger/production.ts)
- `repurposeInline` still carries video-specific logic in [lib/production/repurposeInline.ts](lib/production/repurposeInline.ts)

So the codebase still exposes a broader production system than the product really needs.

## Database Reality

The current production structure spans too many concepts for a carousel-first tool.

Current model in the repo and code references includes:

- `production_calendar_entries`
- `content_ideas`
- `quality_gate_results`
- `content_assets`
- `render_jobs`
- `video_scripts`
- `audio_cache`
- no `publish_jobs` in Carousel Studio v1

That is too much surface area for the job of building carousels and matched captions quickly.

## Access and Roles: Verified State Only

This document should not claim expanded role-based access because the repo does not show a full RBAC implementation.

What is actually present:

- auth resolves the current user from Supabase in [lib/auth.ts](lib/auth.ts)
- admin access checks read `profiles.role`
- server routes consistently gate on `role === "ADMIN"`
- fallback behavior is effectively `USER`

What is not clearly implemented:

- editor role
- reviewer role
- scoped permissions by feature
- multi-level approval roles

Conclusion:

- keep the scope to the current admin-gated model
- do not include broader RBAC unless it is built later

## New Primary Object

The primary object should not be a calendar entry.

It should be a `content_package`.

Each package should hold:

- source prompt
- uploaded source reference
- normalized source material
- carousel structure JSON
- caption variants JSON
- asset export metadata
- approval state

This keeps the user focused on one post bundle at a time.

## Recommended Workflow

1. Open `Content Management`
2. Enter `Carousel Studio`
3. Paste a prompt or upload source material
4. Generate the first carousel draft and four caption variants
5. Edit by typing directly or by issuing targeted prompt edits
6. Save draft without leaving the workspace
7. Export assets or approve for manual publishing

This should happen in one page-level workspace, not across multiple admin layers.

## Proposed Studio Sections

1. `Create`
2. `Drafts`
3. `Library`
4. `Settings`

### Create

Default landing view and main production surface.

### Drafts

Show lightweight content packages instead of calendar rows.

Suggested fields:

- title
- status
- last updated
- source type
- platforms ready

### Library

Stores reusable approved ideas and successful carousel packages.

### Settings

- caption style rules
- output presets
- CTA presets
- manual distribution notes
- brand guardrails

## Schema Direction

### Keep and simplify

- `content_packages`
- `content_assets`
- no `publish_jobs` in Carousel Studio v1

### Merge into `content_packages`

- `production_calendar_entries`
- `content_ideas`
- most of `quality_gate_results`

### Retire if carousel-first scope is confirmed

- `video_scripts`
- `audio_cache`
- video-specific render job branches

## Suggested `content_packages` shape

- `id`
- `title`
- `status`
- `source_prompt`
- `source_type`
- `source_material`
- `primary_format`
- `carousel_json`
- `captions_json`
- `quality_notes_json`
- `created_by`
- `created_at`
- `updated_at`

Recommended lifecycle:

- `DRAFT`
- `READY`
- `APPROVED`
- `PUBLISHED`
- `ARCHIVED`

## Route Direction

The route surface should become smaller and easier to maintain.

Target shape:

- `POST /api/content-packages`
- `GET /api/content-packages`
- `GET /api/content-packages/[id]`
- `PATCH /api/content-packages/[id]`
- `POST /api/content-packages/[id]/generate`
- `POST /api/content-packages/[id]/approve`

Important notes:

- do not overpopulate the routes
- keep files readable and split them before they become hard to edit
- quality gate should support publish readiness, not drag the user back into calendar logic

## Performance Direction

### Frontend

- keep the editor mounted
- use optimistic local state
- autosave quietly in the background
- regenerate targeted fragments instead of reloading the whole page

Examples:

- regenerate one caption only
- regenerate one slide only
- export without leaving the current workspace

### Backend

- fetch shallow lists for drafts
- fetch heavy detail only when opening a package
- move diagnostics into secondary requests
- generate captions and exports on demand instead of precomputing everything

Most important rule:

- export assets only when requested

That reduces storage churn, background jobs, and refresh pressure.

## Quality Standard

The number-one acceptance criterion is the output quality of:

- the carousel
- the captions

They must adapt properly to each platform.

The design should not produce bland or generic output.

Requirements:

- detailed AI prompts
- stronger visual direction per carousel
- multiple output variants where the source supports it
- richer structure than previous attempts
- better typography, spacing, and slide composition
- platform-aware caption style for Facebook, Instagram, TikTok, and LinkedIn

If Satori remains in the stack, the prompting and layout system around it needs to become much more deliberate.

## MVP Scope

The minimum useful version should support:

1. Prompt input
2. CSV and PDF upload
3. Carousel generation
4. Platform-specific caption generation
5. Inline editing
6. Draft save and load
7. Export assets and captions
8. Publish approval gate where necessary

## Final Direction

This is not a visual reskin of the current production dashboard.

It is a structural reset:

- `Content Management` is the admin section
- `Carousel Studio` is the visual creation environment
- the workflow becomes prompt-first and canvas-first
- calendar-first thinking is removed from the creation path
- unsupported RBAC language is removed from scope
- dead video and queue complexity should stop shaping the product

The fastest path should be:

- prompt or upload -> generate -> edit -> export -> approve for manual publish

That is the product this system is supposed to become.

## Implementation Phases

### Sprint 1

- create the new `Carousel Studio` entry point above the current content management flow
- keep the old production system reachable during transition, but visually secondary
- build the new page as a full-page workspace, not a modal or tabbed panel

### Sprint 2

- implement prompt input, CSV/PDF upload, and normalized source parsing
- generate the first carousel structure and the four platform caption variants
- support targeted prompt edits for a single slide or a single caption block

### Sprint 3

- build the live canvas editor with slide ordering, inline text editing, and visual preview
- add one-click copy for each platform caption
- add draft save/load without page resets

### Sprint 4

- move export generation to on-demand actions only
- reduce route fragmentation around calendar and render-job driven flows
- keep the quality gate as publish support, not as a creation bottleneck

### Cleanup Pass

- remove dead video branches once no active feature depends on them
- remove audio-specific storage and job paths if they are no longer needed
- trim enum values, UI badges, and queue panels that only exist for legacy flow

### Success Criteria

- the workspace feels like a creative studio, not an admin spreadsheet
- the user can go from prompt or upload to finished carousel without leaving one page
- every output includes four platform-aware caption variants
- carousel design quality is visibly stronger and less generic than prior versions
- exports are on demand, not pre-rendered by default
- the system no longer depends on calendar-first thinking for creation
- the document stays aligned with the current repo reality: admin-gated access, no invented RBAC

## Constraint Notes

- keep admin-only access wording because that is what the repo currently enforces
- do not introduce editor or reviewer roles in scope until they exist in code and schema
- keep video distinct as legacy or optional work, not as the dominant workflow
- prioritize carousel quality and caption adaptation over queue complexity
- keep the brief short enough to scan quickly while staying specific
