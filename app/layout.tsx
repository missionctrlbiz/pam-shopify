import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Psychiatric Assessment Mastery",
  description:
    "Psychiatric Assessment Mastery supports clinical learning, documentation practice, and internal content operations.",
  icons: {
    icon: [{ url: "/favicon.webp", type: "image/webp" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
