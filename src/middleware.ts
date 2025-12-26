import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/subscribe(.*)',
    '/api/webhooks(.*)',
    '/maintenance'
]);

export default clerkMiddleware(async (auth, req) => {
    // NOTE: Maintenance mode check removed from middleware
    // Prisma cannot run in Edge Runtime (where middleware runs)
    // TODO: Implement maintenance mode using Vercel Edge Config or KV

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
