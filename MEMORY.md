# PAM Agent Memory

This file records durable repo decisions and known traps. Claude and other agents should
read it before editing code.

## Durable Product Decisions

- Carousel Studio is isolated from the legacy production calendar pipeline.
- Studio creates a package from prompt, paste, CSV, or PDF, then produces carousel slides
  and four platform captions.
- Studio distribution is manual: export assets, copy captions, approve for manual publish.
- Carousel Studio generation has one entry point: the prompt/chat panel. Do not add separate
  "Generate" or "Generate Carousel" buttons in the header or canvas controls.
- Canvas actions should be consolidated in the canvas action bar. Export belongs before Save
  near the canvas controls; duplicate header actions create UX confusion and should not return.
- Clicking the Carousel Studio/Create entry should start a new blank working session, not
  automatically reopen the previous package. Existing packages belong in Drafts/Library.
- A blank new session must not become a saved draft unless the user adds prompt/content or
  explicitly chooses Save to Draft. If the user navigates away with an untouched blank session,
  discard it; if it has edits, ask whether to save as a draft.
- Studio actions need visible feedback: save/export/copy/regenerate/delete/approve failures
  and successes should go through toast/confirmation messaging, not silent background changes.
- Studio does not store social tokens, create publish jobs, schedule posts, or auto-post.
- The production pipeline remains separate under `app/api/production`, `lib/production`,
  and `trigger/production.ts`.

## Studio Source Of Truth

- Product direction: `CONTENT_MANAGEMENT_OVERHAUL.md`
- Technical execution: `CAROUSEL_STUDIO_EXECUTION.md`
- Prototype reference: `carousel_studio_prototype.html` when present locally
- UI surface: `components/admin/studio/ContentManagementPanel.tsx`
- Studio API routes: `app/api/studio/packages/*`
- Studio generation: `lib/studio/ai.ts`
- Studio schemas: `lib/studio/schemas.ts`
- Studio normalization and defaults: `lib/studio/types.ts`
- Studio export rendering: `lib/studio/render/carousel.ts`
- Studio Trigger task: `trigger/studio.ts`

## Recent Bugs That Must Not Regress

- `packageItem.carouselJson.slides.map` crashed when `carouselJson` streamed or loaded as
  `{}`. Always normalize package JSON before UI access.
- `slide.body.split` crashed when streaming slides had missing body. Body readers must
  tolerate `undefined`, partial strings, and arrays.
- `caption.hashtags.length` crashed when streaming captions had body but no hashtags.
  Caption readers must normalize to `{ body, hashtags, chars }`.
- A stale `isLast` reference crashed CTA preview generation. Derive CTA behavior from the
  computed slide variant or explicit slide position.
- Gemini Pro 503 high-demand errors must fall back to Flash where available.
- Slide count requests such as "8 slides" must be honored. Do not cap generation at 4 or 7
  when the prompt or source requests more.
- Regenerate, copy/duplicate, delete, edit, export, approve, and caption copy controls must
  be live actions with persisted effects.
- Inner carousel slides looked repetitive because the renderer collapsed middle slides into
  one white insight block. Preserve visual variation through `kind`, `bg`, stat, quote,
  checklist, dark insight, and CTA treatments.
- Captions must include useful hashtag pools by default: Instagram at least 20, Facebook at
  least 20, LinkedIn at least 8-10, TikTok at least 10, all related to the specific post.
- Carousel output must use PAM typography: Montserrat-style headings and Open Sans-style body.
- Carousel output should favor white or slate-grey gradient backgrounds unless a prompt asks
  otherwise. Purple/pink/red accents should use the PAM button gradient, not a flat purple.
- Slide content must fit inside 1:1, 4:5, and 9:16. Scale headings, icons, diagrams, footers,
  lists, and body copy per ratio. Avoid repeated "01/08" pagination and generic "Swipe ->"
  treatments; vary footer/navigation cues or omit them when space is tight.

## Trigger.dev Memory

- `trigger/production.ts` and files it imports run in Trigger.dev cloud.
- `trigger/studio.ts` and `lib/studio/exportPackage.ts` run in Trigger.dev cloud for Studio
  exports.
- Local edits to Trigger-imported code do not affect cloud tasks until deployed.
- `npx trigger.dev@latest deploy` can fail because latest CLI may not match local packages.
  Current safe deploy command is:

```bash
npx trigger.dev@4.4.3 deploy
```

Update all `@trigger.dev/*` packages together before changing that command.

## Quality Bar

- Prefer structured parsing and normalization over optional-chain patches scattered across
  the UI.
- Do not hide runtime errors by swallowing data shape problems. Normalize once, then render.
- Preserve user changes in a dirty worktree. Never reset or revert unrelated work.
- For frontend work, verify the actual component and browser error before editing.
- For generation and rendering work, identify whether the code executes on Vercel,
  Trigger.dev cloud, or both.
