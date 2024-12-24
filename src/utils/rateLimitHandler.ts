import { Session, Response } from "node-tls-client";

export async function handleRateLimit(_: Session, response: Response): Promise<void> {
    const remaining = parseInt(Array.isArray(response.headers['x-ratelimit-remaining']) ? response.headers['x-ratelimit-remaining'][0] : response.headers['x-ratelimit-remaining'] || '0', 10);
    const resetTime = parseInt(Array.isArray(response.headers['x-ratelimit-reset']) ? response.headers['x-ratelimit-reset'][0] : response.headers['x-ratelimit-reset'] || '0', 10) * 1000; // Convert to milliseconds
    const now = Date.now();

    if (remaining <= 0) {
        const waitTime = resetTime - now;
        if (waitTime > 0) {
            console.log(`Rate limit reached. Waiting for ${waitTime / 1000} seconds.`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
}

