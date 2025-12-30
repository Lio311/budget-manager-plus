import { MetadataRoute } from 'next'

// 1. Base URL
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://keseflow.vercel.app'

/**
 * Simulate fetching dynamic data from a database
 * In a real application, you would import your Prisma client here
 * and fetch actual IDs (e.g., invoices, blog posts, public profiles).
 */
async function getDynamicItems() {
    // Example: const products = await prisma.product.findMany({ select: { id: true, updatedAt: true } })
    // return products

    // Returning simulated gathered IDs for demonstration
    return Array.from({ length: 10 }).map((_, i) => ({
        id: `item-${i + 1}`,
        updatedAt: new Date()
    }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // 2. Static Routes
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 1,
        },
        {
            url: `${BASE_URL}/sign-in`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/sign-up`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ]

    // 3. Dynamic Routes Generation
    const items = await getDynamicItems()

    // Map the items to the sitemap format
    const dynamicRoutes: MetadataRoute.Sitemap = items.map((item) => ({
        url: `${BASE_URL}/product/${item.id}`, // Example: /product/item-1
        lastModified: item.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.6,
    }))

    return [...staticRoutes, ...dynamicRoutes]
}
