import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3001/api/v1';

test.describe('GON API E2E', () => {
  let accessToken = '';
  let postId = '';
  let registeredEmail = '';

  test.beforeAll(async ({ request }) => {
    registeredEmail = `test-${Date.now()}@example.com`;
    const res = await request.post(`${API_BASE}/auth/register`, {
      data: { email: registeredEmail, password: 'password123', name: 'Test User' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    accessToken = body.data.accessToken;
  });

  test('0. Health check', async ({ request }) => {
    const res = await request.get(`${API_BASE}/monitoring/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('ok');
  });

  test('1. Login with credentials', async ({ request }) => {
    const res = await request.post(`${API_BASE}/auth/login`, {
      data: { email: registeredEmail, password: 'password123' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.accessToken).toBeTruthy();
    accessToken = body.data.accessToken;
  });

  test('2. Get current user', async ({ request }) => {
    const res = await request.get(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.email).toBe(registeredEmail);
  });

  test('3. Create a post draft on X', async ({ request }) => {
    const res = await request.post(`${API_BASE}/posts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { contentText: 'Test post from E2E', platform: 'X' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    const post = body.data.data;
    expect(post.status).toBe('DRAFT');
    expect(post.platform).toBe('X');
    postId = post.id;
  });

  test('4. Create posts on all platforms', async ({ request }) => {
    const platforms = ['X', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'LINKEDIN', 'THREADS'];
    for (const platform of platforms) {
      const res = await request.post(`${API_BASE}/posts`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { contentText: `Test post for ${platform}`, platform },
      });
      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body.data.data.platform).toBe(platform);
    }
  });

  test('5. List posts with filters', async ({ request }) => {
    const res = await request.get(`${API_BASE}/posts?status=DRAFT&limit=10`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toBeTruthy();
  });

  test('6. Approve and schedule post', async ({ request }) => {
    const approveRes = await request.post(`${API_BASE}/posts/${postId}/approve`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(approveRes.status()).toBe(201);

    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    const scheduleRes = await request.post(`${API_BASE}/posts/${postId}/schedule`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { scheduledAt: tomorrow },
    });
    expect(scheduleRes.status()).toBe(201);
  });

  test('7. Update user settings', async ({ request }) => {
    const res = await request.patch(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'Updated Name', settings: { onboardingDone: true } },
    });
    expect(res.status()).toBe(200);
  });

  test('8. Get billing plans', async ({ request }) => {
    const res = await request.get(`${API_BASE}/billing/plans`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('9. Execute AI agents', async ({ request }) => {
    const res = await request.post(`${API_BASE}/agents/execute`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { agentType: 'growth_strategy', input: {} },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.data.taskId).toBeTruthy();
    expect(body.data.result.analysis).toBeTruthy();
  });

  test('10. Send chat message', async ({ request }) => {
    const res = await request.post(`${API_BASE}/chat/messages`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { content: 'What can you help me with?' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.data.response).toBeTruthy();
  });

  test('11. Demo connect integration', async ({ request }) => {
    const res = await request.post(`${API_BASE}/integrations/demo-connect`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { platform: 'X' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.data.id).toBeTruthy();
  });

  test('12. List and verify integrations', async ({ request }) => {
    const res = await request.get(`${API_BASE}/integrations`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('13. Get platform status', async ({ request }) => {
    const res = await request.get(`${API_BASE}/integrations/status`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.X).toBeTruthy();
  });
});
