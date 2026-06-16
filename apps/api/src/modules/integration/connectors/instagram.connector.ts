import { Injectable } from '@nestjs/common';

const FB_AUTH_URL = 'https://www.facebook.com/dialog/oauth';
const FB_TOKEN_URL = 'https://graph.facebook.com/v19.0/oauth/access_token';
const FB_GRAPH_URL = 'https://graph.facebook.com/v19.0';

@Injectable()
export class InstagramConnector {
  private get clientId() {
    return process.env.INSTAGRAM_CLIENT_ID || '';
  }

  private get clientSecret() {
    return process.env.INSTAGRAM_CLIENT_SECRET || '';
  }

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      state,
      scope: 'instagram_basic,instagram_content_publish,pages_read_engagement,pages_show_list',
      response_type: 'code',
    });
    return `${FB_AUTH_URL}?${params.toString()}`;
  }

  async handleCallback(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    platformUserId: string;
    platformUserName: string;
    scope: string[];
  }> {
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || '';
    const shortTokenResponse = await fetch(
      `${FB_TOKEN_URL}?${new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
        code,
      })}`,
    );

    if (!shortTokenResponse.ok) {
      const err = await shortTokenResponse.text();
      throw new Error(`Instagram OAuth token exchange failed: ${err}`);
    }

    const shortTokenData = await shortTokenResponse.json();
    const longTokenData = await this.exchangeLongLivedToken(shortTokenData.access_token);

    const pages = await this.getPages(longTokenData.access_token);
    const igAccount = await this.getInstagramAccount(pages[0]?.id, longTokenData.access_token);

    return {
      accessToken: longTokenData.access_token,
      refreshToken: '',
      platformUserId: igAccount?.id || pages[0]?.id || '',
      platformUserName: igAccount?.username || pages[0]?.name || '',
      scope: shortTokenData.scope?.split(',') || [],
    };
  }

  private async exchangeLongLivedToken(shortToken: string): Promise<{ access_token: string; expires_in: number }> {
    const response = await fetch(
      `${FB_GRAPH_URL}/oauth/access_token?${new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        fb_exchange_token: shortToken,
      })}`,
    );

    if (!response.ok) throw new Error('Instagram token exchange failed');
    return response.json();
  }

  private async getPages(accessToken: string): Promise<{ id: string; name: string }[]> {
    const response = await fetch(
      `${FB_GRAPH_URL}/me/accounts?${new URLSearchParams({
        access_token: accessToken,
        fields: 'id,name',
      })}`,
    );

    if (!response.ok) return [];
    const data = await response.json();
    return data.data || [];
  }

  private async getInstagramAccount(
    pageId: string,
    accessToken: string,
  ): Promise<{ id: string; username: string } | null> {
    if (!pageId) return null;

    const response = await fetch(
      `${FB_GRAPH_URL}/${pageId}?${new URLSearchParams({
        access_token: accessToken,
        fields: 'instagram_business_account{id,username}',
      })}`,
    );

    if (!response.ok) return null;
    const data = await response.json();
    return data.instagram_business_account || null;
  }

  async publishPost(
    accessToken: string,
    igUserId: string,
    text: string,
  ): Promise<{ postId: string }> {
    const creationResponse = await fetch(`${FB_GRAPH_URL}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caption: text,
        access_token: accessToken,
        media_type: 'CAROUSEL',
        children: [],
      }),
    });

    if (!creationResponse.ok) {
      const err = await creationResponse.text();
      throw new Error(`Instagram media creation failed: ${err}`);
    }

    const { id: mediaId } = await creationResponse.json();

    const publishResponse = await fetch(`${FB_GRAPH_URL}/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: mediaId,
        access_token: accessToken,
      }),
    });

    if (!publishResponse.ok) {
      const err = await publishResponse.text();
      throw new Error(`Instagram publish failed: ${err}`);
    }

    const data = await publishResponse.json();
    return { postId: data.id };
  }
}
