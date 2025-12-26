import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';
const ADMIN_EMAILS = ['lior31197@gmail.com', 'ron.kor97@gmail.com']

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

        // Check if admin by role metadata or by email (if available in claims)
        const isAdmin =
            (sessionClaims?.metadata as any)?.role === 'admin' ||
            ADMIN_EMAILS.includes((sessionClaims as any)?.email?.toLowerCase() || "");

        // Allow admins to bypass maintenance mode for ALL routes
        if (userId && (pathname.startsWith('/admin') || isAdmin)) {
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
