# 🎨 Design System & Layout Blueprint — V2

### Psychiatric & Medical Educational Content Platform
**Technical Specification for CSS, Remotion Components & Puppeteer Rendering**

> **🚨 V2 REVISION MANDATE:** 
> - **Typography:** Radically increased font sizes across the board to heavily pronounce information on mobile devices.
> - **Colors:** Navy Blue (`#0F172A`) is officially re-instated as the premium high-contrast background.
> - **Accents:** The signature CapCut-style vibrant purple gradient is the definitive structural framing element.
> - **Layouts:** Multiple variant layouts introduced for video and carousels so content is never repetitive.

---

## 1. DESIGN SYSTEM FOUNDATIONS

### 1.1 Color Palette

| Token | Hex / Value | Usage |
|-------|-------------|-------|
| `bg-white` | `#FFFFFF` | Primary background for all educational body slides & cards. |
| `bg-navy` | `#0F172A` | **[NEW]** High-impact contrast background (Hook screens, Covers, end Credits, CTAs). |
| `bg-offwhite` | `#F8FAFC` | Secondary soft background for alternating layers or email backgrounds. |
| `bg-slate` | `#334155` | Secondary dark tone (only used when Navy is too heavy). |
| `purple-gradient` | `linear-gradient(135deg, #A855F7 0%, #6D28D9 100%)` | **[NEW]** Primary styling wrapper. Used for ALL main container borders, thick accents, and CTA buttons. |
| `purple-solid` | `#7C3AED` | Fallback solid text color, icons, and small accent lines where gradients can't easily be applied. |
| `purple-light` | `#F3E8FF` | Elegant, soft purple background exclusively for Icon containers. |
| `text-primary` | `#0F172A` | All body text & headings on white/light backgrounds. |
| `text-secondary` | `#475569` | Subtitles, descriptions, tertiary information on light backgrounds. |
| `text-on-navy` | `#FFFFFF` | All text that sits on top of the Navy Blue background. |

---

### 1.2 Updated Typography Scales (Significantly Pronounced)

**Font Stack:**
```css
--font-heading: 'Montserrat', sans-serif;
--font-body:    'Open Sans', sans-serif;
```

#### 📱 1:1 Square (1080 × 1080px)
| Role | Family | Weight | Size | Line Height | Color |
|------|--------|--------|------|-------------|-------|
| Cover Heading | Montserrat | 800 | **64px** | 1.15 | `#FFFFFF` (on Navy) |
| Cover Subheading | Open Sans | 400 | **24px** | 1.5 | `#94A3B8` (on Navy) |
| Section Label | Open Sans | 700 | **18px** | 1.0 | `#7C3AED` |
| Body Heading | Montserrat | 800 | **48px** | 1.15 | `#0F172A` |
| Body Text | Open Sans | 400 | **24px** | 1.5 | `#475569` |
| Number Accent | Montserrat | 800 | **56px** | 1.0 | `purple-gradient` text |

#### 📱 4:5 Portrait (1080 × 1350px)
| Role | Family | Weight | Size | Line Height | Color |
|------|--------|--------|------|-------------|-------|
| Cover Heading | Montserrat | 800 | **72px** | 1.15 | `#FFFFFF` (on Navy) |
| Cover Subheading | Open Sans | 400 | **28px** | 1.5 | `#94A3B8` (on Navy) |
| Body Heading | Montserrat | 800 | **56px** | 1.15 | `#0F172A` |
| Body Text | Open Sans | 400 | **26px** | 1.5 | `#475569` |

#### 🎬 9:16 Vertical Video (1080 × 1920px)
| Role | Family | Weight | Size | Line Height | Color |
|------|--------|--------|------|-------------|-------|
| Hook Heading | Montserrat | 800 | **88px** | 1.10 | `#FFFFFF` (on Navy) |
| Scene Heading | Montserrat | 800 | **44px** | 1.15 | `#0F172A` |
| Scene Body Text | Open Sans | 400 | **26px** | 1.5 | `#475569` |
| Important Callout | Open Sans | 600 | **28px** | 1.4 | `#0F172A` |

