// Simple token bucket rate limiter for API calls
export class RateLimiter {
    private tokens: number;
    private lastRefill: number;
    private readonly maxTokens: number;
    private readonly refillRate: number; // tokens per second

    constructor(maxTokens: number = 10, refillRate: number = 1) {
        this.maxTokens = maxTokens;
        this.tokens = maxTokens;
        this.refillRate = refillRate;
        this.lastRefill = Date.now();
    }

    private refill(): void {
        const now = Date.now();
        const timePassed = (now - this.lastRefill) / 1000; // in seconds
        const tokensToAdd = timePassed * this.refillRate;

        this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
        this.lastRefill = now;
    }

    async waitForToken(): Promise<void> {
        this.refill();

        if (this.tokens >= 1) {
            this.tokens -= 1;
            return;
        }

        // Calculate wait time
        const tokensNeeded = 1 - this.tokens;
        const waitTime = (tokensNeeded / this.refillRate) * 1000; // in milliseconds

        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.tokens = 0; // Consumed the token we waited for
        this.lastRefill = Date.now();
    }

    canMakeRequest(): boolean {
        this.refill();
        return this.tokens >= 1;
    }

    getRemainingTokens(): number {
        this.refill();
        return Math.floor(this.tokens);
    }
}

// Global rate limiter instance - 10 requests per minute (refills at ~0.167 tokens/sec)
export const globalRateLimiter = new RateLimiter(10, 0.167);