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

    // Check maintenance mode from environment variable AND database via API
    // We use fetch with a timeout to prevent blocking the edge function for too long
    let isMaintenance = process.env.MAINTENANCE_MODE === 'true';
    let isAdmin = false;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 800); // 800ms timeout

        // We must reach out to the full URL because this is running on the server/edge
        const maintenanceUrl = new URL('/api/maintenance/status', req.url);

        // Pass userId if available so the API can check admin status
        if (auth.userId) {
            maintenanceUrl.searchParams.set('userId', auth.userId);
        }

        // Pass the user ID cookie if available to check admin status
        // Note: We can't easily access the full auth session in middleware without expensive calls,
        // so we might need to rely on the API to verify the user from the request headers/cookies forward
        // However, standard fetch from middleware might not forward cookies automatically.
        // Let's try to forward headers.

        const response = await fetch(maintenanceUrl, {
            headers: {
                cookie: req.headers.get('cookie') || ''
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            isMaintenance = data.enabled || isMaintenance; // DB takes precedence if true, or keeps Env true
            isAdmin = data.isAdmin || false;
        }
    } catch (error) {
        // Fallback to environment variable if fetch fails (timeout or error)
        console.error('Maintenance check failed, using fallback:', error);
    }

    if (isMaintenance) {
        // Allow admins to bypass
        if (isAdmin) {
            return;
        }

        // Allow sign-in routes explicitly so admins can login
        if (pathname.startsWith('/sign-in') || pathname.startsWith('/admin')) {
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
