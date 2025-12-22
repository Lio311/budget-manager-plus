/**
 * SWR Configuration for Performance Optimization
 * 
 * This configuration enables client-side caching with deduplication
 * to reduce unnecessary server requests and improve perceived performance.
 */

export const swrConfig = {
    // Dedupe requests within 60 seconds - prevents duplicate requests to the same endpoint
    dedupingInterval: 60000,

    // Revalidate on focus after 30 seconds of inactivity
    focusThrottleInterval: 30000,

    // Keep data fresh by revalidating on window focus
    revalidateOnFocus: true,

    // Revalidate when network reconnects
    revalidateOnReconnect: true,

    // Don't revalidate on mount if data is fresh (within deduping interval)
    revalidateIfStale: false,

    // Error retry configuration
    errorRetryCount: 3,
    errorRetryInterval: 5000,

    // Loading timeout
    loadingTimeout: 3000,

    // Keep previous data while revalidating
    keepPreviousData: true,
}
