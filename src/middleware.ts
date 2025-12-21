import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/onboarding'
]);

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();
    const isOnboarding = req.nextUrl.pathname === '/onboarding';
    const isDashboard = req.nextUrl.pathname.startsWith('/dashboard');

    // If user just signed in and trying to access dashboard, redirect to onboarding first
    if (userId && isDashboard && !isOnboarding) {
        // Let onboarding page handle the user creation
        // This will be fast after first time since user will exist
    }

    if (!isPublicRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
