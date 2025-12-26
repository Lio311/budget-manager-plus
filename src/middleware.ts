import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    // Allow access to maintenance page itself
    if (pathname === '/maintenance') {
        return;
    }

    // Check maintenance mode
    try {
        const settings = await prisma.siteSettings.findUnique({
            where: { id: 'site_settings' }
        });

        if (settings?.maintenanceMode) {
            // Get user to check if admin
            const { userId } = await auth();

            if (userId) {
                // Fetch user metadata to check admin role
                const { sessionClaims } = await auth();
                const isAdmin = (sessionClaims?.metadata as any)?.role === 'admin';

                // Allow admins to bypass maintenance mode
                if (!isAdmin) {
                    return NextResponse.redirect(new URL('/maintenance', req.url));
                }
            } else {
                // Redirect unauthenticated users to maintenance page
                return NextResponse.redirect(new URL('/maintenance', req.url));
            }
        }
    } catch (error) {
        console.error('Middleware maintenance check error:', error);
        // Continue normally if check fails
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
