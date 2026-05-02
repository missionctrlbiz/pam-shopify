# PAM Agent Skills

Use these workflows as mandatory checklists. They are intentionally short and practical.

## Skill: `/map-execution`

Use before editing generation, rendering, export, or background-job code.

1. Identify the entrypoint route, task, or component.
2. State where the code runs: browser, Vercel serverless, Trigger.dev cloud, or mixed.
3. Search imports from `trigger/` before touching shared libraries.
4. If Trigger imports the changed file, plan a Trigger deploy and mention the exact command.

Common mappings:

- `components/admin/studio/*`: browser client
- `app/api/studio/*`: Vercel serverless
- `lib/studio/ai.ts`: Vercel serverless generation helper
- `lib/studio/render/carousel.ts`: Trigger.dev export renderer
- `lib/studio/exportPackage.ts`: Trigger.dev Studio export
- `trigger/studio.ts`: Trigger.dev cloud
- `lib/production/repurposeInline.ts`: Trigger.dev production renderer

## Skill: `/ui-bug`

Use for any admin UI crash, layout bug, modal, panel, or Studio editor issue.

1. Capture the visible state or inspect the supplied screenshot.
2. Read the exact stack trace and name the component/function.
3. Confirm client/server execution.
4. Patch the source component, not a guessed nearby file.
5. Run `npx tsc --noEmit`.
6. Run targeted lint for touched files.
7. Run `npm run build` for broad UI or route changes.

Current Studio UI targets:

- Main Studio workspace: `components/admin/studio/ContentManagementPanel.tsx`
- Admin tab shell: `components/admin/AdminDashboardClient.tsx`
- Studio package API: `app/api/studio/packages/*`

## Skill: `/studio-generation`

Use for prompt, AI output, slide/caption structure, or streaming bugs.

1. Read `CAROUSEL_STUDIO_EXECUTION.md`, `CONTENT_MANAGEMENT_OVERHAUL.md`, and
   `MEMORY.md`.
2. Keep Studio isolated from production calendar tables.
3. Normalize streamed partial objects before rendering.
4. Preserve exact slide count requests when present.
5. Preserve visual variety: rotate `kind`, `bg`, stat, quote, checklist, dark insight,
   cover, and CTA treatments.
6. Keep captions platform-specific and normalized.
7. Enforce hashtag floors: Instagram >=20, Facebook >=20, LinkedIn 8-10, TikTok >=10.
8. Do not add mock data to mask empty or failed generation.

Current Studio generation invariant: the prompt/chat panel is the only generation entrypoint.
Do not add broad Generate buttons in the header or canvas controls.

## Skill: `/studio-actions`

Use when touching buttons or editor commands.

1. Every visible control must trigger a real action or be removed.
2. Slide `Regen` updates only the targeted slide.
3. Slide `Copy` duplicates a slide and persists it.
4. Slide `Delete` removes a slide and persists it.
5. Caption copy writes the current normalized caption to clipboard.
6. Export dispatches the Studio export API and, through Trigger.dev, renders real assets.
7. Export belongs in the canvas action bar before Save Draft; do not duplicate it in the
   Studio header.
8. Save, export, copy, duplicate, regenerate, delete, approve, and model/API failures must
   produce toast or confirmation feedback.
9. Disable controls while work is in progress where double-submit would corrupt state.

## Skill: `/studio-create-flow`

Use when touching Carousel Studio navigation, tabs, or draft lifecycle.

1. Clicking Create starts a new blank unsaved working session.
2. Do not automatically reopen the previous package in Create.
3. Untouched blank sessions are discarded and never written to Supabase.
4. Dirty new sessions require a save/discard confirmation before leaving.
5. Existing packages are opened only from Drafts or Library.

## Skill: `/studio-render-quality`

Use when touching Satori/Gemini slide output, visual variants, or export rendering.

1. Use PAM gradient accents for borders, icons, dividers, bullets, chips, and highlights.
2. Avoid flat purple borders in exported PNGs.
3. Use Montserrat-like headings and Open Sans-like body copy.
4. Fit content inside 1:1, 4:5, and 9:16 by scaling headings, icons, lists, diagrams,
   footers, and body copy per ratio.
5. Favor white or slate-grey gradient carousel backgrounds unless the prompt explicitly asks
   for another background.
6. Avoid repeated `01/08` pagination and generic `Swipe ->` footers; vary cues or omit them
   when space is tight.

## Skill: `/trigger-deploy`

Use after changing any Trigger task or Trigger-imported renderer/helper.

1. Run `npx tsc --noEmit`.
2. Run targeted lint/build as appropriate.
3. Deploy with the pinned repo version unless packages have been upgraded:

```bash
npx trigger.dev@4.4.3 deploy
```

4. Record the deployed version in the final response.
5. If using `latest` fails due to version mismatch, do not force it. Use the pinned version.

## Skill: `/verification`

Minimum verification after code edits:

```bash
npx tsc --noEmit
```

Add targeted lint when TypeScript, React, or route files changed:

```bash
npx eslint <touched-files>
```

Add production build when touching Next routes, server/client boundaries, shared UI, or
generation flows:

```bash
npm run build
```

If the build needs Google Fonts network access, request approval and rerun. Do not report a
network font fetch failure as an app compile failure.
