import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
    '/',
    '/personal(.*)',
    '/business(.*)',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/subscribe(.*)',
    '/api/webhooks(.*)',
    '/maintenance',
    '/api/maintenance(.*)',
    '/credit-note(.*)',
    '/invoice(.*)',
    '/quote(.*)',
    '/api/v1/expenses(.*)',
    '/api/quick-add(.*)',
    '/api/quick-stats(.*)', // iOS Shortcut API with API key auth
    '/api/scan-invoice(.*)',
    '/terms(.*)',
    '/security(.*)',
    '/accessibility(.*)',
    '/get-started',
    '/demo'
]);

export default clerkMiddleware(async (auth, req) => {
    const { pathname } = req.nextUrl;

    // Skip maintenance check for maintenance page and status API, AND critical Shortcuts API
    if (pathname === '/maintenance' || pathname.startsWith('/api/maintenance') || pathname.startsWith('/api/v1/expenses') || pathname.startsWith('/api/quick-add') || pathname.startsWith('/api/quick-stats') || pathname.startsWith('/api/scan-invoice')) {
        return;
    }

    // Check maintenance mode from environment variable AND database via API
    // We use fetch with a timeout to prevent blocking the edge function for too long
    let isMaintenance = process.env.MAINTENANCE_MODE === 'true';
    let isAdmin = false;

    try {
        // We must reach out to the full URL because this is running on the server/edge
        const maintenanceUrl = new URL('/api/maintenance/status', req.url);

        const response = await fetch(maintenanceUrl.toString(), {
            headers: {
                cookie: req.headers.get('cookie') || ''
            },
            signal: AbortSignal.timeout(400) // Short timeout to prevent blocking
        });

        if (response.ok) {
            const data = await response.json();
            isMaintenance = data.enabled || isMaintenance;
            isAdmin = data.isAdmin || false;
        }
    } catch (error) {
        // Fail silently/open to prevent performance impact
        // console.warn('Maintenance check skipped (timeout/error)');
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
    // Require authentication for all other routes
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.redirect(new URL('/', req.url));
    }
});

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
