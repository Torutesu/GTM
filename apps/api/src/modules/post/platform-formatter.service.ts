import { Injectable } from '@nestjs/common';

export interface PlatformLimits {
  maxChars: number;
  maxImages: number;
  maxVideos: number;
  maxHashtags: number;
  supportsThreads: boolean;
  supportsCarousel: boolean;
  supportsLinkPreview: boolean;
}

const LIMITS: Record<string, PlatformLimits> = {
  X: { maxChars: 40000, maxImages: 4, maxVideos: 1, maxHashtags: 50, supportsThreads: true, supportsCarousel: false, supportsLinkPreview: true },
  INSTAGRAM: { maxChars: 2200, maxImages: 10, maxVideos: 1, maxHashtags: 30, supportsThreads: false, supportsCarousel: true, supportsLinkPreview: false },
  TIKTOK: { maxChars: 2200, maxImages: 0, maxVideos: 1, maxHashtags: 30, supportsThreads: false, supportsCarousel: false, supportsLinkPreview: false },
  YOUTUBE: { maxChars: 5000, maxImages: 0, maxVideos: 1, maxHashtags: 15, supportsThreads: false, supportsCarousel: false, supportsLinkPreview: true },
  LINKEDIN: { maxChars: 3000, maxImages: 9, maxVideos: 1, maxHashtags: 10, supportsThreads: false, supportsCarousel: false, supportsLinkPreview: true },
  THREADS: { maxChars: 500, maxImages: 10, maxVideos: 1, maxHashtags: 10, supportsThreads: true, supportsCarousel: false, supportsLinkPreview: true },
};

@Injectable()
export class PlatformFormatter {
  getLimits(platform: string): PlatformLimits {
    return LIMITS[platform] || LIMITS.X;
  }

  formatContent(platform: string, text: string): string {
    const limits = this.getLimits(platform);

    let formatted = text.trim();

    if (platform === 'X' && formatted.length > limits.maxChars) {
      formatted = formatted.slice(0, limits.maxChars - 3) + '...';
    }

    if (formatted.length > limits.maxChars) {
      formatted = formatted.slice(0, limits.maxChars);
    }

    const hashtagCount = (formatted.match(/#\w+/g) || []).length;
    if (hashtagCount > limits.maxHashtags) {
      const tags = formatted.match(/#\w+/g) || [];
      const keep = new Set(tags.slice(0, limits.maxHashtags));
      formatted = formatted.replace(/#\w+/g, (m) => keep.has(m) ? m : '');
      formatted = formatted.replace(/\s+/g, ' ').trim();
    }

    if (platform === 'INSTAGRAM') {
      const parts = formatted.split('\n');
      if (parts.length > 20) {
        formatted = parts.slice(0, 20).join('\n');
      }
    }

    if (platform === 'LINKEDIN') {
      formatted = formatted.replace(/\n{3,}/g, '\n\n');
    }

    return formatted;
  }

  splitIntoThreads(platform: string, text: string): string[] {
    const limits = this.getLimits(platform);
    if (!limits.supportsThreads || text.length <= limits.maxChars) {
      return [text];
    }

    const threads: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let current = '';

    for (const sentence of sentences) {
      if ((current + ' ' + sentence).trim().length > limits.maxChars) {
        if (current.trim()) threads.push(current.trim());
        current = sentence;
      } else {
        current += (current ? ' ' : '') + sentence;
      }
    }
    if (current.trim()) threads.push(current.trim());

    return threads.map((t, i) => `${t} (${i + 1}/${threads.length})`);
  }

  truncateForPreview(platform: string, text: string, maxPreview = 150): string {
    return text.length > maxPreview ? text.slice(0, maxPreview) + '...' : text;
  }
}
