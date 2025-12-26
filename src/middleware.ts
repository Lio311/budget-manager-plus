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

    // If not enabled via ENV, check the DB via API route
    if (!isMaintenance) {
        try {
            // Internal fetch to status API
            const res = await fetch(new URL('/api/maintenance/status', req.url));
            if (res.ok) {
                const data = await res.json();
                isMaintenance = data.enabled;
            }
        } catch (error) {
            console.error('Middleware maintenance check failed:', error);
        }
    }

    if (isMaintenance) {
        // Get user info to check if admin
        const { userId, sessionClaims } = await auth();

        // Allow admins to bypass maintenance mode
        // We check sessionClaims for role if available, or just allow /admin prefix for now
        if (userId && (pathname.startsWith('/admin') || (sessionClaims?.metadata as any)?.role === 'admin')) {
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
