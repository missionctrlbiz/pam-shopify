import puppeteer from "puppeteer"

interface SlideInput {
  slideTextBlocks: string[]
  hook: string
  cta: string
  topic: string
}

// ---------------------------------------------------------------------------
// HTML slide template
// PAM brand: Navy #1F2A44 background, White headings, Gray #6B7280 body
// Fonts: Montserrat (headings) + Open Sans (body) via Google Fonts CDN
// Dimensions: 1080 × 1080px (square carousel)
// ---------------------------------------------------------------------------

function buildSlideHtml(
  text: string,
  slideIndex: number,
  total: number
): string {
  const isFirst = slideIndex === 0
  const isLast = slideIndex === total - 1

  const fontSize = isFirst || isLast ? "48px" : "36px"
  const textColor = isFirst || isLast ? "#FFFFFF" : "#E5E7EB"
  const accentColor = "#4F9CF9"

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px;
      height: 1080px;
      background: #1F2A44;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 80px;
      overflow: hidden;
    }
    .slide-number {
      position: absolute;
      top: 40px;
      right: 50px;
      font-family: 'Open Sans', sans-serif;
      font-size: 22px;
      color: #6B7280;
    }
    .brand {
      position: absolute;
      bottom: 40px;
      left: 50px;
      font-family: 'Montserrat', sans-serif;
      font-size: 22px;
      font-weight: 700;
      color: ${accentColor};
      letter-spacing: 1px;
    }
    .content {
      font-family: ${isFirst || isLast ? "'Montserrat', sans-serif" : "'Open Sans', sans-serif"};
      font-size: ${fontSize};
      font-weight: ${isFirst || isLast ? "800" : "400"};
      color: ${textColor};
      text-align: center;
      line-height: 1.4;
      max-width: 900px;
    }
    .accent-line {
      width: 80px;
      height: 5px;
      background: ${accentColor};
      margin: 30px auto;
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <span class="slide-number">${slideIndex + 1} / ${total}</span>
  <div class="content">${text.replace(/\n/g, "<br/>")}</div>
  <div class="accent-line"></div>
  <div class="brand">PAM™</div>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Render function — returns array of PNG buffers
// ---------------------------------------------------------------------------

export async function renderSlides(input: SlideInput): Promise<Array<{ buffer: Buffer; slideIndex: number }>> {
  const execPath = process.env.PUPPETEER_EXECUTABLE_PATH
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: execPath ?? undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      "--single-process",
    ],
  })

  const slides = input.slideTextBlocks.length > 0
    ? input.slideTextBlocks
    : [input.hook, "...", "...", "...", "...", input.cta]

  const results: Array<{ buffer: Buffer; slideIndex: number }> = []

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1080, height: 1080 })

    for (let i = 0; i < slides.length; i++) {
      const html = buildSlideHtml(slides[i], i, slides.length)
      await page.setContent(html, { waitUntil: "networkidle0" })

      // Wait for fonts to load
      await page.evaluate(() =>
        document.fonts.ready
      )

      const buffer = await page.screenshot({ type: "png" })
      results.push({ buffer: buffer as Buffer, slideIndex: i })

      console.log(`[renderer] Rendered slide ${i + 1}/${slides.length}`)
    }

    await page.close()
  } finally {
    await browser.close()
  }

  return results
}
