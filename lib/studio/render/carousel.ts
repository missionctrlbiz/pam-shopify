import "server-only"

import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { join } from "node:path"
import { createElement, isValidElement, type ReactElement, type ReactNode } from "react"
import satori from "satori"
import { STUDIO_PAM_GRADIENT, STUDIO_TYPOGRAPHY } from "@/lib/studio/shared"
import { getSlideLayoutSpec, STUDIO_FRAME_DIMENSIONS, type SlideLayoutSpec } from "@/lib/studio/slideSpec"
import type { StudioRatio, StudioSlideLayout } from "@/lib/studio/types"

export interface StudioRenderDimensions {
    width: number
    height: number
    frameWidth: number
    frameHeight: number
}

export interface StudioRenderTheme {
    gradient: string
    navy: string
    ink: string
    purple: string
    pink: string
    red: string
}

export interface StudioRenderableSlide {
    id: string
    kind: "COVER" | "INSIGHT" | "CTA" | "STAT" | "QUOTE"
    layout?: StudioSlideLayout
    headline: string
    body: string
    stat?: { value: string; label: string }
    bg: "NAVY" | "WHITE" | "INK" | "GRADIENT" | "SLATE"
    assets?: { logo: "COLOR" | "WHITE" | "NONE"; book?: boolean }
}

export interface StudioRenderBrand {
    brandName: string
    siteUrl: string
    logoColorDataUrl?: string | null
    logoWhiteDataUrl?: string | null
    bookDataUrl?: string | null
    palette: string[]
}

/** Backwards-compatible alias used by older call sites that only had a single logo. */
export interface StudioRenderBrandLegacy {
    brandName: string
    siteUrl: string
    logoDataUrl?: string | null
    bookDataUrl?: string | null
    palette: string[]
}

export const STUDIO_THEME: StudioRenderTheme = {
    gradient: STUDIO_PAM_GRADIENT,
    navy: "#041f50",
    ink: "#0a0e1f",
    purple: "#af5ce9",
    pink: "#ec5185",
    red: "#ed415b",
}

export const STUDIO_RATIO_DIMENSIONS: Record<StudioRatio, StudioRenderDimensions> = {
    "1:1": { width: 1080, height: 1080, frameWidth: 380, frameHeight: 380 },
    "4:5": { width: 1080, height: 1350, frameWidth: 360, frameHeight: 450 },
    "9:16": { width: 1080, height: 1920, frameWidth: 290, frameHeight: 516 },
}

function safeText(value: unknown, fallback = "") {
    return typeof value === "string" ? value : fallback
}

function sanitizeSatoriStyle(style: unknown) {
    if (!style || typeof style !== "object" || Array.isArray(style)) {
        return undefined
    }

    const next: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(style)) {
        if (value !== undefined && value !== null && value !== false) {
            next[key] = value
        }
    }

    return Object.keys(next).length > 0 ? next : undefined
}

function sanitizeSatoriNode(node: ReactNode): ReactNode {
    if (Array.isArray(node)) {
        return node.map(sanitizeSatoriNode).filter((child) => child !== undefined && child !== null && child !== false)
    }

    if (!isValidElement(node)) {
        return node === false ? null : node
    }

    const props = node.props as Record<string, unknown> & { children?: ReactNode; style?: unknown }
    const sanitizedProps: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(props)) {
        if (key === "children" || key === "style") {
            continue
        }

        if (value !== undefined && value !== null && value !== false) {
            sanitizedProps[key] = value
        }
    }

    const style = sanitizeSatoriStyle(props.style)
    if (style) {
        sanitizedProps.style = style
    }

    const children = sanitizeSatoriNode(props.children)
    return createElement(node.type, sanitizedProps, children)
}

const LAYOUT_BASE_HEADLINE: Record<string, number> = {
    HERO_ICON: 52,
    FEATURE_CARDS: 48,
    TITLE_CARD: 38,
    TAXONOMY_LIST: 46,
    SCIENCE_SPLIT: 36,
    DARK_NOTE: 66,
}

function compactForSpec(spec: SlideLayoutSpec, layout: string): number {
    const base = LAYOUT_BASE_HEADLINE[layout] ?? 52
    return spec.headlineSize / base
}

function footerCue(index: number) {
    const cues = ["keep for review", "clinical cue", "save this step", "field note", "check before charting", "assessment lens"]
    return cues[index % cues.length].toUpperCase()
}

type ResvgRenderer = {
    render(): {
        asPng(): Uint8Array
    }
}

type ResvgConstructor = new (
    svg: string,
    options: {
        fitTo: {
            mode: "width"
            value: number
        }
    }
) => ResvgRenderer

const requireModule = createRequire(import.meta.url)
let cachedResvg: ResvgConstructor | null = null
let cachedFonts: { heading: ArrayBuffer; body: ArrayBuffer; bodyBold: ArrayBuffer } | null = null
let cachedPublicAssets: { logoColor: string | null; logoWhite: string | null; book: string | null } | null = null

function getResvg(): ResvgConstructor {
    if (cachedResvg) return cachedResvg
    const packageName = ["@resvg", "resvg-js"].join("/")
    const { Resvg } = requireModule(packageName) as { Resvg: ResvgConstructor }
    cachedResvg = Resvg
    return Resvg
}

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
        return await fetch(url, { signal: controller.signal })
    } finally {
        clearTimeout(timer)
    }
}

