# ──────────────────────────────────────────────────────────────────────────────
# Stage 1 — Builder
#   Installs all dependencies (including devDeps), compiles the Express server
#   TypeScript, and bundles the Remotion composition with Webpack.
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20 AS builder

RUN apt-get update && apt-get install -y \
    chromium \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

# Install ALL dependencies (dev included — needed for tsc + remotion bundle)
COPY package*.json ./
RUN npm install

# Copy source
COPY tsconfig.json ./
COPY src/ ./src/
COPY remotion-src/ ./remotion-src/

# 1. Compile Express server TypeScript → dist/
RUN npm run build

# 2. Bundle Remotion composition → dist/bundle/
#    This runs Remotion's Webpack bundler and produces a static site
#    that @remotion/renderer's Chrome instance can serve locally.
RUN ./node_modules/.bin/remotion bundle remotion-src/index.tsx dist/bundle

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2 — Runtime
#   Lean production image — only production dependencies + pre-built artifacts.
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20 AS runtime

# Install system ffmpeg (required by Remotion's renderMedia codec pipeline)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    chromium \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# Tell Remotion's bundled Chrome where to find Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled server + Remotion bundle from builder
COPY --from=builder /app/dist ./dist

# The Remotion bundle is embedded in the image — no REMOTION_BUNDLE_URL needed
# unless you want to override with a remote URL for zero-downtime hot-swaps.
ENV REMOTION_BUNDLE_PATH=/app/dist/bundle

EXPOSE 8080
CMD ["node", "dist/index.js"]
