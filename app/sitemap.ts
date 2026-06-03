import { MetadataRoute } from 'next'
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://www.campuslink.co.ke', lastModified: new Date(), priority: 1 },
    { url: 'https://www.campuslink.co.ke/register', lastModified: new Date(), priority: 0.9 },
    { url: 'https://www.campuslink.co.ke/login', lastModified: new Date(), priority: 0.7 },
  ]
}
