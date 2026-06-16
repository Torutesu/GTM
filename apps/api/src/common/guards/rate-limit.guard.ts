import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private store = new Map<string, RateLimitEntry>();

  constructor(
    private readonly maxRequests: number = 100,
    private readonly windowMs: number = 60_000,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = request.user?.id || request.ip || 'anonymous';
    const now = Date.now();

    let entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + this.windowMs };
      this.store.set(key, entry);
    }

    entry.count++;

    if (entry.count > this.maxRequests) {
      throw new HttpException(
        {
          error: {
            code: 'RATE_LIMITED',
            message: `Too many requests. Try again after ${Math.ceil((entry.resetAt - now) / 1000)}s`,
            details: { retryAfter: Math.ceil((entry.resetAt - now) / 1000) },
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  reset(key?: string) {
    if (key) {
      this.store.delete(key);
    } else {
      this.store.clear();
    }
  }
}
