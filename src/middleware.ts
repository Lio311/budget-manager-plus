import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
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

    // Check maintenance mode from environment variable
    const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';

    if (maintenanceMode) {
        // Get user info to check if admin
        const { userId } = await auth();

        // Allow admins to bypass maintenance mode
        if (userId && pathname.startsWith('/admin')) {
            // Let admin routes through
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
