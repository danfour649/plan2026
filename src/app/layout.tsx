import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { getThemeForRequest } from "@/lib/account-preferences";
import { CANONICAL_ORIGIN } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  // Always the public production origin — never preview/deployment hosts.
  metadataBase: new URL(CANONICAL_ORIGIN),
  icons: {
    icon: [
      { url: "/pwa-192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Plan 2026",
    statusBarStyle: "default",
  },
  title: {
    default: "Plan 2026",
    template: "%s | Plan 2026",
  },
  description:
    "Plan 2026 is a task and plan planner with Google sign-in. Manage tasks, set urgency and due dates, group work in plans, and export to Google Calendar.",
  openGraph: {
    title: "Plan 2026 – Task and plan planner",
    description:
      "Manage tasks and plans with Google sign-in. Set urgency, due dates, and export to Google Calendar.",
    type: "website",
    url: CANONICAL_ORIGIN,
    siteName: "Plan 2026",
  },
  twitter: {
    card: "summary_large_image",
    title: "Plan 2026 – Task and plan planner",
    description:
      "Manage tasks and plans with Google sign-in. Set urgency, due dates, and export to Google Calendar.",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "_m33wLoUYxmnUvb5DRNQkaCfTXpY-EhpVz1P_wVXiBU",
  },
};

function RootLayoutFallback() {
  return (
    <div
      className="theme-root min-h-screen animate-pulse bg-zinc-100 dark:bg-zinc-900"
      aria-hidden
    />
  );
}

async function RootLayoutBody({ children }: Readonly<{ children: ReactNode }>) {
  const theme = await getThemeForRequest();
  const themeClass = theme === "dark" ? "dark" : theme === "light" ? "theme-light" : "";
  return (
    <>
      <div className={`theme-root min-h-screen ${themeClass}`.trim()}>{children}</div>
      <Toaster richColors position="top-center" />
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense fallback={<RootLayoutFallback />}>
          <RootLayoutBody>{children}</RootLayoutBody>
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
