# Design System & Layout Blueprint — V2

### Psychiatric/Medical Educational Content Platform

**Technical Specification for CSS, Remotion Components & Puppeteer Rendering**

> **V2 CRITICAL MANDATE:** Purple is NEVER a background. Backgrounds are white or slate gray only. No navy. No dark blue. No glass-morphism. No backdrop-filter. No gradients. Typography is Montserrat + Open Sans exclusively. Every value below is a concrete number ready to paste into code.

---

## 1. DESIGN SYSTEM FOUNDATIONS

### 1.1 Color Palette


| Token                | Hex       | Usage                                                   |
| -------------------- | --------- | ------------------------------------------------------- |
| `bg-white`           | `#FFFFFF` | Primary background — most slides, cards                 |
| `bg-offwhite`        | `#F7F8FA` | Secondary background — header bars, email body          |
| `bg-light-gray`      | `#EDF0F4` | Tertiary — subtle section stripes, card backgrounds     |
| `bg-slate`           | `#4A5568` | Contrast slides ONLY: CTA, hook screens, closing frames |
| `light-slate-border` | `#E2E8F0` | Divider lines, card borders, inactive dots              |
| `purple-border`      | `#7C3AED` | ALL borders, accent bars, accent lines, active dots     |
| `purple-hover`       | `#6D28D9` | Interactive states (CTA button hover)                   |
| `purple-icon-bg`     | `#EDE9FE` | Icon area fill ONLY — never use as section or page bg   |
| `text-primary`       | `#1A202C` | All body text on white/light backgrounds                |
| `text-secondary`     | `#4A5568` | Subheadings, descriptions on white backgrounds          |
| `text-on-slate`      | `#FFFFFF` | All text on slate (`#4A5568`) backgrounds               |
| `text-muted`         | `#A0AEC0` | Slide numbers, metadata, captions                       |
| `divider`            | `#E2E8F0` | 1px rule lines between sections                         |
| `success`            | `#10B981` | Positive indicator accents                              |
| `warning`            | `#F59E0B` | Alert/warning indicator accents                         |


**⛔ NEVER USE as backgrounds:** `#7C3AED`, `#6D28D9`, `#EDE9FE` (icon bg only), any navy, any dark blue.

---

### 1.2 Typography

**Font Stack:**

```css
--font-heading: 'Montserrat', sans-serif;
--font-body:    'Open Sans', sans-serif;
```

**Google Fonts Import:**

```html
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
```

**Type Scale by Format:**

#### 1:1 (1080 × 1080px)


| Role               | Family     | Weight | Size | Line Height | Color     |
| ------------------ | ---------- | ------ | ---- | ----------- | --------- |
| Cover Heading      | Montserrat | 700    | 44px | 1.15        | `#1A202C` |
| Cover Subheading   | Open Sans  | 400    | 18px | 1.6         | `#4A5568` |
| Section Label      | Open Sans  | 600    | 12px | 1.0         | `#7C3AED` |
| Body Slide Heading | Montserrat | 700    | 26px | 1.15        | `#1A202C` |
| Body Text          | Open Sans  | 400    | 16px | 1.6         | `#1A202C` |
| Number Accent      | Montserrat | 700    | 36px | 1.0         | `#7C3AED` |
| Slide Number       | Open Sans  | 400    | 12px | 1.0         | `#A0AEC0` |
| Swipe CTA          | Open Sans  | 600    | 14px | 1.0         | `#7C3AED` |


#### 4:5 (1080 × 1350px)


| Role               | Family     | Weight | Size | Line Height | Color     |
| ------------------ | ---------- | ------ | ---- | ----------- | --------- |
| Cover Heading      | Montserrat | 700    | 48px | 1.15        | `#1A202C` |
| Cover Subheading   | Open Sans  | 400    | 20px | 1.6         | `#4A5568` |
| Section Label      | Open Sans  | 600    | 12px | 1.0         | `#7C3AED` |
| Body Slide Heading | Montserrat | 700    | 28px | 1.15        | `#1A202C` |
| Body Text          | Open Sans  | 400    | 17px | 1.6         | `#1A202C` |
| Number Accent      | Montserrat | 700    | 40px | 1.0         | `#7C3AED` |
| Slide Number       | Open Sans  | 400    | 12px | 1.0         | `#A0AEC0` |


#### 9:16 (1080 × 1920px)


| Role              | Family     | Weight | Size | Line Height | Color     |
| ----------------- | ---------- | ------ | ---- | ----------- | --------- |
| Hook Heading      | Montserrat | 800    | 60px | 1.15        | `#FFFFFF` |
| Body Card Heading | Montserrat | 600    | 20px | 1.15        | `#1A202C` |
| Body Card Text    | Open Sans  | 400    | 16px | 1.6         | `#4A5568` |
| Logo Label        | Open Sans  | 600    | 12px | 1.0         | `#FFFFFF` |


#### 16:9 (1920 × 1080px)


