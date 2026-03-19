import type { Metadata } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { CookieBanner } from "@/components/CookieBanner";
import { Analytics } from "@vercel/analytics/next";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: "Psychiatric Assessment Mastery | Clinical Workbook for Nursing & PMHNP Students",
  description: "The step-by-step psychiatric assessment workbook for nursing students, PMHNP students, and mental health nurses. Master clinical rotations, SOAP notes, MSE documentation, and differential diagnosis. Simple English. ESL friendly. Zero fluff.",
  keywords: [
    "Psychiatric Assessment",
    "Nursing",
    "Mental Health Nursing",
    "PMHNP Student",
    "Clinical Rotations",
    "SOAP Notes",
    "Mental Status Exam",
    "Psychiatric Nursing",
    "PMHNP Study Guide",
    "Nurse Practitioner",
    "Psych NP",
    "Psychiatric Assessment Mastery",
    "SOAP Architect",
    "clinical documentation",
    "nursing student workbook",
    "psychiatric nurse practitioner",
    "psych rotation",
    "psych NP certification",
    "psychiatric clinical companion",
    "mental health documentation",
    "suicidal ideation assessment",
    "MSE cheat sheet",
    "nursing education",
    "ESL nursing",
    "PMHNP prep",
  ],
  icons: {
    icon: [
      { url: "/favicon.webp?v=2", type: "image/webp" },
      { url: "/favicon.webp?v=2" },
    ],
    shortcut: ["/favicon.webp?v=2"],
    apple: "/favicon.webp?v=2",
  },
  openGraph: {
    title: "Psychiatric Assessment Mastery | Clinical Workbook for Nursing & PMHNP Students",
    description: "Master psychiatric clinical rotations with the step-by-step workbook for nursing students, PMHNP students, and mental health nurses. SOAP notes, MSE, and differential diagnosis made simple.",
    images: ["/logo.webp"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Psychiatric Assessment Mastery | Nursing & PMHNP Clinical Workbook",
    description: "Master psychiatric assessments, SOAP notes, and clinical documentation. Built for nursing students, PMHNP students, and mental health nurses.",
    images: ["/logo.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${openSans.variable} antialiased bg-slate-50 text-slate-900 font-sans`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
          <CookieBanner />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
