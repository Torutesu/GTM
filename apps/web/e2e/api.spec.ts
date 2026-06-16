import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3001/api/v1';
let accessToken = '';
let postId = '';

test.describe('GON API E2E', () => {
  test('1. Register a new user', async ({ request }) => {
    const uniqueEmail = `test-${Date.now()}@example.com`;
    const response = await request.post(`${API_BASE}/auth/register`, {
      data: { email: uniqueEmail, password: 'password123', name: 'Test User' },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.data.user.email).toBe(uniqueEmail);
    expect(body.data.accessToken).toBeTruthy();
    accessToken = body.data.accessToken;
  });

  test('2. Login with credentials', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/login`, {
      data: { email: 'test-e2e@example.com', password: 'password123' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.accessToken).toBeTruthy();
    accessToken = body.data.accessToken;
  });

  test('3. Get current user', async ({ request }) => {
    const response = await request.get(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.email).toBeTruthy();
  });

  test('4. Create a post draft', async ({ request }) => {
    const response = await request.post(`${API_BASE}/posts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { contentText: 'Test post from E2E', platform: 'X' },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.data.status).toBe('DRAFT');
    postId = body.data.id;
  });

  test('5. Approve and publish a post', async ({ request }) => {
    const approveResponse = await request.post(`${API_BASE}/posts/${postId}/approve`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(approveResponse.status()).toBe(200);

    const getResponse = await request.get(`${API_BASE}/posts/${postId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = await getResponse.json();
    expect(body.data.status).toBe('APPROVED');
  });

  test('6. List posts', async ({ request }) => {
    const response = await request.get(`${API_BASE}/posts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('7. Execute Growth Strategy Agent', async ({ request }) => {
    const response = await request.post(`${API_BASE}/agents/execute`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { agentType: 'growth_strategy', input: {} },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.taskId).toBeTruthy();
    expect(body.result.analysis).toBeTruthy();
  });

  test('8. Execute Social Media Agent', async ({ request }) => {
    const response = await request.post(`${API_BASE}/agents/execute`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { agentType: 'social_media', input: { platform: 'X', frequency: 3 } },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.result.weeklyPlan).toBeTruthy();
  });

  test('9. Send chat message', async ({ request }) => {
    const response = await request.post(`${API_BASE}/chat/messages`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { content: 'What can you help me with?' },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.response).toBeTruthy();
  });

  test('10. Policy checker blocks prohibited content', async ({ request }) => {
    const response = await request.post(`${API_BASE}/posts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { contentText: 'Buy cheap credit card numbers', platform: 'X' },
    });
    expect(response.status()).toBe(201);
  });

  test('11. Rate limiting returns 429', async ({ request }) => {
    const requests = [];
    for (let i = 0; i < 15; i++) {
      requests.push(
        request.get(`${API_BASE}/posts?page=1&limit=5`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
    }
    const results = await Promise.all(requests);
    const has429 = results.some((r) => r.status() === 429);
    expect(has429).toBe(true);
  });
});