| Role            | Family     | Weight | Size | Line Height | Color     |
| --------------- | ---------- | ------ | ---- | ----------- | --------- |
| Header Title    | Montserrat | 600    | 18px | 1.15        | `#1A202C` |
| Section Heading | Montserrat | 700    | 28px | 1.15        | `#1A202C` |
| Stat Number     | Montserrat | 800    | 72px | 1.0         | `#7C3AED` |
| Body Text       | Open Sans  | 400    | 16px | 1.6         | `#1A202C` |
| Callout Text    | Open Sans  | 600    | 15px | 1.6         | `#1A202C` |
| Section Counter | Open Sans  | 400    | 14px | 1.0         | `#A0AEC0` |


**ESL Readability Rules:**

- Max 8 words per line
- Short phrase blocks — avoid paragraphs longer than 3 lines
- Use chunked bullet lists, not dense paragraphs
- ALL CAPS labels: Open Sans 600, letter-spacing `0.08em`, 12px

---

### 1.3 Spacing System (8px Grid)

All values are multiples of 8px. Use pixel values directly — no `rem`, no `em`, no CSS variables.


| Token                 | Value | Usage                                        |
| --------------------- | ----- | -------------------------------------------- |
| `space-1`             | 8px   | Minimum gap, icon-to-text spacing            |
| `space-2`             | 16px  | Card-to-card gaps in vertical lists          |
| `space-3`             | 24px  | Section gaps inside a slide                  |
| `space-4`             | 32px  | Section gaps, bottom indicator clearance     |
| `space-5`             | 40px  | Outer frame padding (carousel)               |
| `space-6`             | 48px  | Outer frame padding (landscape), logo margin |
| `space-7`             | 56px  | Landscape slide padding top/bottom           |
| `space-inner-card`    | 20px  | Card internal padding (light content)        |
| `space-inner-card-lg` | 24px  | Card internal padding (heavy content)        |


**Border Specs:**

- Purple frame border: `3px solid #7C3AED`
- Purple accent bar (left): `3px solid #7C3AED` (height 100% of parent)
- Purple accent line (horizontal): `2px solid #7C3AED`, width 40% of container (cover) or 30% (video)
- Card border: `1px solid #E2E8F0`
- Header bottom rule: `1px solid #E2E8F0`
- Divider rule: `1px solid #E2E8F0`

**Border Radius:**

- Outer frame: `0px` — sharp corners only. The purple border IS the frame.
- Inner cards: `8px`
- CTA button: `8px`
- Icon areas: `8px` (square-ish) or `50%` (if circular dot)
- Images: `8px`

---

### 1.4 Depth System (Remotion/Puppeteer-Safe Only)

```css
/* The ONE permitted shadow — use only on elevated white cards */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
```

**Depth is achieved through layering, not effects:**

- White card on `#EDF0F4` background → perceived elevation
- White card on `#4A5568` slate → strong contrast pop
- Purple `3px` border on white → visual anchoring without shadows

**⛔ FORBIDDEN depth techniques:**

- `backdrop-filter` (any value)
- `filter: blur()`
- Multi-layer box-shadows
- Gradient overlays
- CSS animations or transitions
- Any `-webkit-` prefixed properties
- `var()` CSS variables — use literal hex values in all Remotion/Puppeteer code

---

## 2. CAROUSEL POSTS

### 2.1 Format Specifications


| Format       | Canvas Size   | Outer Padding | Frame Border  | Font Scale             |
| ------------ | ------------- | ------------- | ------------- | ---------------------- |
| 1:1 Square   | 1080 × 1080px | 40px          | 3px `#7C3AED` | Base (see §1.2)        |
| 4:5 Portrait | 1080 × 1350px | 40px          | 3px `#7C3AED` | +10% on cover headings |


### 2.2 The Purple Frame System

The signature structural element. A picture frame — not a decorative accent.

```jsx
// Frame wrapper — use on ALL carousel slides
const SlideFrame = ({ children, background = '#FFFFFF', width, height }) => (
  <div style={{
    width: width,
    height: height,
    border: '3px solid #7C3AED',
    boxSizing: 'border-box',
    backgroundColor: background,
  }}>
    <div style={{
      width: '100%',
      height: '100%',
      padding: 40,
      boxSizing: 'border-box',
      position: 'relative',
    }}>
      {children}
    </div>
  </div>
);
```

> The 3px border is always outermost. The 40px padding sits inside it. Content never bleeds into the border zone.

---

### 2.3 Cover Slide (Slide 1)

**Background:** `#FFFFFF`

**Layout (1:1 — all pixel values):**

```
┌─────────────────────────────────────────┐ ← 3px #7C3AED border
│  [LOGO 48px]   top: 40px, left: 40px   │
│                                         │
│         [HEADING — centered]            │ ← vertically centered in top 60%
│     Montserrat 700, 44px, #1A202C       │
│                                         │
│    ──────────────── (2px purple line)   │ ← 40% width, centered, 12px below heading
│                                         │
│   [SUBHEADING — centered]               │ ← 12px below line
│   Open Sans 400, 18px, #4A5568         │
│                                         │
│                        Swipe →          │ ← right: 40px, bottom: 40px
│                  Open Sans 600, 14px    │
│                  color: #7C3AED         │
└─────────────────────────────────────────┘
```

**Remotion/Puppeteer Implementation:**

