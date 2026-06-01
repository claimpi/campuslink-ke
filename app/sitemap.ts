import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://www.campuslink.co.ke', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: 'https://www.campuslink.co.ke/discover', lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: 'https://www.campuslink.co.ke/register', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://www.campuslink.co.ke/login', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://www.campuslink.co.ke/pricing', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
  ]
}
