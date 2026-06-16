import { RateLimitGuard } from '../guards/rate-limit.guard';
import { HttpException } from '@nestjs/common';

function createMockContext(overrides: any = {}): any {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        ip: '127.0.0.1',
        user: null,
        ...overrides,
      }),
    }),
  };
}

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;

  beforeEach(() => {
    guard = new RateLimitGuard(3, 1000);
    guard.reset();
  });

  it('allows requests within limit', () => {
    const ctx = createMockContext();
    expect(guard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('blocks requests over limit', () => {
    const ctx = createMockContext({ user: { id: 'user-1' } });
    expect(guard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);
    expect(() => guard.canActivate(ctx)).toThrow(HttpException);
  });

  it('resets window after timeout', async () => {
    const guard = new RateLimitGuard(2, 100);
    const ctx = createMockContext();

    expect(guard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);
    expect(() => guard.canActivate(ctx)).toThrow(HttpException);

    await new Promise((r) => setTimeout(r, 150));
    expect(guard.canActivate(ctx)).toBe(true);
  }, 5000);

  it('uses user id over ip when available', () => {
    const guard = new RateLimitGuard(1, 60000);
    const userCtx = createMockContext({ user: { id: 'user-1' } });
    const ipCtx = createMockContext({ ip: '192.168.1.1' });

    expect(guard.canActivate(userCtx)).toBe(true);
    expect(() => guard.canActivate(userCtx)).toThrow(HttpException);
    expect(guard.canActivate(ipCtx)).toBe(true);
  });

  it('resets specific user key', () => {
    const guard = new RateLimitGuard(1, 60000);
    const ctx1 = createMockContext({ user: { id: 'user-1' } });
    const ctx2 = createMockContext({ user: { id: 'user-2' } });

    expect(guard.canActivate(ctx1)).toBe(true);
    expect(() => guard.canActivate(ctx1)).toThrow(HttpException);
    expect(guard.canActivate(ctx2)).toBe(true);

    guard.reset('user-1');
    expect(guard.canActivate(ctx1)).toBe(true);
  });

  it('throws with correct status code and message', () => {
    const guard = new RateLimitGuard(0, 60000);
    const ctx = createMockContext();

    try {
      guard.canActivate(ctx);
      fail('Should have thrown');
    } catch (e: any) {
      expect(e.status).toBe(429);
      expect(e.response.error.code).toBe('RATE_LIMITED');
    }
  });
});