```jsx
const CoverSlide = ({ heading, subheading, logoSrc, slideIndex, totalSlides, width, height }) => {
  const frame = useCurrentFrame();
  const headingOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  const headingY = interpolate(frame, [0, 12], [20, 0], { extrapolateRight: 'clamp' });
  const subOpacity = interpolate(frame, [8, 20], [0, 1], { extrapolateRight: 'clamp' });
  const subY = interpolate(frame, [8, 20], [20, 0], { extrapolateRight: 'clamp' });

  return (
    <div style={{ width, height, border: '3px solid #7C3AED', boxSizing: 'border-box', backgroundColor: '#FFFFFF', position: 'relative' }}>
      {/* Logo */}
      <img src={logoSrc} style={{ position: 'absolute', top: 40, left: 40, width: 48, height: 48, objectFit: 'contain' }} />

      {/* Slide Number */}
      <span style={{ position: 'absolute', top: 40, right: 40, fontFamily: "'Open Sans', sans-serif", fontSize: 12, fontWeight: 400, color: '#A0AEC0' }}>
        {String(slideIndex).padStart(2, '0')}
      </span>

      {/* Center Content Block */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 48px' }}>
        <div style={{ opacity: headingOpacity, transform: `translateY(${headingY}px)`, textAlign: 'center', fontFamily: "'Montserrat', sans-serif", fontSize: 44, fontWeight: 700, color: '#1A202C', lineHeight: 1.15 }}>
          {heading}
        </div>
        {/* Purple accent line */}
        <div style={{ marginTop: 16, width: '40%', height: 2, backgroundColor: '#7C3AED' }} />
        <div style={{ opacity: subOpacity, transform: `translateY(${subY}px)`, marginTop: 12, textAlign: 'center', fontFamily: "'Open Sans', sans-serif", fontSize: 18, fontWeight: 400, color: '#4A5568', lineHeight: 1.6 }}>
          {subheading}
        </div>
      </div>

      {/* Swipe CTA */}
      <span style={{ position: 'absolute', bottom: 40, right: 40, fontFamily: "'Open Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#7C3AED' }}>
        Swipe →
      </span>

      {/* Page Dots */}
      <PageDots current={slideIndex} total={totalSlides} bottom={40} />
    </div>
  );
};
```

---

### 2.4 Body/Content Slides (Slides 2–8)

**Background:** `#FFFFFF`

**Top Section (top 64px inside padding):**

- Thin purple top accent bar: `3px solid #7C3AED` at very top of inner area, full width
- Section label: Open Sans 600, 12px, ALL CAPS, letter-spacing `0.08em`, color `#7C3AED`, left-aligned, 10px below top bar

**Layout A — Bullet List:**

```jsx
const BulletItem = ({ text }) => (
  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
    {/* Purple dot */}
    <div style={{ marginTop: 7, width: 6, height: 6, borderRadius: '50%', backgroundColor: '#7C3AED', flexShrink: 0 }} />
    <span style={{ fontFamily: "'Open Sans', sans-serif", fontSize: 16, fontWeight: 400, color: '#1A202C', lineHeight: 1.6 }}>
      {text}
    </span>
  </div>
);
// Max 4 bullets per slide. No sub-bullets.
```

**Layout B — Number + Text:**

```jsx
const NumberBlock = ({ number, heading, body }) => (
  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 24, marginBottom: 24 }}>
    <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 36, fontWeight: 700, color: '#7C3AED', lineHeight: 1.0, minWidth: 56 }}>
      {String(number).padStart(2, '0')}
    </span>
    <div>
      <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 600, color: '#1A202C', lineHeight: 1.15, marginBottom: 6 }}>
        {heading}
      </div>
      <div style={{ fontFamily: "'Open Sans', sans-serif", fontSize: 16, fontWeight: 400, color: '#4A5568', lineHeight: 1.6 }}>
        {body}
      </div>
    </div>
  </div>
);
```

**Layout C — Image + Text:**

```jsx
// Image occupies top 50% of content area, text fills bottom 50%
const ImageTextSlide = ({ imageSrc, heading, bodyText }) => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <img src={imageSrc} style={{ flex: 1, width: '100%', objectFit: 'cover', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
    <div style={{ flex: 1, paddingTop: 16 }}>
      <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 22, fontWeight: 700, color: '#1A202C', lineHeight: 1.15, marginBottom: 8 }}>
        {heading}
      </div>
      <div style={{ fontFamily: "'Open Sans', sans-serif", fontSize: 16, fontWeight: 400, color: '#4A5568', lineHeight: 1.6 }}>
        {bodyText}
      </div>
    </div>
  </div>
);
```

**Persistent Elements (all body slides):**

- Slide number: position `absolute`, top: `40px`, right: `40px`, Open Sans 400, 12px, `#A0AEC0`
- Page dots: centered, `32px` from bottom

---

### 2.5 CTA / Closing Slide

**Background:** `#4A5568` — the ONLY slide with non-white background in carousel.

