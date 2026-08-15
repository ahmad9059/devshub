import type { MetadataRoute } from "next";

const APP_URL = process.env.AUTH_URL ?? "http://localhost:3001";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/settings",
          "/onboarding",
          "/submit",
          "/create-community",
          "/api/",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
