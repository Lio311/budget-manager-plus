import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/subscribe(.*)',
    '/api/webhooks(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
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
