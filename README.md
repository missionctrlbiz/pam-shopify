# Psychiatric Assessment Mastery (PAM)

## AI-Powered Content Engine for Nursing Education

A full-stack platform combining a clinical learning product with a headless AI content production pipeline. Students get AI tools to master psychiatric documentation; admins get a full 30-day content calendar with automated rendering to carousels and video.

---

## Architecture Overview

```
Next.js (Vercel)
├── Public storefront — Shopify Storefront API, lead capture, AI tools
├── Admin UI — /admin, /admin/production content calendar
└── API Routes — Gemini generation, Cloud Tasks dispatch, Shopify webhooks

GCP Infrastructure
├── Cloud Run — carousel-renderer, repurpose-worker, video-renderer
├── Cloud Tasks — pam-render-queue (us-central1)
├── Artifact Registry — pam-workers (Docker images)
└── Secret Manager — API keys + callback secrets

Storage
├── Vercel Blob — rendered PNG/MP4 assets
└── Prisma Postgres — content calendar, leads, buyers, job status
```

---

## Product Tiers

| Tier              | Price  | Includes                             |
| ----------------- | ------ | ------------------------------------ |
| Digital Edition   | $9.99  | PDF/eBook                            |
| Physical Workbook | $29.99 | Printed workbook                     |
| Mastery Bundle    | $49.99 | Physical + Digital + 1-Year AI Tools |

---

## AI Tools (Buyer-Only)

- **Script Doctor** — format and correct clinical notes via Gemini
- **SOAP Architect** — generate full SOAP notes from clinical scenarios

---

## Admin Production Pipeline

1. **Generate** — Gemini drafts a 30-day content calendar (one entry per platform per day)
2. **Quality Gate** — admin reviews, edits, and approves each entry
3. **Render** — approved entries dispatched via Cloud Tasks to Cloud Run workers:
   - `carousel-renderer` — Puppeteer → 6 PNG slides
   - `repurpose-worker` — adapt content for each platform format
   - `video-renderer` — Remotion + ElevenLabs TTS → MP4
4. **Publish** — assets stored in Vercel Blob, status updated in DB

---

## Tech Stack

| Layer       | Technology                                           |
| ----------- | ---------------------------------------------------- |
| Frontend    | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 |
| Auth        | NextAuth v5 + Prisma adapter                         |
| AI          | Google Gemini 1.5 Pro                                |
| Commerce    | Shopify Storefront API (headless)                    |
| Video       | Remotion + ElevenLabs TTS                            |
| Screenshots | Puppeteer (Chromium)                                 |
| Workers     | Node.js / Express on Cloud Run                       |
| Queue       | Google Cloud Tasks                                   |
| Images      | Artifact Registry (Docker)                           |
| Secrets     | Google Secret Manager                                |
| Database    | Prisma + Postgres (Prisma Data Platform)             |
| Storage     | Vercel Blob                                          |
| Hosting     | Vercel (Next.js) + GCP (workers)                     |

---

## Local Development

### Prerequisites

- Node.js 20+
- GCP project with APIs enabled (see below)
- Shopify store with Storefront API access

### Setup

```bash
git clone https://github.com/missionctrlbiz/pam-shopify.git
cd pam-shopify
npm install
```

Copy `.env` and fill in all values (see **Environment Variables** below), then:

```bash
npx prisma db push        # apply schema to Postgres
npx prisma db seed        # optional: seed site content
npm run dev
```

---

## Environment Variables

```env
# Database
DATABASE_URL=
POSTGRES_URL=
PRISMA_DATABASE_URL=

# Auth
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=

# Shopify
SHOPIFY_STORE_DOMAIN=
SHOPIFY_STOREFRONT_ACCESS_TOKEN=

# AI
GEMINI_API_KEY=

# Vercel Blob
BLOB_READ_WRITE_TOKEN=

# GCP
GCP_PROJECT_ID=psych-mastery-production
GCP_LOCATION=us-central1
CLOUD_TASKS_QUEUE=pam-render-queue
WORKER_SA_EMAIL=pam-worker-sa@psych-mastery-production.iam.gserviceaccount.com
RENDER_CALLBACK_SECRET=

# Cloud Run Worker URLs
CAROUSEL_RENDERER_URL=https://carousel-renderer-1030441621671.us-central1.run.app
REPURPOSE_WORKER_URL=https://repurpose-worker-1030441621671.us-central1.run.app
VIDEO_RENDERER_URL=https://video-renderer-1030441621671.us-central1.run.app

# ElevenLabs
ELEVENLABS_API_KEY=
```

