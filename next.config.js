/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    compress: true,
    images: {
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200],
        imageSizes: [16, 32, 48, 64, 96],
    },
    experimental: {
        optimizePackageImports: ['lucide-react', 'recharts'],
        serverActions: {
            bodySizeLimit: '10mb'
        }
    },
    transpilePackages: ['@signpdf/signpdf', '@signpdf/signer-p12', '@signpdf/placeholder-pdf-lib', 'pdf-lib'],
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin'
                    },
                    {
                        key: 'Access-Control-Allow-Credentials',
                        value: 'true'
                    },
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: 'https://www.kesefly.co.il' // Production Domain Only
                    },
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: 'GET,DELETE,PATCH,POST,PUT'
                    },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.budget-manager-plus.com https://clerk.kesefly.co.il https://*.clerk.accounts.dev https://va.vercel-scripts.com https://www.paypal.com https://www.sandbox.paypal.com https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' blob: data: https://img.clerk.com https://images.clerk.dev https://clerk.kesefly.co.il https://www.paypalobjects.com https://www.googletagmanager.com https://www.google-analytics.com; worker-src 'self' blob:; child-src 'self' blob:; connect-src 'self' https://clerk.budget-manager-plus.com https://clerk.kesefly.co.il https://*.clerk.accounts.dev https://*.vercel-scripts.com https://www.paypal.com https://www.sandbox.paypal.com https://ipapi.co https://api.bigdatacloud.net https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com; frame-src 'self' https://www.paypal.com https://www.sandbox.paypal.com;"
                    }
                ]
            }
        ]
    }
}

module.exports = nextConfig
