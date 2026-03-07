import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
