import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/subscribe(.*)',
    '/api/webhooks(.*)',
    '/maintenance',
    '/api/maintenance(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
    const { pathname } = req.nextUrl;

    // Skip maintenance check for maintenance page and status API
    if (pathname === '/maintenance' || pathname.startsWith('/api/maintenance')) {
        return;
    }

    // Check maintenance mode from environment variable (emergency override)
    let isMaintenance = process.env.MAINTENANCE_MODE === 'true';
    let isAdmin = false;

    // If not enabled via ENV, check the DB via API route
    if (!isMaintenance) {
        try {
            const { userId } = await auth();
            const statusUrl = new URL('/api/maintenance/status', req.url);
            if (userId) {
                statusUrl.searchParams.set('userId', userId);
            }

            // Internal fetch to status API
            const res = await fetch(statusUrl);
            if (res.ok) {
                const data = await res.json();
                isMaintenance = data.enabled;
                isAdmin = data.isAdmin;
            }
        } catch (error) {
            console.error('Middleware maintenance check failed:', error);
        }
    }

    if (isMaintenance) {
        // Allow admins to bypass maintenance mode for ALL routes
        if (isAdmin || pathname.startsWith('/admin')) {
            return;
        }

        // Redirect all other users to maintenance page
        return NextResponse.redirect(new URL('/maintenance', req.url));
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