async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`

    let css: string
    try {
        css = await fetchWithTimeout(url, 10000).then((response) => response.text())
    } catch {
        throw new Error(`Failed to fetch font CSS for ${family} ${weight}`)
    }

    const match = css.match(/src: url\(([^)]+)\) format\('(opentype|truetype|woff2)'\)/)

    if (!match) {
        throw new Error(`Unable to resolve font ${family} ${weight}`)
    }

    try {
        return await fetchWithTimeout(match[1], 15000).then((response) => response.arrayBuffer())
    } catch {
        throw new Error(`Failed to download font file for ${family} ${weight}`)
    }
}

async function getFonts() {
    if (!cachedFonts) {
        let lastError: unknown
        for (let attempt = 0; attempt < 2; attempt += 1) {
            try {
                const [heading, body, bodyBold] = await Promise.all([
                    loadGoogleFont("Montserrat", 800),
                    loadGoogleFont("Open Sans", 400),
                    loadGoogleFont("Open Sans", 700),
                ])
                cachedFonts = { heading, body, bodyBold }
                return cachedFonts
            } catch (error) {
                lastError = error
                if (attempt === 0) {
                    await new Promise<void>((resolve) => { setTimeout(resolve, 1500) })
                }
            }
        }
        throw lastError
    }

    return cachedFonts
}

function toDataUrl(buffer: Buffer, contentType: string) {
    return `data:${contentType};base64,${buffer.toString("base64")}`
}

export async function getStudioPublicAssets() {
    if (cachedPublicAssets) {
        return cachedPublicAssets
    }

    const logoColorPath = join(process.cwd(), "public", "logo.webp")
    const logoWhitePath = join(process.cwd(), "public", "favicon-white.png")
    const bookPath = join(process.cwd(), "public", "1.png")

    const [logoColor, logoWhite, book] = await Promise.all([
        readFile(logoColorPath).then((buffer) => toDataUrl(buffer, "image/webp")).catch(() => null),
        readFile(logoWhitePath).then((buffer) => toDataUrl(buffer, "image/png")).catch(() => null),
        readFile(bookPath).then((buffer) => toDataUrl(buffer, "image/png")).catch(() => null),
    ])

    cachedPublicAssets = { logoColor, logoWhite, book }
    return cachedPublicAssets
}

/** Slide-kind aware base background styling that matches the prototype. */
function getBaseBackground(kind: StudioRenderableSlide["kind"], explicit: StudioRenderableSlide["bg"]) {
    if (explicit === "WHITE") return { backgroundColor: "#ffffff" }
    if (explicit === "SLATE") return { backgroundImage: "linear-gradient(135deg, #f8fafc 0%, #eef2f7 55%, #e2e8f0 100%)" }
    if (explicit === "INK") return { backgroundColor: STUDIO_THEME.ink }
    if (explicit === "GRADIENT") return { backgroundImage: STUDIO_THEME.gradient }
    if (kind === "CTA") return { backgroundColor: STUDIO_THEME.ink }
    return { backgroundColor: STUDIO_THEME.navy }
}

/** Layered radial gradient overlays per slide kind, mirrors the prototype. */
function getOverlay(kind: StudioRenderableSlide["kind"], explicit: StudioRenderableSlide["bg"]) {
    const isLight = explicit === "WHITE"
    if (explicit === "SLATE") {
        return "radial-gradient(circle at top right, rgba(175,92,233,0.13), transparent 52%), radial-gradient(circle at bottom left, rgba(4,31,80,0.06), transparent 56%)"
    }
    if (isLight) {
        return "radial-gradient(circle at top right, rgba(175,92,233,0.10), transparent 50%)"
    }
    if (kind === "CTA") {
        return "radial-gradient(circle at center, rgba(175,92,233,0.30), transparent 65%)"
    }
    return [
        "radial-gradient(circle at top right, rgba(175,92,233,0.40), transparent 55%)",
        "radial-gradient(circle at bottom left, rgba(237,65,91,0.22), transparent 55%)",
    ].join(", ")
}

function pickLogo(brand: StudioRenderBrand, dark: boolean) {
    if (dark) {
        return brand.logoWhiteDataUrl ?? brand.logoColorDataUrl ?? null
    }
    return brand.logoColorDataUrl ?? brand.logoWhiteDataUrl ?? null
}

function renderLogo(src: string | null, size: { w: number; h: number }, opacity = 1): ReactNode {
    if (!src) {
        return createElement(
            "div",
            {
                style: {
                    fontSize: 22,
                    fontFamily: "Montserrat",
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    color: opacity < 1 ? "rgba(255,255,255,0.7)" : "#0f172a",
                },
            },
            "PAM",
        )
    }

    return createElement("img", {
        src,
        alt: "PAM",
        width: size.w,
        height: size.h,
        style: {
            width: size.w,
            height: size.h,
            objectFit: "contain",
            opacity,
        },
    })
}

type IconName = "brain" | "search" | "clipboard" | "shield" | "list" | "pulse" | "sparkle"

function iconPaths(name: IconName) {
    if (name === "search") return [
        createElement("circle", { key: "c", cx: 10.5, cy: 10.5, r: 6.5 }),
        createElement("path", { key: "p", d: "M15.5 15.5 L21 21" }),
    ]
    if (name === "clipboard") return [
        createElement("rect", { key: "r", x: 6, y: 5, width: 12, height: 16, rx: 2 }),
        createElement("path", { key: "t", d: "M9 5 C9 3.8 10 3 12 3 C14 3 15 3.8 15 5" }),
        createElement("path", { key: "l1", d: "M9 11 H15" }),
        createElement("path", { key: "l2", d: "M9 15 H14" }),
    ]
    if (name === "shield") return [
        createElement("path", { key: "s", d: "M12 3 L19 6 V11 C19 16 16 19.5 12 21 C8 19.5 5 16 5 11 V6 Z" }),
        createElement("path", { key: "c", d: "M9 12 L11 14 L15.5 9.5" }),
    ]
    if (name === "list") return [
        createElement("path", { key: "d1", d: "M6 7 H6.1" }),
        createElement("path", { key: "d2", d: "M6 12 H6.1" }),
        createElement("path", { key: "d3", d: "M6 17 H6.1" }),
        createElement("path", { key: "l1", d: "M10 7 H19" }),
        createElement("path", { key: "l2", d: "M10 12 H19" }),
        createElement("path", { key: "l3", d: "M10 17 H19" }),
    ]
    if (name === "pulse") return [
        createElement("path", { key: "p", d: "M3 13 H7 L9 7 L13 18 L16 11 H21" }),
    ]
    if (name === "sparkle") return [
        createElement("path", { key: "s", d: "M12 2 L13.5 8.5 L12 7 L10.5 8.5 Z M12 22 L13.5 15.5 L12 17 L10.5 15.5 Z M2 12 L8.5 10.5 L7 12 L8.5 13.5 Z M22 12 L15.5 10.5 L17 12 L15.5 13.5 Z" }),
    ]
    // brain (default)
    return [
        createElement("path", { key: "b1", d: "M12 5 C9 2 5 4 5 8 C2 9 2 14 6 15 C6 19 11 20 12 16" }),
        createElement("path", { key: "b2", d: "M12 5 C15 2 19 4 19 8 C22 9 22 14 18 15 C18 19 13 20 12 16" }),
        createElement("path", { key: "m", d: "M12 5 V19" }),
        createElement("path", { key: "l", d: "M8 10 C9 11 10 11 12 10" }),
        createElement("path", { key: "r", d: "M16 10 C15 11 14 11 12 10" }),
    ]
}

function renderLineIcon(name: IconName, size: number, color = STUDIO_THEME.purple) {
    const useGradient = color === STUDIO_THEME.purple
    return createElement(
        "svg",
        {
            width: size,
            height: size,
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: useGradient ? "url(#pam-icon-gradient)" : color,
            strokeWidth: 2.2,
            strokeLinecap: "round",
            strokeLinejoin: "round",
        },
        useGradient ? createElement("defs", { key: "defs" },
            createElement("linearGradient", { id: "pam-icon-gradient", x1: "0", y1: "0", x2: "24", y2: "24", gradientUnits: "userSpaceOnUse" },
                createElement("stop", { offset: "0%", stopColor: STUDIO_THEME.red }),
                createElement("stop", { offset: "52%", stopColor: STUDIO_THEME.pink }),
                createElement("stop", { offset: "100%", stopColor: STUDIO_THEME.purple }),
            ),
        ) : null,
        ...iconPaths(name),
    )
}

function renderIconBadge(name: IconName, size: number, soft = true) {
    return createElement(
        "div",
        {
            style: {
                display: "flex",
                width: size,
                height: size,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                backgroundImage: soft ? "linear-gradient(135deg, rgba(237,65,91,0.13), rgba(175,92,233,0.18))" : undefined,
                backgroundColor: soft ? undefined : "#ffffff",
                color: STUDIO_THEME.purple,
            },
        },
        renderLineIcon(name, Math.round(size * 0.54), STUDIO_THEME.purple),
    )
}

function eyebrowFor(slide: StudioRenderableSlide, index: number, total: number, isLast: boolean) {
    if (slide.kind === "CTA" || isLast) return "FINAL SLIDE"
    if (slide.layout === "FEATURE_CARDS") return "CLINICAL TOOLS"
    if (slide.layout === "TITLE_CARD") return "CLINICAL FOCUS"
    if (slide.layout === "TAXONOMY_LIST") return "TYPES"
    if (slide.layout === "SCIENCE_SPLIT") return "MECHANISM"
    if (slide.layout === "CHECKLIST") return "CHECKLIST"
    if (slide.kind === "INSIGHT") {
        const labels = ["CLINICAL LENS", "SAFETY CHECK", "ASSESSMENT MOVE", "DECISION POINT", "FIELD NOTE"]
        return labels[index % labels.length]
    }
    if (slide.kind === "QUOTE") return "QUOTE"
    if (slide.kind === "STAT") return "STAT HOOK"
    return "PAM"
}

function renderTopBar(slide: StudioRenderableSlide, brand: StudioRenderBrand, dark: boolean, eyebrow: string) {
    const eyebrowStyle = dark
        ? { backgroundColor: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.10)" }
        : { color: "transparent", backgroundImage: STUDIO_THEME.gradient, backgroundClip: "text", WebkitBackgroundClip: "text" }

    return createElement(
        "div",
        {
            style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "relative",
                zIndex: 2,
            },
        },
        createElement(
            "div",
            {
                style: {
                    fontSize: 18,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    fontFamily: "Open Sans",
                    fontWeight: 700,
                    padding: "8px 16px",
                    borderRadius: 8,
                    ...eyebrowStyle,
                },
            },
            eyebrow,
        ),
        renderLogo(pickLogo(brand, dark), dark ? { w: 56, h: 56 } : { w: 156, h: 44 }, dark ? 0.85 : 0.95),
    )
}

function renderFooter(siteUrl: string, footer: string, dark: boolean) {
    const color = dark ? "rgba(255,255,255,0.55)" : "rgba(4,31,80,0.45)"
    return createElement(
        "div",
        {
            style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "relative",
                zIndex: 2,
                fontSize: 16,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color,
                fontFamily: "Open Sans",
                fontWeight: 700,
            },
        },
        createElement("div", null, siteUrl.toUpperCase()),
        createElement("div", null, footer),
    )
}

/** Stat text rendered with brand gradient via Satori's bg-clip-text support. */
function renderGradientStat(value: string, fontSize: number) {
    return createElement(
        "div",
        {
            style: {
                fontSize,
                lineHeight: 1,
                fontFamily: STUDIO_TYPOGRAPHY.headingFamily,
                fontWeight: 800,
                color: "transparent",
                backgroundImage: STUDIO_THEME.gradient,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                marginBottom: 10,
            },
        },
        value,
    )
}

function renderBookFloating(bookDataUrl: string | null, layout: "cover" | "centered", scale = 1) {
    if (!bookDataUrl) return null

    if (layout === "centered") {
        const w = Math.round(220 * scale)
        const h = Math.round(282 * scale)
        return createElement(
            "div",
            {
                style: {
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 28,
                },
            },
            createElement("img", {
                src: bookDataUrl,
                alt: "PAM Book",
                width: w,
                height: h,
                style: {
                    width: w,
                    height: h,
                    objectFit: "cover",
                    borderRadius: 14,
                    boxShadow: "0 30px 60px -10px rgba(0,0,0,0.6)",
                },
            }),
        )
    }

    const w = Math.round(220 * scale)
    const h = Math.round(282 * scale)
    return createElement(
        "div",
        {
            style: {
                display: "flex",
                position: "absolute",
                right: 56,
                bottom: 180,
                transform: "rotate(-5deg)",
                zIndex: 3,
            },
        },
        createElement("img", {
            src: bookDataUrl,
            alt: "PAM Book",
            width: w,
            height: h,
            style: {
                width: w,
                height: h,
                objectFit: "cover",
                borderRadius: 12,
                boxShadow: "0 26px 50px -10px rgba(0,0,0,0.6)",
            },
        }),
    )
}

/** Multi-row insight body — splits "Term — description" lines into accent-bar rows. */
function renderInsightBody(body: string, dark: boolean) {
    const lines = safeText(body).split(/\n+/).map((line) => line.trim()).filter(Boolean)
    if (lines.length === 0) return null

    return createElement(
        "div",
        {
            style: {
                display: "flex",
                flexDirection: "column",
                gap: 14,
                marginTop: 16,
            },
        },
        ...lines.map((line, i) => {
            const split = line.split(/\s—\s/)
            const term = split[0]
            const desc = split.slice(1).join(" — ")
            return createElement(
                "div",
                {
                    key: `line-${i}`,
                    style: {
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 18,
                    },
                },
                createElement("div", {
                    style: {
                        width: 6,
                        height: 42,
                        borderRadius: 999,
                        backgroundImage: STUDIO_THEME.gradient,
                        flexShrink: 0,
                    },
                }),
                createElement(
                    "div",
                    {
                        style: {
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 6,
                            fontSize: 24,
                            lineHeight: 1.36,
                            fontFamily: "Open Sans",
                            color: dark ? "rgba(255,255,255,0.78)" : "#475569",
                        },
                    },
                    createElement(
                        "span",
                        {
                            style: {
                                fontFamily: "Open Sans",
                                fontWeight: 700,
                                color: dark ? "#ffffff" : STUDIO_THEME.navy,
                            },
                        },
                        term,
                    ),
                    desc ? createElement("span", null, ` — ${desc}`) : null,
                ),
            )
        }),
    )
}

function getBodyLines(body: string) {
    return safeText(body).split(/\n+/).map((line) => line.trim()).filter(Boolean)
}

function getContentRows(body: string) {
    return getBodyLines(body)
        .map((line) => {
            const clean = line.replace(/^(?:[-*•✓✔]|\d+[.)])\s+/, "")
            const [term, ...rest] = clean.split(/\s[—-]\s|:\s/)
            return { term: term.trim(), description: rest.join(" — ").trim() }
        })
        .filter((row) => row.term.length > 0)
}

function isChecklistBody(body: string) {
    const lines = getBodyLines(body)
    return lines.length >= 3 && lines.every((line) => /^(?:[-*•✓✔]|\d+[.)])\s+/.test(line) || !line.includes(" — "))
}

function effectiveLayout(slide: StudioRenderableSlide, index: number, totalSlides: number): StudioSlideLayout {
    if (index === totalSlides - 1 || slide.kind === "CTA") return "HERO_ICON"
    if (slide.layout && slide.layout !== "AUTO") return slide.layout
    if (index === 0 || slide.kind === "COVER") return "HERO_ICON"
    if (slide.kind === "STAT") return "STAT_CARD"
    if (slide.kind === "QUOTE") return "QUOTE_CARD"
    if (isChecklistBody(slide.body)) return "CHECKLIST"
    if (getContentRows(slide.body).length >= 3) return "TAXONOMY_LIST"
    if (slide.bg !== "WHITE") return "DARK_NOTE"
    return "TITLE_CARD"
}

function renderChecklistBody(body: string) {
    const lines = getBodyLines(body).slice(0, 5)
    if (lines.length === 0) return null

    return createElement(
        "div",
        {
            style: {
                display: "flex",
                flexDirection: "column",
                gap: 13,
                marginTop: 22,
            },
        },
        ...lines.map((line, i) => createElement(
            "div",
            {
                key: `check-${i}`,
                style: {
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 16,
                    padding: "15px 18px",
                    borderRadius: 20,
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    color: "#475569",
                    fontFamily: "Open Sans",
                    fontSize: 22,
                    fontWeight: 700,
                    lineHeight: 1.3,
                },
            },
            createElement(
                "div",
                {
                    style: {
                        display: "flex",
                        width: 26,
                        height: 26,
                        borderRadius: 999,
                        backgroundImage: STUDIO_THEME.gradient,
                        color: "#ffffff",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: 17,
                        fontFamily: "Montserrat",
                        fontWeight: 800,
                    },
                },
                "✓",
            ),
            createElement("div", null, line.replace(/^(?:[-*•✓✔]|\d+[.)])\s+/, "")),
        )),
    )
}

function renderCtaChip(siteUrl: string) {
    return createElement(
        "div",
        {
            style: {
                display: "flex",
                marginTop: 30,
                padding: "17px 28px",
                borderRadius: 24,
                backgroundImage: STUDIO_THEME.gradient,
                color: "#ffffff",
                fontSize: 22,
                fontFamily: "Open Sans",
                fontWeight: 700,
                boxShadow: "0 18px 36px -10px rgba(175,92,233,0.55)",
            },
        },
        siteUrl,
    )
}

function renderMinimalFrame(children: ReactNode, options: { border?: "full" | "sides"; footer?: ReactNode } = {}) {
    const sideBorder = options.border === "sides"
    return createElement(
        "div",
        {
            style: {
                display: "flex",
                width: "100%",
                height: "100%",
                flexDirection: "column",
                position: "relative",
                backgroundImage: sideBorder ? undefined : STUDIO_THEME.gradient,
                backgroundColor: "#ffffff",
                padding: sideBorder ? 0 : 10,
                color: "#252838",
                overflow: "hidden",
            },
        },
        sideBorder ? createElement("div", { style: { position: "absolute", left: 0, top: 0, bottom: 0, width: 10, backgroundImage: STUDIO_THEME.gradient } }) : null,
        sideBorder ? createElement("div", { style: { position: "absolute", right: 0, top: 0, bottom: 0, width: 10, backgroundImage: STUDIO_THEME.gradient } }) : null,
        createElement(
            "div",
            {
                style: {
                    display: "flex",
                    flex: 1,
                    minHeight: 0,
                    flexDirection: "column",
                    backgroundColor: "#ffffff",
                    position: "relative",
                    zIndex: 1,
                    overflow: "hidden",
                },
            },
            children,
        ),
        options.footer ?? null,
    )
}

function renderHeroIconLayout(slide: StudioRenderableSlide, brand: StudioRenderBrand, ratio: StudioRatio, spec: SlideLayoutSpec) {
    const isCta = slide.kind === "CTA"
    const dark = isCta || slide.bg !== "WHITE"
    const compact = compactForSpec(spec, "HERO_ICON")
    if (dark) {
        return createElement(
            "div",
            {
                style: {
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                    flex: 1,
                    gap: Math.round(24 * compact),
                    position: "relative",
                    zIndex: 2,
                },
            },
            isCta && brand.bookDataUrl ? renderBookFloating(brand.bookDataUrl, "centered", compact) : renderIconBadge("brain", Math.round(156 * compact)),
            createElement("div", {
                style: {
                    fontFamily: "Montserrat",
                    fontWeight: 800,
                    fontSize: Math.round(48 * compact),
                    lineHeight: 1.1,
                    maxWidth: "78%",
                    color: "#ffffff",
                },
            }, slide.headline),
            slide.body ? createElement("div", {
                style: {
                    fontFamily: "Open Sans",
                    fontSize: Math.round(22 * compact),
                    lineHeight: 1.4,
                    color: "rgba(255,255,255,0.62)",
                    maxWidth: "70%",
                },
            }, slide.body) : null,
            isCta ? renderCtaChip(brand.siteUrl) : null,
        )
    }

    return renderMinimalFrame(
        createElement(
            "div",
            {
                style: {
                    display: "flex",
                    flex: 1,
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: Math.round(58 * compact),
                },
            },
            createElement("div", { style: { position: "absolute", left: 64, top: 52, fontSize: 28, letterSpacing: "0.16em", color: "#4b4e5f", fontFamily: "Open Sans", fontWeight: 700, textTransform: "uppercase" } }, "PSYCH MASTERY"),
            createElement("div", { style: { fontSize: Math.round(42 * compact), lineHeight: 1.1, fontFamily: "Montserrat", fontWeight: 800, color: "#2a2d3d", maxWidth: "86%", marginBottom: Math.round(34 * compact) } }, slide.headline),
            renderIconBadge("brain", Math.round(148 * compact)),
            createElement("div", { style: { width: "86%", height: 2, backgroundColor: "#d7d9e1", marginTop: Math.round(34 * compact), marginBottom: Math.round(20 * compact) } }),
            slide.body ? createElement("div", { style: { fontSize: Math.round(21 * compact), lineHeight: 1.36, fontFamily: "Open Sans", color: "#626677", maxWidth: "84%" } }, getBodyLines(slide.body)[0] ?? slide.body) : null,
        ),
    )
}

function renderFeatureCardsLayout(slide: StudioRenderableSlide, ratio: StudioRatio, spec: SlideLayoutSpec) {
    const compact = compactForSpec(spec, "FEATURE_CARDS")
    const rows = getContentRows(slide.body).slice(0, 3)
    const icons: IconName[] = ["brain", "search", "clipboard"]

    return renderMinimalFrame(
        createElement(
            "div",
            { style: { display: "flex", flex: 1, flexDirection: "column", padding: `${Math.round(48 * compact)}px ${Math.round(60 * compact)}px` } },
            createElement("div", { style: { textAlign: "center", fontFamily: "Open Sans", fontWeight: 800, fontSize: Math.round(22 * compact), letterSpacing: "0.12em", color: "#2f3241", textTransform: "uppercase", marginBottom: Math.round(46 * compact) } }, "PSYCH MASTERY"),
            createElement("div", { style: { fontFamily: "Montserrat", fontWeight: 800, fontSize: Math.round(48 * compact), lineHeight: 1.08, color: "#252838", marginBottom: Math.round(34 * compact) } }, slide.headline),
            createElement("div", { style: { height: 5, backgroundImage: STUDIO_THEME.gradient, marginBottom: Math.round(38 * compact) } }),
            createElement(
                "div",
                { style: { display: "flex", flexDirection: "column", gap: Math.round(22 * compact) } },
                ...rows.map((row, index) => createElement(
                    "div",
                    { key: `feature-${index}`, style: { display: "flex", alignItems: "center", gap: Math.round(24 * compact), padding: `${Math.round(24 * compact)}px ${Math.round(30 * compact)}px`, backgroundColor: "#ffffff", borderRadius: 18, boxShadow: "0 24px 54px rgba(15,23,42,0.11)" } },
                    renderIconBadge(icons[index % icons.length], Math.round(72 * compact)),
                    createElement("div", { style: { display: "flex", flexDirection: "column" } },
                        createElement("div", { style: { fontSize: Math.round(26 * compact), fontFamily: "Montserrat", fontWeight: 800, color: "#252838", marginBottom: 8 } }, row.term),
                        createElement("div", { style: { fontSize: Math.round(21 * compact), lineHeight: 1.35, fontFamily: "Open Sans", color: "#5f6372" } }, row.description),
                    ),
                )),
            ),
        ),
    )
}

function renderTitleCardLayout(slide: StudioRenderableSlide, ratio: StudioRatio, spec: SlideLayoutSpec) {
    const compact = compactForSpec(spec, "TITLE_CARD")
    return renderMinimalFrame(
        createElement(
            "div",
            { style: { display: "flex", flex: 1, flexDirection: "column", padding: `${Math.round(62 * compact)}px ${Math.round(70 * compact)}px` } },
            createElement("div", { style: { display: "flex", height: Math.round(122 * compact), borderRadius: 24, backgroundImage: "linear-gradient(135deg, rgba(237,65,91,0.10), rgba(175,92,233,0.14))", alignItems: "center", justifyContent: "center", marginBottom: Math.round(32 * compact), boxShadow: "0 20px 42px rgba(15,23,42,0.10)" } }, renderLineIcon("brain", Math.round(62 * compact), STUDIO_THEME.purple)),
            createElement("div", { style: { height: 2, backgroundColor: "#cfd3dc" } }),
            createElement("div", { style: { display: "flex", alignItems: "center", gap: 18, margin: `${Math.round(30 * compact)}px 0` } },
                createElement("div", { style: { width: 9, height: Math.round(56 * compact), backgroundImage: STUDIO_THEME.gradient } }),
                createElement("div", { style: { fontSize: Math.round(38 * compact), fontFamily: "Montserrat", fontWeight: 800, color: "#333645", lineHeight: 1.08 } }, slide.headline),
            ),
            createElement("div", { style: { height: 2, backgroundColor: "#cfd3dc", marginBottom: Math.round(30 * compact) } }),
            createElement("div", { style: { fontFamily: "Open Sans", fontSize: Math.round(21 * compact), lineHeight: 1.38, color: "#626777" } }, slide.body),
        ),
    )
}

function renderTaxonomyListLayout(slide: StudioRenderableSlide, ratio: StudioRatio, spec: SlideLayoutSpec) {
    const compact = compactForSpec(spec, "TAXONOMY_LIST")
    const rows = getContentRows(slide.body).slice(0, 4)
    return renderMinimalFrame(
        createElement(
            "div",
            { style: { display: "flex", flex: 1, flexDirection: "column", padding: `${Math.round(70 * compact)}px ${Math.round(76 * compact)}px` } },
            createElement("div", { style: { textAlign: "center", fontFamily: "Montserrat", fontWeight: 800, fontSize: Math.round(46 * compact), letterSpacing: "0.06em", color: "#202637", textTransform: "uppercase", marginBottom: Math.round(54 * compact) } }, slide.headline),
            createElement("div", { style: { display: "flex", flexDirection: "column", backgroundColor: "#f1f3f7" } },
                ...rows.map((row, index) => createElement(
                    "div",
                    { key: `row-${index}`, style: { display: "flex", minHeight: Math.round(118 * compact), alignItems: "center", gap: Math.round(32 * compact), padding: `${Math.round(24 * compact)}px ${Math.round(38 * compact)}px`, borderBottom: index === rows.length - 1 ? undefined : "2px solid #d6dae2" } },
                    createElement("div", { style: { width: Math.round(58 * compact), height: Math.round(58 * compact), borderRadius: 999, backgroundImage: STUDIO_THEME.gradient, flexShrink: 0 } }),
                    createElement("div", { style: { display: "flex", flexDirection: "column" } },
                        createElement("div", { style: { fontFamily: "Montserrat", fontWeight: 800, fontSize: Math.round(30 * compact), color: "#202637", marginBottom: 8 } }, row.term),
                        createElement("div", { style: { fontFamily: "Open Sans", fontSize: Math.round(24 * compact), lineHeight: 1.28, color: "#656b76" } }, row.description),
                    ),
                )),
            ),
        ),
        { border: "sides" },
    )
}

function renderScienceSplitLayout(slide: StudioRenderableSlide, ratio: StudioRatio, index: number, spec: SlideLayoutSpec) {
    const compact = compactForSpec(spec, "SCIENCE_SPLIT")
    const rows = getContentRows(slide.body)
    const lines = getBodyLines(slide.body)
    const subtitle = rows[0]?.term && rows[0]?.description ? rows[0].term : lines[0] ?? "Clinical mechanism"
    const explanation = rows[0]?.description || lines[1] || lines.slice(1, 3).join(" ")
    const labels = rows.slice(rows[0]?.description ? 1 : 0, ratio === "1:1" ? 4 : 6)

    if (ratio === "1:1") {
        return renderMinimalFrame(
            createElement(
                "div",
                {
                    style: {
                        display: "flex",
                        flex: 1,
                        flexDirection: "column",
                        padding: `${spec.paddingY}px ${spec.paddingX}px`,
                        color: "#1f2430",
                    },
                },
                createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: Math.round(32 * compact) } },
                    renderLineIcon("brain", Math.round(spec.iconSize * 0.72), STUDIO_THEME.purple),
                    createElement("div", { style: { fontFamily: "Montserrat", fontWeight: 800, fontSize: spec.headlineSize, color: "#1f2430", lineHeight: 1.08 } }, slide.headline),
                ),
                createElement(
                    "div",
                    {
                        style: {
                            display: "flex",
                            flex: 1,
                            gap: Math.round(30 * compact),
                        },
                    },
                    createElement(
                        "div",
                        {
                            style: {
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                width: "48%",
                            },
                        },
                        createElement("div", { style: { display: "flex", gap: 14 } },
                            createElement("div", { style: { width: 10, borderRadius: 999, backgroundImage: STUDIO_THEME.gradient, flexShrink: 0 } }),
                            createElement("div", { style: { display: "flex", flexDirection: "column" } },
                                createElement("div", { style: { fontFamily: "Montserrat", fontSize: spec.headlineSize, fontWeight: 800, lineHeight: 1.04, color: "#1f2430", marginBottom: 10 } }, subtitle),
                                createElement("div", { style: { fontFamily: "Open Sans", fontSize: spec.bodySize, lineHeight: 1.34, color: "#3f4652" } }, explanation),
                            ),
                        ),
                    ),
                    createElement(
                        "div",
                        {
                            style: {
                                display: "flex",
                                flex: 1,
                                flexDirection: "column",
                                justifyContent: "center",
                                borderRadius: 26,
                                border: "2px solid #d7dce5",
                                padding: Math.round(28 * compact),
                                boxShadow: "0 18px 44px rgba(15,23,42,0.10)",
                            },
                        },
                        createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", marginBottom: Math.round(16 * compact) } },
                            createElement("div", { style: { display: "flex", width: Math.round(140 * compact), height: Math.round(92 * compact), border: "4px solid #8d9aaa", borderRadius: "50%", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fbff" } },
                                renderLineIcon("brain", Math.round(56 * compact), "#7f8a99"),
                            ),
                        ),
                        createElement("div", { style: { display: "flex", flexDirection: "column", gap: Math.round(12 * compact) } },
                            ...labels.map((row, labelIndex) => createElement("div", { key: `label-${labelIndex}`, style: { display: "flex", alignItems: "center", gap: 12, fontFamily: "Open Sans", fontWeight: 700, fontSize: spec.labelSize, color: "#1f2430" } },
                                createElement("div", { style: { width: 12, height: 12, borderRadius: 999, backgroundImage: STUDIO_THEME.gradient } }),
                                createElement("div", null, `${row.term}${row.description ? ` (${row.description})` : ""}`),
                            )),
                        ),
                    ),
                ),
            ),
            { border: "sides" },
        )
    }

    return createElement(
        "div",
        { style: { display: "flex", flex: 1, flexDirection: "column", backgroundColor: "#ffffff", color: "#1f2430" } },
        createElement("div", { style: { display: "flex", height: Math.round(76 * compact), alignItems: "center", justifyContent: "space-between", padding: `0 ${Math.round(50 * compact)}px`, borderBottom: "2px solid #dce0e7" } },
            renderLineIcon("brain", Math.round(36 * compact), STUDIO_THEME.purple),
            createElement("div", { style: { fontFamily: "Montserrat", fontWeight: 800, fontSize: Math.round(30 * compact), color: "#1f2430", maxWidth: "68%" } }, slide.headline),
            createElement("div", { style: { fontFamily: "Open Sans", fontSize: Math.round(18 * compact), color: "#6a6e77", letterSpacing: "0.12em", textTransform: "uppercase" } }, footerCue(index)),
        ),
        createElement("div", { style: { display: "flex", flex: 1, padding: `${Math.round(52 * compact)}px ${Math.round(52 * compact)}px ${Math.round(50 * compact)}px`, gap: Math.round(34 * compact) } },
            createElement("div", { style: { display: "flex", width: "44%", justifyContent: "center", gap: Math.round(28 * compact) } },
                createElement("div", { style: { width: 10, borderRadius: 999, backgroundImage: STUDIO_THEME.gradient, flexShrink: 0 } }),
                createElement("div", { style: { display: "flex", flexDirection: "column", justifyContent: "center" } },
                    createElement("div", { style: { fontFamily: "Montserrat", fontSize: Math.round(44 * compact), fontWeight: 800, lineHeight: 1.06, color: "#1f2430", marginBottom: Math.round(18 * compact) } }, subtitle),
                    createElement("div", { style: { fontFamily: "Open Sans", fontSize: Math.round(22 * compact), lineHeight: 1.4, color: "#3f4652" } }, explanation),
                ),
            ),
            createElement("div", { style: { display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", border: "2px solid #d7dce5", borderRadius: 26, padding: Math.round(28 * compact), boxShadow: "0 18px 44px rgba(15,23,42,0.10)" } },
                createElement("div", { style: { display: "flex", height: Math.round(132 * compact), alignItems: "center", justifyContent: "center", marginBottom: Math.round(20 * compact) } },
                    createElement("div", { style: { display: "flex", width: Math.round(194 * compact), height: Math.round(126 * compact), border: "4px solid #8d9aaa", borderRadius: "50%", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fbff" } },
                        renderLineIcon("brain", Math.round(78 * compact), "#7f8a99"),
                    ),
                ),
                createElement("div", { style: { display: "flex", flexDirection: "column", gap: Math.round(13 * compact) } },
                    ...labels.map((row, labelIndex) => createElement("div", { key: `label-${labelIndex}`, style: { display: "flex", alignItems: "center", gap: 14, fontFamily: "Open Sans", fontWeight: 700, fontSize: Math.round(20 * compact), color: "#1f2430" } },
                        createElement("div", { style: { width: 13, height: 13, borderRadius: 999, backgroundImage: STUDIO_THEME.gradient } }),
                        createElement("div", null, `${row.term}${row.description ? ` (${row.description})` : ""}`),
                    )),
                ),
            ),
        ),
        createElement("div", { style: { display: "flex", height: Math.round(64 * compact), alignItems: "center", justifyContent: "center", borderTop: "2px solid #dce0e7", fontFamily: "Open Sans", fontSize: Math.round(18 * compact), letterSpacing: "0.16em", color: "#646a73", textTransform: "uppercase" } }, "Psychiatric Assessment Mastery"),
    )
}

function renderDarkNoteLayout(slide: StudioRenderableSlide, ratio: StudioRatio, spec: SlideLayoutSpec) {
    const compact = compactForSpec(spec, "DARK_NOTE")
    const bodyLines = getBodyLines(slide.body).slice(0, spec.maxBodyLines)

    return renderMinimalFrame(
        createElement(
            "div",
            {
                style: {
                    display: "flex",
                    flex: 1,
                    flexDirection: "column",
                    padding: `${spec.paddingY}px ${spec.paddingX}px`,
                },
            },
            createElement(
                "div",
                {
                    style: {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: spec.iconSize,
                        height: spec.iconSize,
                        borderRadius: 20,
                        backgroundColor: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        marginBottom: Math.round(38 * compact),
                        color: "#a78bfa",
                    },
                },
                renderLineIcon("sparkle", Math.round(spec.iconSize * 0.5), "#a78bfa"),
            ),
            createElement(
                "div",
                {
                    style: {
                        fontSize: spec.headlineSize,
                        fontFamily: "Montserrat",
                        fontWeight: 800,
                        color: "#ffffff",
                        lineHeight: 1.08,
                        marginBottom: Math.round(34 * compact),
                    },
                },
                slide.headline,
            ),
            createElement(
                "div",
                { style: { display: "flex", flexDirection: "column", gap: Math.round(16 * compact) } },
                ...bodyLines.map((line, i) =>
                    createElement(
                        "div",
                        {
                            key: `dark-note-${i}`,
                            style: {
                                padding: `${Math.round(20 * compact)}px ${Math.round(22 * compact)}px`,
                                borderRadius: 18,
                                border: "1px solid rgba(255,255,255,0.10)",
                                backgroundColor: "rgba(255,255,255,0.08)",
                                fontSize: spec.bodySize,
                                fontFamily: "Open Sans",
                                fontWeight: 600,
                                color: "rgba(255,255,255,0.78)",
                                lineHeight: 1.36,
                            },
                        },
                        line,
                    ),
                ),
            ),
        ),
    )
}

function makeSlideElement(slide: StudioRenderableSlide, brand: StudioRenderBrand, ratio: StudioRatio, index: number, totalSlides: number) {
    const frame = STUDIO_FRAME_DIMENSIONS[ratio]
    const normalizedSlide: StudioRenderableSlide = {
        ...slide,
        id: safeText(slide.id, `slide-${index + 1}`),
        kind: slide.kind ?? (index === totalSlides - 1 ? "CTA" : index === 0 ? "COVER" : "INSIGHT"),
        headline: safeText(slide.headline, index === 0 ? "Psychiatric Assessment Mastery" : "Clinical Assessment Point"),
        body: safeText(slide.body),
        stat: slide.stat ? {
            value: safeText(slide.stat.value),
            label: safeText(slide.stat.label),
        } : undefined,
        bg: slide.bg ?? (index === 0 || index === totalSlides - 1 ? "SLATE" : "WHITE"),
        assets: slide.assets,
    }
    slide = normalizedSlide
    const isLast = index === totalSlides - 1
    const dark = !(slide.bg === "WHITE")
    const eyebrow = eyebrowFor(slide, index, totalSlides, isLast)

    const layout = effectiveLayout(slide, index, totalSlides)
    const spec = getSlideLayoutSpec(layout, ratio)

    const headlineSize = spec.headlineSize
    const bodySize = spec.bodySize
    const iconSize = spec.iconSize
    const statSize = spec.statSize
    const labelSize = spec.labelSize

    const isVertical = ratio === "9:16"
    const isPortrait = ratio === "4:5"
    const fontScale = spec.headlineSize / (slide.kind === "CTA" ? 64 : 72)
    const ctaSize = headlineSize

    const overlayBackground = getOverlay(slide.kind, slide.bg)
    const baseBackground = getBaseBackground(slide.kind, slide.bg)

    const showBook = !!(brand.bookDataUrl && (slide.assets?.book || slide.kind === "CTA" || slide.kind === "COVER"))
    const heroStat = slide.stat?.value
    const heroLabel = slide.stat?.label
    const headline = slide.headline
    const bodyText = slide.body

    const useGradientStat = !!heroStat && slide.bg !== "WHITE"

    if (layout === "HERO_ICON" && slide.kind !== "CTA") {
        return createElement("div", { style: { width: frame.width, height: frame.height, display: "flex", position: "relative", overflow: "hidden", fontFamily: "Open Sans" } }, renderHeroIconLayout(slide, brand, ratio, spec))
    }

    if (layout === "FEATURE_CARDS") {
        return createElement("div", { style: { width: frame.width, height: frame.height, display: "flex", position: "relative", overflow: "hidden", fontFamily: "Open Sans" } }, renderFeatureCardsLayout(slide, ratio, spec))
    }

    if (layout === "TITLE_CARD") {
        return createElement("div", { style: { width: frame.width, height: frame.height, display: "flex", position: "relative", overflow: "hidden", fontFamily: "Open Sans" } }, renderTitleCardLayout(slide, ratio, spec))
    }

    if (layout === "TAXONOMY_LIST") {
        return createElement("div", { style: { width: frame.width, height: frame.height, display: "flex", position: "relative", overflow: "hidden", fontFamily: "Open Sans" } }, renderTaxonomyListLayout(slide, ratio, spec))
    }

    if (layout === "SCIENCE_SPLIT") {
        return createElement("div", { style: { width: frame.width, height: frame.height, display: "flex", position: "relative", overflow: "hidden", fontFamily: "Open Sans" } }, renderScienceSplitLayout(slide, ratio, index, spec))
    }

    if (layout === "DARK_NOTE") {
        return createElement("div", { style: { width: frame.width, height: frame.height, display: "flex", position: "relative", overflow: "hidden", fontFamily: "Open Sans" } }, renderDarkNoteLayout(slide, ratio, spec))
    }

    const main = (() => {
        if (slide.kind === "CTA") {
            return createElement(
                "div",
                {
                    style: {
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        position: "relative",
                        zIndex: 2,
                        justifyContent: "center",
                        alignItems: "center",
                        textAlign: "center",
                        gap: 16,
                    },
                },
                showBook ? renderBookFloating(brand.bookDataUrl ?? null, "centered", isVertical ? 1.1 : 0.86) : null,
                createElement(
                    "div",
                    {
                        style: {
                            fontSize: ctaSize,
                            fontFamily: "Montserrat",
                            fontWeight: 800,
                            color: "#ffffff",
                            textAlign: "center",
                            maxWidth: isVertical ? "82%" : "88%",
                            lineHeight: 1.1,
                        },
                    },
                    headline,
                ),
                bodyText
                    ? createElement(
                        "div",
                        {
                            style: {
                                fontSize: Math.round(22 * fontScale),
                                fontFamily: "Open Sans",
                                color: "rgba(255,255,255,0.55)",
                                marginTop: 8,
                                maxWidth: isVertical ? "72%" : "82%",
                                textAlign: "center",
                                lineHeight: 1.4,
                            },
                        },
                        bodyText,
                    )
                    : null,
                renderCtaChip(brand.siteUrl),
            )
        }

        if (slide.kind === "QUOTE") {
            return createElement(
                "div",
                {
                    style: {
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        position: "relative",
                        zIndex: 2,
                        justifyContent: "center",
                        alignItems: "center",
                        textAlign: "center",
                    },
                },
                createElement(
                    "div",
                    {
                        style: {
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: Math.round(104 * fontScale),
                            height: Math.round(104 * fontScale),
                            borderRadius: 999,
                            backgroundColor: dark ? "rgba(255,255,255,0.08)" : "#f8fafc",
                            border: dark ? "1px solid rgba(255,255,255,0.10)" : "1px solid #e2e8f0",
                            color: dark ? "rgba(255,255,255,0.72)" : "transparent",
                            backgroundImage: dark ? undefined : STUDIO_THEME.gradient,
                            backgroundClip: dark ? undefined : "text",
                            WebkitBackgroundClip: dark ? undefined : "text",
                            fontSize: Math.round(66 * fontScale),
                            fontFamily: "Montserrat",
                            fontWeight: 800,
                            marginBottom: Math.round(30 * fontScale),
                        },
                    },
                    "“",
                ),
                createElement(
                    "div",
                    {
                        style: {
                            fontSize: Math.round(60 * fontScale),
                            fontFamily: "Montserrat",
                            fontWeight: 800,
                            color: dark ? "#ffffff" : STUDIO_THEME.navy,
                            lineHeight: 1.08,
                            maxWidth: "86%",
                        },
                    },
                    headline,
                ),
                bodyText
                    ? createElement(
                        "div",
                        {
                            style: {
                                fontSize: Math.round(27 * fontScale),
                                lineHeight: 1.45,
                                color: dark ? "rgba(255,255,255,0.62)" : "#64748b",
                                fontFamily: "Open Sans",
                                maxWidth: "78%",
                                marginTop: 34,
                            },
                        },
                        bodyText,
                    )
                    : null,
            )
        }

        if (isChecklistBody(bodyText) && slide.bg === "WHITE") {
            return createElement(
                "div",
                {
                    style: {
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        position: "relative",
                        zIndex: 2,
                        justifyContent: "center",
                    },
                },
                createElement(
                    "div",
                    {
                        style: {
                            fontSize: Math.round(66 * fontScale),
                            fontFamily: "Montserrat",
                            fontWeight: 800,
                            color: STUDIO_THEME.navy,
                            lineHeight: 1.05,
                            maxWidth: "92%",
                        },
                    },
                    headline,
                ),
                renderChecklistBody(bodyText),
            )
        }

        if (slide.kind === "INSIGHT" && slide.bg === "WHITE") {
            return createElement(
                "div",
                {
                    style: {
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        position: "relative",
                        zIndex: 2,
                        justifyContent: "center",
                        gap: 12,
                    },
                },
                createElement("div", {
                    style: {
                        width: 64,
                        height: 8,
                        borderRadius: 999,
                        backgroundImage: STUDIO_THEME.gradient,
                        marginBottom: 20,
                    },
                }),
                createElement(
                    "div",
                    {
                        style: {
                            fontSize: headlineSize,
                            fontFamily: "Montserrat",
                            fontWeight: 800,
                            color: STUDIO_THEME.navy,
                            lineHeight: 1.05,
                            maxWidth: "92%",
                        },
                    },
                    headline,
                ),
                renderInsightBody(bodyText, false),
            )
        }

        return createElement(
            "div",
            {
                style: {
                    display: "flex",
                    flex: 1,
                    flexDirection: showBook ? "row" : "column",
                    position: "relative",
                    zIndex: 2,
                    alignItems: showBook ? "center" : "flex-start",
                    justifyContent: "space-between",
                    gap: 28,
                    paddingTop: 28,
                },
            },
            createElement(
                "div",
                {
                    style: {
                        display: "flex",
                        flexDirection: "column",
                        maxWidth: showBook ? "62%" : "100%",
                        justifyContent: "center",
                    },
                },
                heroStat
                    ? (useGradientStat
                        ? renderGradientStat(heroStat, statSize)
                        : createElement(
                            "div",
                            {
                                style: {
                                    fontSize: statSize,
                                    lineHeight: 1,
                                    fontFamily: "Montserrat",
                                    fontWeight: 800,
                                    color: "#ffffff",
                                    marginBottom: 12,
                                },
                            },
                            heroStat,
                        ))
                    : null,
                heroLabel
                    ? createElement(
                        "div",
                        {
                            style: {
                                fontSize: labelSize,
                                lineHeight: 1.35,
                                marginBottom: 24,
                                color: dark ? "rgba(255,255,255,0.72)" : "#475569",
                                fontFamily: "Open Sans",
                                maxWidth: "85%",
                            },
                        },
                        heroLabel,
                    )
                    : null,
                createElement(
                    "div",
                    {
                        style: {
                            fontSize: headlineSize,
                            lineHeight: 1.05,
                            fontFamily: "Montserrat",
                            fontWeight: 800,
                            color: dark ? "#ffffff" : STUDIO_THEME.navy,
                            marginBottom: 18,
                        },
                    },
                    headline,
                ),
                slide.kind === "INSIGHT" && getBodyLines(bodyText).length > 1
                    ? renderInsightBody(bodyText, dark)
                    : bodyText
                    ? createElement(
                        "div",
                        {
                            style: {
                                fontSize: Math.round(26 * fontScale),
                                lineHeight: 1.45,
                                color: dark ? "rgba(255,255,255,0.78)" : "#475569",
                                fontFamily: "Open Sans",
                                whiteSpace: "pre-wrap",
                                maxWidth: "90%",
                            },
                        },
                        bodyText,
                    )
                    : null,
            ),
            showBook ? renderBookFloating(brand.bookDataUrl ?? null, "cover", isVertical ? 1.15 : 1) : null,
        )
    })()

    return createElement(
        "div",
        {
            style: {
                width: frame.width,
                height: frame.height,
                display: "flex",
                position: "relative",
                overflow: "hidden",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: isVertical ? 72 : 64,
                fontFamily: "Open Sans",
                color: dark ? "#ffffff" : STUDIO_THEME.navy,
                ...baseBackground,
            },
        },
        createElement("div", {
            style: {
                position: "absolute",
                inset: 0,
                backgroundImage: overlayBackground,
            },
        }),
        renderTopBar(slide, brand, dark, eyebrow),
        main,
        renderFooter(brand.siteUrl, footerCue(index), dark),
    )
}

export function getStudioFrameSize(ratio: StudioRatio) {
    return STUDIO_RATIO_DIMENSIONS[ratio]
}

/**
 * Normalize either the legacy single-logo brand or the dual-logo brand to the
 * shape the renderer needs internally. Keeps existing callers working.
 */
function normalizeBrand(input: StudioRenderBrand | StudioRenderBrandLegacy): StudioRenderBrand {
    if ("logoColorDataUrl" in input || "logoWhiteDataUrl" in input) {
        return input as StudioRenderBrand
    }
    const legacy = input as StudioRenderBrandLegacy
    return {
        brandName: legacy.brandName,
        siteUrl: legacy.siteUrl,
        logoColorDataUrl: legacy.logoDataUrl ?? null,
        logoWhiteDataUrl: legacy.logoDataUrl ?? null,
        bookDataUrl: legacy.bookDataUrl ?? null,
        palette: legacy.palette,
    }
}

export async function renderStudioSlideToPng(
    slide: StudioRenderableSlide,
    brand: StudioRenderBrand | StudioRenderBrandLegacy,
    ratio: StudioRatio,
    index: number,
    totalSlides: number,
) {
    const normalizedBrand = normalizeBrand(brand)
    const frame = getStudioFrameSize(ratio)
    const fonts = await getFonts()
    const element = sanitizeSatoriNode(makeSlideElement(slide, normalizedBrand, ratio, index, totalSlides)) as ReactElement
    const svg = await satori(element, {
        width: frame.width,
        height: frame.height,
        fonts: [
            { name: STUDIO_TYPOGRAPHY.headingFamily, data: fonts.heading, weight: 800, style: "normal" },
            { name: STUDIO_TYPOGRAPHY.bodyFamily, data: fonts.body, weight: 400, style: "normal" },
            { name: STUDIO_TYPOGRAPHY.bodyFamily, data: fonts.bodyBold, weight: 700, style: "normal" },
        ],
    })

    const Resvg = getResvg()
    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: frame.width } })
    return Buffer.from(resvg.render().asPng())
}