```jsx
const CTASlide = ({ logoSrc, heading, subtext, width, height }) => (
  <div style={{ width, height, border: '3px solid #7C3AED', boxSizing: 'border-box', backgroundColor: '#4A5568', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 24, padding: 48 }}>
    <img src={logoSrc} style={{ width: 64, height: 64, objectFit: 'contain' }} />
    <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 36, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.15, textAlign: 'center' }}>
      {heading}
    </div>
    <div style={{ fontFamily: "'Open Sans', sans-serif", fontSize: 18, fontWeight: 400, color: '#FFFFFF', lineHeight: 1.6, textAlign: 'center', opacity: 0.85 }}>
      {subtext}
    </div>
  </div>
);
```

---

### 2.6 Page Dots Component

```jsx
const PageDots = ({ current, total, bottom = 40 }) => (
  <div style={{ position: 'absolute', bottom, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
    {Array.from({ length: total }, (_, i) => (
      <div key={i} style={{ width: i === current ? 16 : 8, height: 8, borderRadius: 4, backgroundColor: i === current ? '#7C3AED' : '#E2E8F0', transition: 'none' }} />
    ))}
  </div>
);
// Active dot: 16px wide, #7C3AED. Inactive: 8px, #E2E8F0.
```

---

### 2.7 Swipe Transition Logic

These are layout rules, not CSS transitions:

1. **Anchor elements** (purple border, logo position, page dots) maintain identical pixel positions across all slides
2. **Content offset:** Each slide's primary content block starts `8–16px` further right than slide 1 (`marginLeft: 8` to `marginLeft: 16` stepping through the carousel)
3. **Continuation cue:** Last decorative element on each slide (accent line, arrow glyph, or icon) is intentionally clipped by the right edge — implement with `overflow: 'hidden'` on the frame and position the element at `right: -12px`

---

## 3. VERTICAL VIDEO / REELS (9:16 — 1080 × 1920px)

### 3.1 Frame Structure

Unlike carousel (4-side border), vertical video uses **left and right borders only:**

```jsx
const VerticalFrame = ({ children, background = '#FFFFFF' }) => (
  <div style={{
    width: 1080,
    height: 1920,
    backgroundColor: background,
    borderLeft: '3px solid #7C3AED',
    borderRight: '3px solid #7C3AED',
    boxSizing: 'border-box',
    position: 'relative',
  }}>
    {children}
  </div>
);
```

**Safe Zones:**

- Top `15%` = `288px` → platform UI (do not place critical content here)
- Bottom `20%` = `384px` → caption zone (keep clear for subtitles)
- Active content zone: `y: 288px` to `y: 1536px` (height: `1248px`)

---

### 3.2 Hook Screen (Frames 0–72 at 24fps = 3 seconds)

**Background:** `#4A5568`

```jsx
const HookScreen = ({ heading, logoSrc }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  const translateY = interpolate(frame, [0, 12], [20, 0], { extrapolateRight: 'clamp' });

  return (
    <div style={{ width: 1080, height: 1920, backgroundColor: '#4A5568', borderLeft: '3px solid #7C3AED', borderRight: '3px solid #7C3AED', boxSizing: 'border-box', position: 'relative' }}>
      {/* Logo — top left, small, white tint */}
      <img src={logoSrc} style={{ position: 'absolute', top: 48, left: 48, width: 32, height: 32, objectFit: 'contain', opacity: 0.8 }} />

      {/* Hook Heading — center of frame */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 80px' }}>
        <div style={{ opacity, transform: `translateY(${translateY}px)`, fontFamily: "'Montserrat', sans-serif", fontSize: 60, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.15, textAlign: 'center' }}>
          {heading}
        </div>
        {/* Purple accent line */}
        <div style={{ marginTop: 24, width: '30%', height: 2, backgroundColor: '#7C3AED', opacity }} />
      </div>
    </div>
  );
};
// heading: max 4 words
```

---

### 3.3 Educational Body Screens

**Background:** `#FFFFFF`

Each "card" is a self-contained content block stacked vertically.

```jsx
// Single content card
const ContentCard = ({ iconChar, heading, body, delayFrames }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delayFrames, delayFrames + 12], [0, 1], { extrapolateRight: 'clamp' });
  const translateY = interpolate(frame, [delayFrames, delayFrames + 12], [16, 0], { extrapolateRight: 'clamp' });

  return (
    <div style={{ opacity, transform: `translateY(${translateY}px)`, display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 16, padding: 20, backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, marginBottom: 16 }}>
      {/* Icon Area */}
      <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#EDE9FE', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 18, color: '#7C3AED' }}>{iconChar}</span>
      </div>
      {/* Text */}
      <div>
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 600, color: '#1A202C', lineHeight: 1.15, marginBottom: 6 }}>
          {heading}
        </div>
        <div style={{ fontFamily: "'Open Sans', sans-serif", fontSize: 16, fontWeight: 400, color: '#4A5568', lineHeight: 1.6 }}>
          {body}
        </div>
      </div>
    </div>
  );
};

// Stagger timing: card 1 = delay 0, card 2 = delay 8, card 3 = delay 16
// Usage: <ContentCard delayFrames={0} />, <ContentCard delayFrames={8} />, etc.
```

**Body screen container:**

