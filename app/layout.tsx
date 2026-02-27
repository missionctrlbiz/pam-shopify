import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Psychiatric Assessment Mastery | Tonia Ojomo",
  description: "The practical, step-by-step clinical companion for PMHNP students and new graduates. Simple English. Zero fluff.",
  icons: {
    icon: [
      { url: "/favicon.webp?v=2", type: "image/webp" },
      { url: "/favicon.webp?v=2" },
    ],
    shortcut: ["/favicon.webp?v=2"],
    apple: "/favicon.webp?v=2",
  },
  openGraph: {
    title: "Psychiatric Assessment Mastery | Tonia Ojomo",
    description: "The practical, step-by-step clinical companion for PMHNP students and new graduates.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
