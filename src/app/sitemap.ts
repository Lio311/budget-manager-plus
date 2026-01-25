import { MetadataRoute } from 'next'

// 1. Base URL
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.kesefly.co.il'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // 2. Static Routes
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 1,
        },
    ]

    return staticRoutes
}
