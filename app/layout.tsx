import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
	title: "Psychiatric Assessment Mastery",
	description: "Production dashboard and content generation for Psychiatric Assessment Mastery.",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	)
}
