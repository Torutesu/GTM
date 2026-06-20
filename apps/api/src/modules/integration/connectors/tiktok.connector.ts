import { Injectable } from '@nestjs/common';

@Injectable()
export class TikTokConnector {
  private get clientKey() {
    return process.env.TIKTOK_CLIENT_ID || '';
  }

  private get clientSecret() {
    return process.env.TIKTOK_CLIENT_SECRET || '';
  }

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_key: this.clientKey,
      response_type: 'code',
      scope: 'user.info.basic,video.publish',
      redirect_uri: redirectUri,
      state,
    });
    return `https://www.tiktok.com/v2/auth/authorize?${params.toString()}`;
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
    const redirectUri = process.env.TIKTOK_REDIRECT_URI || '';
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      throw new Error(`TikTok OAuth token exchange failed: ${err}`);
    }

    const tokens = await tokenResponse.json();
    const userInfo = await this.getUserInfo(tokens.access_token);

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      platformUserId: userInfo.data.user.open_id,
      platformUserName: userInfo.data.user.display_name || userInfo.data.user.username || 'TikTok User',
      scope: (tokens.scope || '').split(',').filter(Boolean),
    };
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) throw new Error('TikTok token refresh failed');
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
    const response = await fetch('https://open.tiktokapis.com/v2/video/query/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        post_info: {
          title: text,
          privacy_level: 'PUBLIC_TO_EVERYONE',
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: '',
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`TikTok publish failed: ${err}`);
    }

    const data = await response.json();
    return { postId: data.data?.publish_id || `tiktok_${Date.now()}` };
  }

  private async getUserInfo(accessToken: string): Promise<any> {
    const response = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,username',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!response.ok) throw new Error('Failed to get TikTok user info');
    return response.json();
  }
}