```jsx
const BodyScreen = ({ cards, logoSrc }) => (
  <div style={{ width: 1080, height: 1920, backgroundColor: '#FFFFFF', borderLeft: '3px solid #7C3AED', borderRight: '3px solid #7C3AED', boxSizing: 'border-box', padding: '288px 56px 384px 56px', position: 'relative' }}>
    {/* Persistent logo */}
    <img src={logoSrc} style={{ position: 'absolute', top: 48, left: 56, width: 32, height: 32, objectFit: 'contain' }} />
    {/* Cards */}
    {cards.map((card, i) => (
      <ContentCard key={i} {...card} delayFrames={i * 8} />
    ))}
  </div>
);
```

---

### 3.4 Closing Frame (Vertical Video)

**Background:** `#4A5568`

```jsx
const ClosingFrame = ({ logoSrc, ctaText }) => (
  <div style={{ width: 1080, height: 1920, backgroundColor: '#4A5568', borderLeft: '3px solid #7C3AED', borderRight: '3px solid #7C3AED', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 32, padding: '0 80px' }}>
    <img src={logoSrc} style={{ width: 64, height: 64, objectFit: 'contain' }} />
    <div style={{ fontFamily: "'Open Sans', sans-serif", fontSize: 24, fontWeight: 600, color: '#FFFFFF', textAlign: 'center', lineHeight: 1.5 }}>
      {ctaText}
    </div>
  </div>
);
```

---

## 4. LANDSCAPE CONTENT (16:9 — 1920 × 1080px)

### 4.1 Clinical Whiteboard Philosophy

No grid patterns, no SVG textures. The clinical feel comes entirely from:

- Rigid grid alignment (8px system)
- Precise typographic hierarchy
- White-on-light-gray card layering
- Purple left accent bars next to every major heading
- 1px `#E2E8F0` dividers between zones

---

### 4.2 Header Bar

**Height:** 80px | **Background:** `#F7F8FA` | **Bottom edge:** `1px solid #E2E8F0`

```jsx
const HeaderBar = ({ logoSrc, title, sectionIndicator }) => (
  <div style={{ width: 1920, height: 80, backgroundColor: '#F7F8FA', borderBottom: '1px solid #E2E8F0', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0 56px', boxSizing: 'border-box' }}>
    <img src={logoSrc} style={{ width: 36, height: 36, objectFit: 'contain' }} />
    <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 18, fontWeight: 600, color: '#1A202C' }}>
      {title}
    </span>
    <span style={{ fontFamily: "'Open Sans', sans-serif", fontSize: 14, fontWeight: 400, color: '#A0AEC0' }}>
      {sectionIndicator}
    </span>
  </div>
);
// sectionIndicator format: "01 / 06"
```

---

### 4.3 Content Zone Layouts

All content zones sit below the 80px header, in the remaining 1000px of height.

**Layout A — Diagram / Explainer:**

```
┌──────────────────────────────────────────────────┐
│ ▌ SECTION TITLE (left third, 640px)              │  ← 3px purple left bar
│   Montserrat 700, 28px, #1A202C                   │
│                                                  │
│   [BODY TEXT]                                    │
│   Open Sans 400, 16px, #4A5568                   │
├──────────┬───────────────────────────────────────┤
│  CENTER: │  RIGHT: Supporting callouts           │
│  Main    │  Open Sans 600, 15px, #1A202C         │
│  Diagram │  + 3px purple left bar per callout    │
│  Image   │                                       │
└──────────┴───────────────────────────────────────┘
```

```jsx
const DiagramLayout = ({ sectionTitle, bodyText, diagramSrc, callouts }) => (
  <div style={{ width: 1920, height: 1000, backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'row', padding: '40px 56px', gap: 40, boxSizing: 'border-box' }}>
    {/* Left third — section title */}
    <div style={{ width: 560, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingLeft: 16, borderLeft: '3px solid #7C3AED' }}>
      <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 28, fontWeight: 700, color: '#1A202C', lineHeight: 1.15, marginBottom: 16 }}>
        {sectionTitle}
      </div>
      <div style={{ fontFamily: "'Open Sans', sans-serif", fontSize: 16, fontWeight: 400, color: '#4A5568', lineHeight: 1.6 }}>
        {bodyText}
      </div>
    </div>
    {/* Center — diagram */}
    <div style={{ flex: 1 }}>
      <img src={diagramSrc} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />
    </div>
    {/* Right — callouts */}
    <div style={{ width: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {callouts.map((text, i) => (
        <div key={i} style={{ borderLeft: '3px solid #7C3AED', paddingLeft: 12, fontFamily: "'Open Sans', sans-serif", fontSize: 15, fontWeight: 600, color: '#1A202C', lineHeight: 1.6 }}>
          {text}
        </div>
      ))}
    </div>
  </div>
);
```

**Layout B — Two-Column:**

```jsx
const TwoColumnLayout = ({ leftContent, rightContent }) => (
  <div style={{ width: 1920, height: 1000, backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'row', padding: '48px 56px', boxSizing: 'border-box' }}>
    <div style={{ flex: 1, paddingRight: 40, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {leftContent}
    </div>
    {/* Vertical divider */}
    <div style={{ width: 1, backgroundColor: '#E2E8F0', margin: '0 0' }} />
    <div style={{ flex: 1, paddingLeft: 40, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {rightContent}
    </div>
  </div>
);

// Stat number usage within columns:
const StatBlock = ({ number, label }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 72, fontWeight: 800, color: '#7C3AED', lineHeight: 1.0 }}>
      {number}
    </div>
    <div style={{ fontFamily: "'Open Sans', sans-serif", fontSize: 18, fontWeight: 400, color: '#4A5568', lineHeight: 1.6, marginTop: 8 }}>
      {label}
    </div>
  </div>
);
```

