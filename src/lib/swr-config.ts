/**
 * SWR Configuration for Performance Optimization
 * 
 * Optimized for instant perceived performance with aggressive caching
 */

export const swrConfig = {
    // Dedupe requests within 5 seconds - allows faster updates while preventing spam
    dedupingInterval: 5000,

    // Disable focus revalidation for faster perceived performance
    revalidateOnFocus: false,

    // Disable reconnect revalidation
    revalidateOnReconnect: false,

    // Don't revalidate on mount if data exists
    revalidateIfStale: false,

    // Error retry configuration - fail fast
    errorRetryCount: 2,
    errorRetryInterval: 2000,

    // Shorter loading timeout
    loadingTimeout: 1000,

    // Keep previous data while revalidating for instant UI
    keepPreviousData: true,

    // Suspense mode for better loading states
    suspense: false,

    // Fallback data to show immediately
    fallbackData: undefined,
}
