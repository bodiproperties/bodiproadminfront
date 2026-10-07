import type { MetadataRoute } from "next";

// Admin панелийг хайлтын системд огт индекслүүлэхгүй
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}