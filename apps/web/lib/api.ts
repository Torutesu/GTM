const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type FetchOptions = RequestInit & {
  params?: Record<string, string | undefined>;
};

class ApiClient {
  private accessToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
    }
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    document.cookie = `accessToken=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
  }

  clearTokens() {
    this.accessToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    document.cookie = 'accessToken=; path=/; max-age=0';
  }

  getAccessToken() {
    return this.accessToken;
  }

  isAuthenticated() {
    return !!this.accessToken;
  }

  private buildUrl(path: string, params?: Record<string, string | undefined>): string {
    const url = new URL(`${API_URL}/api/v1${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
      });
    }
    return url.toString();
  }

  private async request<T>(path: string, options: FetchOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    const url = this.buildUrl(path, params);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((fetchOptions.headers as Record<string, string>) || {}),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, { ...fetchOptions, headers });

    if (response.status === 401) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        const retryResponse = await fetch(url, { ...fetchOptions, headers });
        if (!retryResponse.ok) {
          const err = await retryResponse.text();
          throw new ApiError(retryResponse.status, err);
        }
        return retryResponse.json();
      }
      this.clearTokens();
      throw new ApiError(401, 'Unauthorized');
    }

    if (!response.ok) {
      const err = await response.text();
      throw new ApiError(response.status, err);
    }

    const json = await response.json();
    if (json && typeof json === 'object' && 'data' in json && !('meta' in json)) {
      return json.data as T;
    }
    return json;
  }

  private async tryRefresh(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      this.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ success: boolean }>('/users/me/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Auth
  async register(email: string, password: string, name: string) {
    return this.request<{ user: any; accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ user: any; accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Users
  async getMe(): Promise<any> {
    return this.request<any>('/users/me');
  }

  async updateMe(data: { name?: string; settings?: any }): Promise<any> {
    return this.request<any>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Integrations
  async getIntegrations() {
    return this.request<any[]>('/integrations');
  }

  async getPlatformStatus() {
    return this.request<Record<string, { configured: boolean; demoAvailable: boolean }>>('/integrations/status');
  }

  async getAuthUrl(platform: string, redirectUri: string) {
    return this.request<{ authUrl: string; state: string }>('/integrations/auth-url', {
      method: 'POST',
      body: JSON.stringify({ platform, redirectUri }),
    });
  }

  async demoConnect(platform: string) {
    return this.request('/integrations/demo-connect', {
      method: 'POST',
      body: JSON.stringify({ platform }),
    });
  }

  async handleCallback(platform: string, code: string, state: string) {
    return this.request('/integrations/callback', {
      method: 'POST',
      body: JSON.stringify({ platform, code, state }),
    });
  }

  async disconnectIntegration(id: string) {
    return this.request(`/integrations/${id}`, { method: 'DELETE' });
  }

  // Posts
  async getPosts(params?: { status?: string; platform?: string; page?: string; limit?: string }) {
    return this.request<{ data: any[]; meta: any }>('/posts', { params: params as any });
  }

  async getPost(id: string) {
    return this.request<{ data: any }>(`/posts/${id}`);
  }

  async createPost(data: { contentText: string; platform: string; integrationAccountId?: string; scheduledAt?: string }) {
    return this.request<{ data: any }>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approvePost(id: string) {
    return this.request(`/posts/${id}/approve`, { method: 'POST' });
  }

  async publishPost(id: string) {
    return this.request(`/posts/${id}/publish`, { method: 'POST' });
  }

  async deletePost(id: string) {
    return this.request(`/posts/${id}`, { method: 'DELETE' });
  }

  // Agents
  async executeAgent(agentType: string, input: Record<string, unknown>, campaignId?: string) {
    return this.request<{ taskId: string; result: any }>('/agents/execute', {
      method: 'POST',
      body: JSON.stringify({ agentType, input, campaignId }),
    });
  }

  async getTasks() {
    return this.request<any[]>('/agents/tasks');
  }

  // Chat
  async sendChatMessage(content: string) {
    return this.request<{ response: string }>('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Campaigns
  async getCampaigns() {
    return this.request<any[]>('/campaigns');
  }

  async getCampaign(id: string) {
    return this.request<any>(`/campaigns/${id}`);
  }

  async createCampaign(data: { name: string; goal?: string; startDate?: string; endDate?: string; budget?: number }) {
    return this.request<any>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCampaign(id: string, data: { name?: string; goal?: string; startDate?: string; endDate?: string; budget?: number; status?: string }) {
    return this.request<any>(`/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCampaign(id: string) {
    return this.request(`/campaigns/${id}`, { method: 'DELETE' });
  }

  // Feed
  async getFeed(cursor?: string, limit?: string) {
    return this.request<{ data: any[]; meta: any }>('/feed', {
      params: { cursor, limit },
    });
  }

  // Billing
  async getBillingSubscription() {
    return this.request<any>('/billing');
  }

  async getBillingPlans() {
    return this.request<any[]>('/billing/plans');
  }

  async upgradePlan(plan: string) {
    return this.request<any>('/billing/upgrade', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = new ApiClient();

export function getApi() {
  return api;
}
