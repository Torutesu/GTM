import { Injectable } from '@nestjs/common';

@Injectable()
export class ThreadsConnector {
  private get clientId() {
    return process.env.THREADS_CLIENT_ID || '';
  }

  private get clientSecret() {
    return process.env.THREADS_CLIENT_SECRET || '';
  }

  private get baseUrl() {
    return 'https://graph.threads.net/v1.0';
  }

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: 'threads_basic threads_content_publish',
      response_type: 'code',
      state,
    });
    return `https://www.threads.net/oauth/authorize?${params.toString()}`;
  }

  async handleCallback(
    code: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    platformUserId: string;
    platformUserName: string;
    scope: string[];
  }> {
    const redirectUri = process.env.THREADS_REDIRECT_URI || '';
    // Exchange code for short-lived token
    const tokenResponse = await fetch(`${this.baseUrl}/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      throw new Error(`Threads OAuth token exchange failed: ${err}`);
    }

    const tokens = await tokenResponse.json();

    // Exchange short-lived token for long-lived token
    const longLivedResponse = await fetch(
      `${this.baseUrl}/access_token?grant_type=th_exchange_token&client_secret=${this.clientSecret}&access_token=${tokens.access_token}`,
      { method: 'GET' },
    );

    if (!longLivedResponse.ok) {
      const err = await longLivedResponse.text();
      throw new Error(`Threads long-lived token exchange failed: ${err}`);
    }

    const longLived = await longLivedResponse.json();
    const profile = await this.getProfile(longLived.access_token, tokens.user_id);

    return {
      accessToken: longLived.access_token,
      refreshToken: longLived.access_token,
      platformUserId: tokens.user_id,
      platformUserName: profile.username || profile.name || 'Threads User',
      scope: (tokens.scope || '').split(',').filter(Boolean),
    };
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Threads long-lived tokens can be refreshed with GET request
    const response = await fetch(
      `${this.baseUrl}/access_token?grant_type=th_refresh_token&access_token=${refreshToken}`,
      { method: 'GET' },
    );

    if (!response.ok) throw new Error('Threads token refresh failed');
    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.access_token,
    };
  }

  async publishPost(
    accessToken: string,
    text: string,
  ): Promise<{ postId: string }> {
    // Step 1: Create a media container (text-only post)
    const mediaResponse = await fetch(`${this.baseUrl}/me/threads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        media_type: 'TEXT',
        text,
      }),
    });

    if (!mediaResponse.ok) {
      const err = await mediaResponse.text();
      throw new Error(`Threads media container creation failed: ${err}`);
    }

    const media = await mediaResponse.json();

    // Step 2: Publish the container
    const publishResponse = await fetch(
      `${this.baseUrl}/me/threads_publish?creation_id=${media.id}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!publishResponse.ok) {
      const err = await publishResponse.text();
      throw new Error(`Threads publish failed: ${err}`);
    }

    const result = await publishResponse.json();
    return { postId: result.id || `threads_${Date.now()}` };
  }

  private async getProfile(accessToken: string, userId: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/${userId}?fields=id,username,name`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!response.ok) return { username: 'Threads User' };
    return response.json();
  }
}
