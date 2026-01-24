
const ipMap = new Map<string, { count: number; lastReset: number }>();

// Configuration: 100 requests per minute per IP
const WINDOW_MS = 60 * 1000;
const LIMIT = 100;

// Cleanup interval (every 5 minutes) to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;

    lastCleanup = now;
    for (const [ip, data] of ipMap.entries()) {
        if (now - data.lastReset > WINDOW_MS) {
            ipMap.delete(ip);
        }
    }
}

export function checkRateLimit(ip: string): boolean {
    cleanup();

    const now = Date.now();
    const record = ipMap.get(ip);

    if (!record) {
        ipMap.set(ip, { count: 1, lastReset: now });
        return true;
    }

    if (now - record.lastReset > WINDOW_MS) {
        record.count = 1;
        record.lastReset = now;
        return true;
    }

    if (record.count >= LIMIT) {
        return false;
    }

    record.count++;
    return true;
}
