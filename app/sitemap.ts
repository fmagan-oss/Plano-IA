import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://catpilot.app';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/#offres`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/login`, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