#### 📺 16:9 Landscape Video (1920 × 1080px)
| Role | Family | Weight | Size | Line Height | Color |
|------|--------|--------|------|-------------|-------|
| Side Heading | Montserrat | 800 | **56px** | 1.15 | `#0F172A` |
| Large Stat Number | Montserrat | 800 | **120px** | 1.0 | `#7C3AED` |
| Body Text | Open Sans | 400 | **28px** | 1.5 | `#0F172A` |

---

## 2. THE PURPLE GRADIENT BORDER IMPLEMENTATION

Standard CSS `border-color` does not support linear gradients well, particularly with `border-radius`. 
**Mandatory Remotion/React Implementation:** Use the "Wrapper" technique to generate pristine purple gradient borders.

```jsx
// 🟢 USE THIS EXACT PATTERN FOR ALL BORDERS IN REMOTION
const GradientBorderFrame = ({ children, borderThickness = 6, background = '#FFFFFF', radius = 0 }) => (
  <div style={{
    width: '100%', 
    height: '100%',
    background: 'linear-gradient(135deg, #A855F7 0%, #6D28D9 100%)', // The actual outer border
    padding: borderThickness, 
    borderRadius: radius,
    boxSizing: 'border-box'
  }}>
    <div style={{
      width: '100%', 
      height: '100%',
      backgroundColor: background, // The inner canvas
      borderRadius: radius > 0 ? radius - borderThickness : 0,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {children}
    </div>
  </div>
);
```
*Usage:* Carousel Outer Frame (`borderThickness=6`, `radius=0`), Inner Elevated Cards (`borderThickness=2`, `radius=16`).

---

## 3. CAROUSEL FORMATS (1:1 & 4:5)

### 3.1 The Cover Slide (High Contrast Navy)

*The initial impression must pop dramatically.*
- **Background:** Inner canvas is `bg-navy` (`#0F172A`).
- **Outer Frame:** 6px `GradientBorderFrame`.
- **Layout:** Logo Top-Left. Giant Heading vertically centered.

### 3.2 Educational Body Layouts (White Background)

Mix and match these layouts across slides 2–8 so the carousel isn't monotonous.

**Layout A: The Icon & Text Layout**
```jsx
// Perfect for list-oriented slides.
const IconRow = ({ iconChar, title, body }) => (
  <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
    {/* Large Purple Icon Container */}
    <div style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: '#F3E8FF', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 32, color: '#7C3AED' }}>{iconChar}</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontFamily: 'Montserrat', fontSize: 28, fontWeight: 700, color: '#0F172A' }}>{title}</div>
      <div style={{ fontFamily: 'Open Sans', fontSize: 24, color: '#475569', lineHeight: 1.5 }}>{body}</div>
    </div>
  </div>
);
```

**Layout B: Clean Split Image layout**
- Canvas split horizontally. Top 45% is a massive image (spanning full width up to padding).
- Bottom 55% contains the primary slide heading, purple accent line, and large body text.

**Layout C: Giant Number Sequence**
- Left side: A massive gradient-colored step number (e.g., "01").
- Right side: Title and extremely legible, chunked text (max 3 lines).

---

## 4. VERTICAL VIDEO / REELS (9:16)

### 4.1 Frame Structure & Safe Zones
- **Total Canvas:** 1080 x 1920
- **Outer Frame:** Left and Right borders only! (No top/bottom border).
  - Use a wrapper that has `background: linear-gradient()`, `padding: 0 6px`, so the gradient only shows on the sides.
- **Top Safe Zone:** 350px (Leave empty for TikTok/IG UI).
- **Bottom Safe Zone:** 450px (Leave empty for Captions & App UI).
- **Active Content Area:** Exactly 1120px of height right in the middle.