**Layout C — Image Focus:**

```jsx
const ImageFocusLayout = ({ imageSrc, heading, description }) => (
  <div style={{ width: 1920, height: 1000, backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '48px 56px', gap: 56, boxSizing: 'border-box' }}>
    {/* Left column text */}
    <div style={{ width: 560, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 32, fontWeight: 700, color: '#1A202C', lineHeight: 1.15, marginBottom: 16 }}>
        {heading}
      </div>
      <div style={{ fontFamily: "'Open Sans', sans-serif", fontSize: 16, fontWeight: 400, color: '#4A5568', lineHeight: 1.6 }}>
        {description}
      </div>
    </div>
    {/* Right image — 65% width */}
    <div style={{ flex: 1 }}>
      <img src={imageSrc} style={{ width: '100%', height: 880, objectFit: 'cover', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
    </div>
  </div>
);
```

---

### 4.4 Callout Box (Landscape)

Boxed callout: light purple icon background with purple left border. For important definitions, warnings, key terms.

```jsx
const CalloutBox = ({ text }) => (
  <div style={{ backgroundColor: '#EDE9FE', borderLeft: '3px solid #7C3AED', borderRadius: '0 8px 8px 0', padding: '16px 20px', fontFamily: "'Open Sans', sans-serif", fontSize: 15, fontWeight: 600, color: '#1A202C', lineHeight: 1.6 }}>
    {text}
  </div>
);
// Use for key terms, definitions, clinical warnings. Not for general body text.
```

---

## 5. STATIC SOCIAL & EMAIL ASSETS

### 5.1 Email Header (600 × 200px)

```jsx
// Puppeteer static render
const EmailHeader = ({ logoSrc, headline }) => (
  <div style={{ width: 600, height: 200, backgroundColor: '#FFFFFF', border: '3px solid #7C3AED', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16, padding: '0 32px' }}>
    <img src={logoSrc} style={{ width: 40, height: 40, objectFit: 'contain' }} />
    <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 22, fontWeight: 700, color: '#1A202C', textAlign: 'center', lineHeight: 1.15 }}>
      {headline}
    </div>
    <div style={{ width: '40%', height: 1, backgroundColor: '#7C3AED' }} />
  </div>
);
```

---

### 5.2 Email Body Cards

```jsx
const EmailBodyCard = ({ iconChar, heading, body, ctaLabel }) => (
  <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 24, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
    {/* Icon */}
    <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#EDE9FE', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <span style={{ fontSize: 16, color: '#7C3AED' }}>{iconChar}</span>
    </div>
    <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 18, fontWeight: 600, color: '#1A202C', lineHeight: 1.15 }}>
      {heading}
    </div>
    <div style={{ fontFamily: "'Open Sans', sans-serif", fontSize: 15, fontWeight: 400, color: '#4A5568', lineHeight: 1.6 }}>
      {body}
    </div>
    {ctaLabel && (
      <div style={{ alignSelf: 'center', marginTop: 4, backgroundColor: '#7C3AED', color: '#FFFFFF', fontFamily: "'Open Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '0 24px', height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {ctaLabel}
      </div>
    )}
  </div>
);
```

**Email body wrapper:**

```jsx
const EmailBody = ({ children }) => (
  <div style={{ width: 600, backgroundColor: '#F7F8FA', padding: '16px 16px', boxSizing: 'border-box' }}>
    {children}
  </div>
);
```

---

### 5.3 Static Social Posts (1:1 and 4:5)

Maximum simplicity. The purple frame IS the design.

```jsx
const StaticSocialPost = ({ logoSrc, heading, subheading, width, height }) => (
  <div style={{ width, height, border: '3px solid #7C3AED', boxSizing: 'border-box', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 20, padding: '0 64px' }}>
    <img src={logoSrc} style={{ width: 48, height: 48, objectFit: 'contain' }} />
    <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 40, fontWeight: 800, color: '#1A202C', textAlign: 'center', lineHeight: 1.15 }}>
      {heading}
    </div>
    <div style={{ fontFamily: "'Open Sans', sans-serif", fontSize: 18, fontWeight: 400, color: '#4A5568', textAlign: 'center', lineHeight: 1.6 }}>
      {subheading}
    </div>
  </div>
);
// 1:1: width=1080, height=1080. 4:5: width=1080, height=1350.
```

---

## 6. REMOTION / PUPPETEER COMPONENT PATTERNS

### 6.1 Remotion-Safe CSS Reference

**✅ SAFE — Use freely:**

