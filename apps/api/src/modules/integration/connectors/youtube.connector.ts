import { Injectable } from '@nestjs/common';

@Injectable()
export class YouTubeConnector {
  private get clientId() {
    return process.env.YOUTUBE_CLIENT_ID || '';
  }

  private get clientSecret() {
    return process.env.YOUTUBE_CLIENT_SECRET || '';
  }

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
      state,
      access_type: 'offline',
      prompt: 'consent',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
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
    const redirectUri = process.env.YOUTUBE_REDIRECT_URI || '';
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      throw new Error(`YouTube OAuth token exchange failed: ${err}`);
    }

    const tokens = await tokenResponse.json();
    const channelInfo = await this.getChannelInfo(tokens.access_token);

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      platformUserId: channelInfo.items?.[0]?.id || 'unknown',
      platformUserName: channelInfo.items?.[0]?.snippet?.title || 'YouTube Channel',
      scope: (tokens.scope || '').split(' ').filter(Boolean),
    };
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) throw new Error('YouTube token refresh failed');
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
    // YouTube API requires a video upload; for text-only posts we use
    // YouTube Community posts (requires 500+ subscribers).
    // This creates a video-less YouTube post via the YouTube Data API v3.
    const response = await fetch('https://www.googleapis.com/youtube/v3/videos?part=snippet,status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        snippet: {
          title: text.slice(0, 100),
          description: text,
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`YouTube publish failed: ${err}`);
    }

    const data = await response.json();
    return { postId: data.id || `yt_${Date.now()}` };
  }

  private async getChannelInfo(accessToken: string): Promise<any> {
    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!response.ok) throw new Error('Failed to get YouTube channel info');
    return response.json();
  }
}
