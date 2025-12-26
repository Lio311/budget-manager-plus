import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { get } from '@vercel/edge-config';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/subscribe(.*)',
    '/api/webhooks(.*)',
    '/maintenance'
]);

export default clerkMiddleware(async (auth, req) => {
    const { pathname } = req.nextUrl;

    // Skip maintenance check for maintenance page itself
    if (pathname === '/maintenance') {
        return;
    }

    // Check maintenance mode from Edge Config
    try {
        const maintenanceMode = await get('maintenanceMode');

        if (maintenanceMode === true) {
            // Get user info to check if admin
            const { userId } = await auth();

            // Allow admins to bypass maintenance mode
            if (userId) {
                // Note: We can't easily check admin role here without Prisma
                // So we'll allow all authenticated users to access /admin
                if (pathname.startsWith('/admin')) {
                    // Let admin routes through
                    return;
                }
            }

            // Redirect all other users to maintenance page
            return NextResponse.redirect(new URL('/maintenance', req.url));
        }
    } catch (error) {
        // If Edge Config is not configured, continue normally
        console.error('Edge Config error:', error);
    }

    // Allow public routes
    if (isPublicRoute(req)) {
        return
    }

    // Require authentication for all other routes
    await auth.protect();
});

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