```js
backgroundColor: '#FFFFFF'          // solid hex only
border: '3px solid #7C3AED'         // solid only
borderLeft: '3px solid #7C3AED'
borderRadius: 0 | 4 | 8             // simple values only
boxShadow: '0 2px 8px rgba(0,0,0,0.08)'  // single shadow only
color: '#1A202C'
fontSize: 16
fontWeight: 700
fontFamily: "'Montserrat', sans-serif"
padding: 40
margin: 0
opacity: 0.85                        // for fade animations via interpolate()
transform: `translateY(${y}px)`      // for slide animations via interpolate()
display: 'flex'
flexDirection: 'row' | 'column'
justifyContent: 'center' | 'flex-start' | 'flex-end' | 'space-between'
alignItems: 'center' | 'flex-start' | 'flex-end'
position: 'absolute' | 'relative'
top, left, right, bottom: 40         // px values only
width, height: 1080                  // px values only
lineHeight: 1.15                     // unitless ratio
letterSpacing: '0.08em'
textTransform: 'uppercase'
objectFit: 'contain' | 'cover'
overflow: 'hidden'
gap: 16
boxSizing: 'border-box'
```

**⛔ FORBIDDEN — Will break Puppeteer/Remotion:**

```js
backdropFilter: ...            // glass-morphism — DO NOT USE
WebkitBackdropFilter: ...      // DO NOT USE
filter: 'blur(...)'            // DO NOT USE
background: 'linear-gradient(...)' // DO NOT USE
transition: '...'              // CSS transitions — DO NOT USE
animation: '...'               // CSS keyframe animations — DO NOT USE
var(--token-name)              // CSS variables — use literal hex values
clipPath: '...'                // complex shapes — DO NOT USE
WebkitAny: ...                 // any -webkit- prefix — DO NOT USE
Math.random()                  // non-deterministic — DO NOT USE
Date.now()                     // non-deterministic — DO NOT USE
```

---

### 6.2 Animation Primitives (The Only Two You Need)

```jsx
const FPS = 24;

// Pattern 1: Fade In
const fadeIn = (frame, startFrame = 0, durationFrames = 12) =>
  interpolate(frame, [startFrame, startFrame + durationFrames], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

// Pattern 2: Slide Up + Fade In (combined)
const slideUp = (frame, startFrame = 0, durationFrames = 12, distance = 20) =>
  interpolate(frame, [startFrame, startFrame + durationFrames], [distance, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

// Usage inside component:
const frame = useCurrentFrame();
const opacity = fadeIn(frame, 0, 12);
const y = slideUp(frame, 0, 12, 20);
// Apply: style={{ opacity, transform: `translateY(${y}px)` }}
```

**Stagger timing table (at 24fps):**


| Element   | Start Frame | End Frame | Duration         |
| --------- | ----------- | --------- | ---------------- |
| Element 1 | 0           | 12        | 12 frames (0.5s) |
| Element 2 | 8           | 20        | 12 frames        |
| Element 3 | 16          | 28        | 12 frames        |
| Element 4 | 24          | 36        | 12 frames        |


---

### 6.3 Full Carousel Remotion Example

```jsx
const FPS = 24;

// Pre-computed slide data — computed OUTSIDE component
const SLIDES = [
  { type: 'cover', heading: 'Understanding Anxiety Disorders', subheading: 'A clinical overview for practitioners' },
  { type: 'body', layout: 'bullet', label: 'OVERVIEW', items: ['Generalised Anxiety Disorder', 'Panic Disorder', 'Social Anxiety Disorder'] },
  { type: 'body', layout: 'number', label: 'PREVALENCE', entries: [{ n: '01', heading: 'Lifetime prevalence', body: 'Affects 1 in 3 adults globally' }] },
  { type: 'cta', heading: 'Follow for more clinical content', subtext: '@yourhandle' },
];

const SLIDE_DURATION = 72; // 3 seconds per slide at 24fps
const TRANSITION_DURATION = 12; // 0.5 second overlap
// Total: (SLIDES.length × 72) - ((SLIDES.length - 1) × 12)
// For 4 slides: (4 × 72) - (3 × 12) = 288 - 36 = 252

const CarouselComp = ({ assets }) => (
  <AbsoluteFill>
    <TransitionSeries>
      {SLIDES.map((slide, i) => (
        <React.Fragment key={i}>
          <TransitionSeries.Sequence durationInFrames={SLIDE_DURATION}>
            {slide.type === 'cover' && (
              <CoverSlide heading={slide.heading} subheading={slide.subheading} logoSrc={assets['logo']} slideIndex={i} totalSlides={SLIDES.length} width={1080} height={1080} />
            )}
            {slide.type === 'cta' && (
              <CTASlide heading={slide.heading} subtext={slide.subtext} logoSrc={assets['logo']} width={1080} height={1080} />
            )}
          </TransitionSeries.Sequence>
          {i < SLIDES.length - 1 && (
            <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION_DURATION })} />
          )}
        </React.Fragment>
      ))}
    </TransitionSeries>
  </AbsoluteFill>
);

export const RemotionRoot = () => (
  <Composition
    id="Carousel"
    component={CarouselComp}
    durationInFrames={252}
    fps={24}
    width={1080}
    height={1080}
    defaultProps={{ assets: {} }}
  />
);

registerRoot(RemotionRoot);
```

---

### 6.4 CSS Class Naming Convention

