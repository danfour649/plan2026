import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXTAUTH_URL ?? "https://plan2026.ca";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/tasks", "/plans", "/settings"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
