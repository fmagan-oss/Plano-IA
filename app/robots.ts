import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://catpilot.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Keep the authenticated app and API out of the index.
      disallow: ['/app', '/compte', '/login', '/presentations', '/api/', '/auth/'],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
