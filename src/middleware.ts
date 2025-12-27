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

    // Check maintenance mode from environment variable
    // Note: We removed the dynamic DB check via fetch because it causes instability in Vercel Edge Runtime (fetch failures)
    // To enable maintenance mode, set MAINTENANCE_MODE=true in Vercel Environment Variables.
    const isMaintenance = process.env.MAINTENANCE_MODE === 'true';

    if (isMaintenance) {
        // Allow admins to bypass maintenance mode for ALL routes if we could check it,
        // but since we removed the fetch, we can only rely on the path or maybe a cookie?
        // For now, simple logic: All users blocked if Env Var is true.
        // Or maybe check if path starts with /admin to allow access to admin panel at least?
        if (pathname.startsWith('/admin') || pathname.startsWith('/sign-in')) {
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
