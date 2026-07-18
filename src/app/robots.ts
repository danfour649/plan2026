import type { MetadataRoute } from "next";

import { CANONICAL_ORIGIN } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/tasks",
          "/plans",
          "/settings",
          "/actions",
          "/help",
          "/about",
          "/supplies",
          "/invite",
          "/share",
        ],
      },
    ],
    sitemap: `${CANONICAL_ORIGIN}/sitemap.xml`,
    host: "plan2026.ca",
  };
}
