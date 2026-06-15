import { Injectable } from '@nestjs/common';

const TWITTER_AUTH_URL = 'https://twitter.com/i/oauth2/authorize';
const TWITTER_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';
const TWITTER_API_URL = 'https://api.twitter.com/2';

@Injectable()
export class XConnector {
  private get clientId() {
    return process.env.X_CLIENT_ID || '';
  }

  private get clientSecret() {
    return process.env.X_CLIENT_SECRET || '';
  }

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: 'tweet.read tweet.write users.read offline.access',
      state,
      code_challenge: 'challenge',
      code_challenge_method: 'plain',
    });
    return `${TWITTER_AUTH_URL}?${params.toString()}`;
  }

  async handleCallback(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    platformUserId: string;
    platformUserName: string;
    scope: string[];
  }> {
    const tokenResponse = await fetch(TWITTER_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: this.clientId,
        redirect_uri: process.env.X_REDIRECT_URI || '',
        code_verifier: 'challenge',
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      throw new Error(`X OAuth token exchange failed: ${err}`);
    }

    const tokens = await tokenResponse.json();
    const me = await this.getMe(tokens.access_token);

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      platformUserId: me.data.id,
      platformUserName: me.data.username,
      scope: tokens.scope?.split(' ') || [],
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await fetch(TWITTER_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        client_id: this.clientId,
      }),
    });

    if (!response.ok) throw new Error('X token refresh failed');
    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
    };
  }

  async publishPost(
    accessToken: string,
    text: string,
  ): Promise<{ postId: string }> {
    const response = await fetch(`${TWITTER_API_URL}/tweets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`X publish failed: ${err}`);
    }

    const data = await response.json();
    return { postId: data.data.id };
  }

  async getRecentPosts(accessToken: string, userId: string, sinceId?: string) {
    const params = new URLSearchParams({
      max_results: '100',
      'tweet.fields': 'created_at,public_metrics',
      ...(sinceId && { since_id: sinceId }),
    });

    const response = await fetch(
      `${TWITTER_API_URL}/users/${userId}/tweets?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) return [];
    const data = await response.json();
    return data.data || [];
  }

  private async getMe(accessToken: string): Promise<{ data: { id: string; username: string } }> {
    const response = await fetch(`${TWITTER_API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.json();
  }
}
