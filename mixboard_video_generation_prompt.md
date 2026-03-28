# Mixboard Video Generation Exploratory Prompt

**Instructions for use:** 
Copy and paste the text below the divider into Google Labs Mixboard along with the start frame and end frame images you just uploaded.

---

**System & Role:**
You are an expert Motion Designer and Programmatic Video Director. I am providing you with start and end frames from our current system. We are upgrading our visual engine and building a programmatic video generator using **Remotion** (React-based video rendering). 

I need you to act as my storyboard artist and technical director. Your goal is to map out the complete visual flow, layout blueprints, and subtle animations for a single video sequence, formatted once for **Vertical (9:16)** and once for **Landscape (16:9)**.

**Core Video Aesthetic & Constraints:**
1. **Clinical Whiteboard Theme:** The primary aesthetic is a clean, highly structured "whiteboard" style. **Backgrounds should predominantly be pristine white** to keep the focus sharply on the content and maintain a premium, educational authority. Do not use generic blockish designs.
2. **Simplified, Remotion-Friendly Animation:** The animations must be easy to execute programmatically via CSS and React. Focus on precise, clean movements:
   - "Movement of pages" (e.g., a clean slide-up from the bottom, slide-in from the right, or sharp mask reveals).
   - Subtle spring-based scaling (pop-ins) for icons, opacity fade-ins for text lines, or smooth sliding typography.
3. **No Swipe UI:** Because this is a continuous video, absolutely no "Swipe" prompts or carousel UI elements. The flow must be automated and continuous.
4. **Strategic Color Accents:** 
   - Apply **purple gradients** as accents (e.g., framing elements, underlining, text gradients, or subtle overlays).
   - Use **solid navy blue or vivid purple backgrounds exclusively for the End Credits or major transitional illustrations** to create visual impact and contrast against the white backgrounds of the core content.

**What I Need From You (The Output):**
Analyze the provided frames, then generate a detailed, programmatic storyboard and layout description for the following formats:

### 1. Vertical Video Format (9:16 - Reels / Shorts)
*Focus: Fast-paced, readable, centered attention.*
- **Layout Structure:** On a white background, describe exactly how to arrange the Hook title, body text/bullets, and any illustrations. How do the purple gradients enhance the borders or text?
- **Animation logic:** Describe the exact "clinical" entry animations (e.g., "Title drops in from top. At 2 seconds, bullet points cascade in with a 20px slide-up and fade-in"). 
- **Page Movement:** How do we transition between "pages" (scenes) seamlessly?
- **End Credits:** Detail the abrupt but smooth transition to the solid deep blue/purple background. How does the final CTA resolve on screen?

### 2. Landscape Video Format (16:9 - YouTube / Presentations)
*Focus: Open space, structured logic, deep-dive aesthetics.*
- **Layout Structure:** How do we utilize the wide white background? (e.g., Split-screen with text on the left and clinical illustrations/icons on the right). 
- **Animation logic:** Describe the movement. How do we prevent the large white space from feeling "empty" while maintaining the clinical whiteboard vibe?
- **Color Accent Execution:** Where do the purple borders and purple gradients sit in a 16:9 frame?
- **End Credits:** Describe the layout and animation of the solid dark background closing scene.

**Goal:**
Provide me with a highly specific, step-by-step technical design blueprint. The descriptions should be practically written as pseudocode or CSS logic so a developer can easily translate your ideas directly into Remotion components and basic keyframe animations.
