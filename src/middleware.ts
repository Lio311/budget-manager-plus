import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server'
import { getSubscriptionStatus } from '@/lib/actions/subscription'

const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/subscribe(.*)'
]);

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware(async (auth, req) => {
    // Allow public routes
    if (isPublicRoute(req)) {
        return NextResponse.next()
    }

    // Require authentication
    const { userId } = await auth()
    if (!userId) {
        const signInUrl = new URL('/sign-in', req.url)
        signInUrl.searchParams.set('redirect_url', req.url)
        return NextResponse.redirect(signInUrl)
    }

    // Check subscription for dashboard access
    if (isDashboardRoute(req)) {
        const { hasAccess } = await getSubscriptionStatus(userId)

        if (!hasAccess) {
            return NextResponse.redirect(new URL('/subscribe', req.url))
        }
    }

    return NextResponse.next()
});

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