---

## GCP Infrastructure

All resources are in project `psych-mastery-production`, region `us-central1`.

| Resource          | Name                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------- |
| Cloud Run         | carousel-renderer, repurpose-worker, video-renderer                                           |
| Cloud Tasks queue | pam-render-queue                                                                              |
| Artifact Registry | pam-workers                                                                                   |
| Service account   | pam-worker-sa                                                                                 |
| Secrets           | pam-gemini-api-key, pam-vercel-blob-token, pam-elevenlabs-api-key, pam-render-callback-secret |

### Rebuild & Redeploy a Worker

```powershell
$GCLOUD = "...\gcloud.cmd"
& $GCLOUD builds submit workers/carousel-renderer \
  --tag=us-central1-docker.pkg.dev/psych-mastery-production/pam-workers/carousel-renderer:latest \
  --project=psych-mastery-production

& $GCLOUD run deploy carousel-renderer \
  --image=us-central1-docker.pkg.dev/psych-mastery-production/pam-workers/carousel-renderer:latest \
  --region=us-central1 --project=psych-mastery-production
```

---

## Deployment

The Next.js app is deployed to Vercel (`biibiis-projects/pam-shopify`). Every push to `main` triggers an automatic deployment. To deploy manually:

```bash
vercel --prod
```

All 10 environment variables are configured across Production, Preview, and Development environments in the Vercel dashboard.

---

## License

Proprietary — All rights reserved.

---

## Author

**MissionCTRL Labs** · [missionctrl.com.ng](https://missionctrl.com.ng)

## AI-Powered Clinical Tools for Nursing Students

A comprehensive learning platform that combines a professional workbook with advanced AI tools to help nursing and psychiatric students master clinical documentation, SOAP notes, and psychiatric assessments.

---

## 🎯 What This Platform Offers

### 📚 **The Workbook**

Professional psychiatric assessment guide available in three formats:

- **Digital Edition** ($9.99) - PDF/eBook for on-the-go studying
- **Physical Workbook** ($29.99) - High-quality paperback with write-in templates
- **Mastery Bundle** ($49.99) - Physical + Digital + 1-Year AI Clinical Tools

### 🤖 **AI Clinical Tools**

Powered by Google Gemini Pro 1.5, students get access to:

1. **Script Doctor** 🎯
   - Upload handwritten or typed clinical notes
   - Get instant professional formatting corrections
   - Learn proper clinical documentation standards
   - Perfect for practicing nurses and students

2. **SOAP Architect** 📋
   - Interactive clinical scenario builder
   - Generates professional SOAP notes
   - Customizable by diagnosis, assessment type, and complexity
   - Includes teaching explanations for each section

---

## 🛠 Technical Stack

### Frontend

- **Next.js 15** (App Router) - Modern React framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Lucide Icons** - Beautiful icon set

### Commerce & Backend

- **Shopify Storefront API** - Headless e-commerce
- **Google Gemini Pro 1.5** - AI-powered clinical tools
- **Vercel** - Edge deployment and hosting

### Key Features

- 🌓 Dark/Light mode support
- 📱 Fully responsive design
- ⚡ Server-side rendering for SEO
- 🔒 Secure checkout via Shopify
- 🎨 Modern, professional UI/UX

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Shopify store with Storefront API access
- Google Gemini API key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/missionctrlbiz/pam-shopify.git
cd pam-shopify
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file with your credentials:

```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_token
GEMINI_API_KEY=your_gemini_api_key
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

---

## 📦 Deployment

### Deploying to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push to main

### Environment Variables Required

- `SHOPIFY_STORE_DOMAIN` - Your Shopify store domain
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN` - Storefront API token
- `GEMINI_API_KEY` - Google Gemini API key

---

## 🎓 Use Cases

### For Students

- Practice clinical documentation
- Learn proper SOAP note structure
- Get instant feedback on assessments
- Study on mobile or desktop

### For Instructors

- Demonstrate proper documentation
- Generate teaching examples
- Show real-world scenarios
- Assess student work quality

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 👨‍💻 Author

**MissionCTRL Labs**

- Website: [missionctrl.com.ng](https://missionctrl.com.ng)
- GitHub: [@missionctrlbiz](https://github.com/missionctrlbiz)

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Commerce powered by [Shopify](https://www.shopify.com/)
- AI powered by [Google Gemini](https://deepmind.google/technologies/gemini/)
- Icons by [Lucide](https://lucide.dev/)
