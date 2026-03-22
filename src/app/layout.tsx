import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import { Toaster } from "sonner";
import { getThemeForRequest } from "@/lib/account-preferences";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "https://plan2026-pi.vercel.app"),
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
      </body>
    </html>
  );
}