For Puppeteer static rendering, CSS class names for stylesheets:


| Class             | Purpose                       | Key Properties                                                                                                                   |
| ----------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `.frame-purple`   | Outer purple border container | `border: 3px solid #7C3AED; box-sizing: border-box`                                                                              |
| `.bg-white`       | Primary background            | `background-color: #FFFFFF`                                                                                                      |
| `.bg-offwhite`    | Secondary background          | `background-color: #F7F8FA`                                                                                                      |
| `.bg-light-gray`  | Tertiary background           | `background-color: #EDF0F4`                                                                                                      |
| `.bg-slate`       | CTA/hook background           | `background-color: #4A5568`                                                                                                      |
| `.text-heading`   | Montserrat headings           | `font-family: 'Montserrat'; font-weight: 700; color: #1A202C; line-height: 1.15`                                                 |
| `.text-body`      | Open Sans body                | `font-family: 'Open Sans'; font-weight: 400; color: #1A202C; line-height: 1.6`                                                   |
| `.text-caption`   | Muted metadata                | `font-family: 'Open Sans'; font-weight: 400; font-size: 12px; color: #A0AEC0`                                                    |
| `.text-label`     | ALL CAPS section labels       | `font-family: 'Open Sans'; font-weight: 600; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #7C3AED` |
| `.accent-line`    | Horizontal purple rule        | `height: 2px; background-color: #7C3AED`                                                                                         |
| `.accent-dot`     | Bullet point marker           | `width: 6px; height: 6px; border-radius: 50%; background-color: #7C3AED`                                                         |
| `.accent-bar`     | Vertical left border accent   | `border-left: 3px solid #7C3AED; padding-left: 12px`                                                                             |
| `.card-elevated`  | White card on gray bg         | `background-color: #FFFFFF; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08)`                                          |
| `.card-bordered`  | White card with border        | `background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px`                                                       |
| `.icon-area`      | Small icon container          | `background-color: #EDE9FE; border-radius: 8px; color: #7C3AED`                                                                  |
| `.dots-indicator` | Page dot row                  | `display: flex; gap: 8px; justify-content: center`                                                                               |
| `.zone-header`    | 80px header bar               | `height: 80px; background-color: #F7F8FA; border-bottom: 1px solid #E2E8F0`                                                      |
| `.zone-content`   | Main content area             | `background-color: #FFFFFF; padding: 48px 56px`                                                                                  |
| `.zone-sidebar`   | Sidebar / callout column      | `width: 400px; display: flex; flex-direction: column; gap: 16px`                                                                 |


---

### 6.5 Puppeteer Render Configuration

```js
const puppeteer = require('puppeteer');

const FORMATS = {
  carousel_1x1:  { width: 1080, height: 1080, deviceScaleFactor: 1 },
  carousel_4x5:  { width: 1080, height: 1350, deviceScaleFactor: 1 },
  vertical_9x16: { width: 1080, height: 1920, deviceScaleFactor: 1 },
  landscape_16x9:{ width: 1920, height: 1080, deviceScaleFactor: 1 },
  email_header:  { width: 600,  height: 200,  deviceScaleFactor: 2 }, // 2x for email clarity
};

async function renderSlide(htmlPath, format, outputPath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const { width, height, deviceScaleFactor = 1 } = FORMATS[format];

  await page.setViewport({ width, height, deviceScaleFactor });
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  // Wait for Montserrat + Open Sans to load
  await page.evaluateHandle('document.fonts.ready');
  await page.screenshot({ path: outputPath, clip: { x: 0, y: 0, width, height } });
  await browser.close();
}
```

> `waitUntil: 'networkidle0'` is critical for Google Fonts to load before screenshot. Always also await `document.fonts.ready` as a secondary guarantee.

---

## 7. COHESION RULES REFERENCE

These apply across ALL formats without exception:


| Rule                 | Spec                                                               |
| -------------------- | ------------------------------------------------------------------ |
| Purple border width  | `3px solid #7C3AED` — everywhere, always                           |
| Heading font         | `Montserrat` — no substitutions                                    |
| Body font            | `Open Sans` — no substitutions                                     |
| Spacing grid         | 8px multiples only                                                 |
| Outer padding        | 40–48px (carousel), 48–56px (landscape)                            |
| Purple as background | ❌ NEVER                                                            |
| Navy / dark blue     | ❌ NEVER — move away from these                                     |
| Allowed backgrounds  | `#FFFFFF`, `#F7F8FA`, `#EDF0F4` (light), `#4A5568` (contrast only) |
| Glass-morphism       | ❌ NEVER                                                            |
| `backdrop-filter`    | ❌ NEVER                                                            |
| CSS transitions      | ❌ NEVER in Remotion/Puppeteer                                      |
| Animation types      | `interpolate` opacity + `translateY` only                          |
| Shadow               | `0 2px 8px rgba(0,0,0,0.08)` — one shadow, always                  |
| Image border-radius  | `8px`                                                              |
| Outer frame radius   | `0px` — sharp frame corners                                        |
| ESL line limit       | 8 words max per line                                               |


---

*End of Design System V2 — all values are implementation-ready. No value in this document requires further interpretation.*