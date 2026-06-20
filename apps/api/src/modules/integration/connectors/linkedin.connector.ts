import { Injectable } from '@nestjs/common';

@Injectable()
export class LinkedInConnector {
  private get clientId() {
    return process.env.LINKEDIN_CLIENT_ID || '';
  }

  private get clientSecret() {
    return process.env.LINKEDIN_CLIENT_SECRET || '';
  }

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: 'openid profile email w_member_social',
      state,
    });
    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
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
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI || '';
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      throw new Error(`LinkedIn OAuth token exchange failed: ${err}`);
    }

    const tokens = await tokenResponse.json();
    const profile = await this.getProfile(tokens.access_token);

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      platformUserId: profile.sub,
      platformUserName: profile.name || profile.email || 'LinkedIn User',
      scope: (tokens.scope || '').split(' ').filter(Boolean),
    };
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) throw new Error('LinkedIn token refresh failed');
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
    // LinkedIn Share API v2 - creates a text post
    const response = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401',
      },
      body: JSON.stringify({
        author: 'urn:li:person:__author__',
        commentary: text,
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`LinkedIn publish failed: ${err}`);
    }

    const id = response.headers.get('x-restli-id') || response.headers.get('id') || `li_${Date.now()}`;
    return { postId: id };
  }

  private async getProfile(accessToken: string): Promise<any> {
    const response = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new Error('Failed to get LinkedIn profile');
    return response.json();
  }
}
