import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/dashboard/', '/api/', '/admin/'],
            },
        ],
        sitemap: 'https://keseflow.vercel.app/sitemap.xml',
    }
}
