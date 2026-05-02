# PAM Agent Protocol

This is the short version for any coding agent.

## Start Here

Read:

1. `CLAUDE.md`
2. `MEMORY.md`
3. `SKILLS.md`
4. Relevant feature docs, especially `CAROUSEL_STUDIO_EXECUTION.md` and
   `CONTENT_MANAGEMENT_OVERHAUL.md`

## Default Behavior

- Understand the execution path before editing.
- Preserve existing user work.
- Keep changes scoped to the request.
- Prefer existing repo patterns and shared types.
- Normalize data at boundaries instead of scattering defensive UI hacks.
- Verify with TypeScript after code edits.

## Studio Rules

- No mock packages, mock slides, or fake captions in live Studio.
- No social publishing, token storage, scheduler, or publish jobs in Studio.
- Generation belongs only in the prompt/chat panel. Do not add duplicate Generate or
  Generate Carousel buttons in headers or canvas controls.
- Canvas actions must stay consolidated near the canvas: Export before Save Draft, then
  approval/manual publishing actions as needed.
- Create starts a new blank unsaved session. Previous work opens from Drafts or Library.
- Untouched blank sessions must not be persisted. Dirty new sessions require a save/discard
  confirmation before navigation.
- Visible Studio actions need toast or confirmation feedback: save, export, copy, duplicate,
  regenerate, delete, approve, and model/API failures.
- Generation must honor explicit slide counts.
- Streaming partials must not crash UI.
- Slide/caption controls must persist real changes.
- Carousels must have visual variety across slide kinds and backgrounds.
- Captions need topic-specific hashtag pools: Instagram and Facebook at least 20,
  LinkedIn 8-10, TikTok at least 10.
- Rendered carousels should use PAM gradient accents, Montserrat headings, Open Sans body,
  and ratio-aware scaling for 1:1, 4:5, and 9:16. Avoid flat purple borders and repetitive
  pagination/Swipe treatments.

## Deployment Rules

- Vercel serverless changes deploy through the normal app deployment path.
- Trigger.dev task changes require Trigger deploy.
- Current safe Trigger deploy command:

```bash
npx trigger.dev@4.4.3 deploy
```