### 4.2 The Hook Screen (Seconds 0-2)
- **Background:** `#0F172A` (Navy Blue).
- **Animation logic:** Text scales up dynamically from 0.8 to 1.0 (spring animation).
- Giant 88px Montserrat bold text, centered.
- Underneath, a thick purple gradient underline (`height: 6px`, `width: 40%`).

### 4.3 Educational Video Layout Variations
*Background is `#FFFFFF`. Transitions should slide components into view.*

**Variation 1: The Highlight SpotlightCard**
```jsx
// A central elevated card floating in the white space
<div style={{ 
  width: '100%', 
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(15, 23, 42, 0.08)', // Soft navy shadow
  padding: 48 
}}>
  <h2 style={{ fontSize: 40, color: '#0F172A' }}>Core Principle</h2>
  <div style={{ height: 4, width: 64, background: 'linear-gradient(135deg, #A855F7, #6D28D9)', margin: '16px 0 24px 0' }} />
  <p style={{ fontSize: 26, color: '#475569' }}>The text goes here...</p>
</div>
```

**Variation 2: Diagram / Image Bottom**
- Top half of active zone: `Scene Heading` (44px) and 2–3 lines of `Scene Body Text` (26px).
- Bottom half of active zone: A beautiful, rounded illustration or data visualization sliding in from the bottom.

**Variation 3: Full-Width Callout Box**
```jsx
// A specialized callout box directly on the white canvas
<div style={{ display: 'flex', borderRadius: 16, overflow: 'hidden', backgroundColor: '#F8FAFC' }}>
  <div style={{ width: 12, background: 'linear-gradient(135deg, #A855F7, #6D28D9)' }} />
  <div style={{ padding: 32, fontSize: 26, color: '#0F172A', fontWeight: 600 }}>
    "Clinical quotes or vital facts go here."
  </div>
</div>
```

---

## 5. LANDSCAPE VIDEO (16:9)

### 5.1 Format Utilization
Wide space requires strong column alignment to prevent the "empty whiteboard" feeling.

### 5.2 Layout Variations

**Variation A: 33/66 Split (The Explainer)**
- **Left Column (33% width):** High-contrast Navy Blue sidebar holding the section title (Montserrat 56px, White text) and a purple gradient divider line.
- **Right Column (66% width):** Bright `#FFFFFF` canvas. Bullet points fading in sequentially. Body text is 28px.

**Variation B: The Stat Focus**
- Dead center horizontal axis.
- Left side: A massive `120px` Number in solid `#7C3AED` or gradient text.
- Right side: Definition and context.

---

## 6. EMAILS & STATIC SOCIAL

### 6.1 Enhancing the Blocky Emails
Take the exact same component structure used above:
- Email wrapper gets the `#F8FAFC` off-white background.
- Content sections are built as **SpotlightCards** (Variation 1 above) with soft shadows and massive padding (`40px`).
- Use the **Callout Box** (Variation 3) for key tips inside the email, instantly elevating the aesthetics from "flat HTML" to a premium modern newsletter.

---

## 7. CRITICAL EXECUTION RULES

1. **NO TINY TEXT:** The smallest body text anywhere on mobile formats must be `22px`. Desktop/Landscape is `26px`.
2. **THE PURPLE GRADIENT RULE:** It is the primary stylistic anchor. Use the `GradientBorderFrame` wrapper approach exclusively. 
3. **HIGH CONTRAST:** Use the Navy Blue (`#0F172A`) for extreme contrast frames (Covers, Hooks). Use White (`#FFFFFF`) for readable educational content frames.
4. **DEPTH:** Stick to a single, sophisticated shadow: `box-shadow: 0 8px 32px rgba(15, 23, 42, 0.08)`. No extreme drop shadows. No blurry CSS filters.
5. **FONTS ARE LOADED EXPLICITLY:** Ensure `document.fonts.ready` is awaited in Puppeteer so Montserrat and Open Sans always render at the correct massive weights.