/**
 * BitHarbor Backend Adapter
 * 
 * Adapts BitHarbor's API structure to match our frontend's expected format.
 * Allows seamless switching between mock API and real BitHarbor backend.
 */

import { apiService } from './client';
import type { MediaItem } from '@/types/api';

interface BitHarborSearchRequest {
  query_text: string;
  top_k?: number;
  participant_id?: string;
  threshold?: number;
}

interface BitHarborSearchResult {
  media_id: string;
  score: number;
  metadata: {
    title?: string;
    path: string;
    duration_seconds?: number;
    created_at?: string;
    participant_id?: string;
    file_hash?: string;
    [key: string]: any;
  };
}

interface BitHarborMediaItem {
  media_id: string;
  file_hash: string;
  path: string;
  participant_id: string;
  duration_seconds?: number;
  created_at: string;
  metadata: Record<string, any>;
}

export class BitHarborAdapter {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080/api/v1') {
    this.baseUrl = baseUrl;
  }

  /**
   * Transform BitHarbor media item to our MediaItem format
   */
  private transformMediaItem(item: BitHarborMediaItem | BitHarborSearchResult['metadata'], mediaId?: string): MediaItem {
    const id = mediaId || ('media_id' in item ? item.media_id : item.file_hash || '');
    const metadata = 'metadata' in item ? item.metadata : {};
    const title = metadata?.title || item.path?.split('/').pop() || 'Unknown';
    const createdAt = 'created_at' in item ? item.created_at : undefined;
    
    return {
      Id: id,
      Name: title,
      Type: this.guessMediaType(item.path || ''),
      Overview: metadata?.description || metadata?.overview,
      ImageTags: metadata?.poster_url ? { Primary: 'has-image' } : undefined,
      UserData: {
        PlaybackPositionTicks: 0,
        IsFavorite: false,
        Played: false,
      },
      ProductionYear: metadata?.year || (createdAt ? new Date(createdAt).getFullYear() : undefined),
      RunTimeTicks: item.duration_seconds ? item.duration_seconds * 10000000 : undefined,
      Genres: metadata?.genres || [],
      CommunityRating: metadata?.rating,
      OfficialRating: metadata?.content_rating,
    };
  }

  /**
   * Guess media type from file path
   */
  private guessMediaType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const videoExts = ['mp4', 'mkv', 'avi', 'mov', 'webm', 'm4v'];
    const audioExts = ['mp3', 'flac', 'wav', 'ogg', 'm4a'];
    
    if (videoExts.includes(ext || '')) return 'Movie';
    if (audioExts.includes(ext || '')) return 'Audio';
    return 'Video';
  }

  /**
   * Get authentication headers
   */
  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${apiService.getAccessToken()}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Login to BitHarbor backend
   */
  async login(email: string, password: string): Promise<{ accessToken: string; user: any }> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      user: {
        Id: email, // Use email as ID
        Name: email.split('@')[0],
        ServerId: 'bitharbor',
      },
    };
  }

  /**
   * First-time setup (creates admin account)
   */
  async setup(email: string, password: string, participants?: any[]): Promise<{ accessToken: string }> {
    const response = await fetch(`${this.baseUrl}/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, participants }),
    });

    if (!response.ok) {
      throw new Error('Setup failed');
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
    };
  }

  /**
   * Get all media items
   */
  async getMedia(params?: {
    limit?: number;
    offset?: number;
    participant_id?: string;
  }): Promise<{ Items: MediaItem[]; TotalRecordCount: number }> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.participant_id) queryParams.append('participant_id', params.participant_id);

    const url = `${this.baseUrl}/media${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      throw new Error('Failed to fetch media');
    }

    const data = await response.json();
    return {
      Items: (data.media_items || []).map((item: BitHarborMediaItem) => 
        this.transformMediaItem(item, item.media_id)
      ),
      TotalRecordCount: data.total_count || data.media_items?.length || 0,
    };
  }

  /**
   * Get single media item by ID
   */
  async getMediaById(mediaId: string): Promise<MediaItem | null> {
    const response = await fetch(`${this.baseUrl}/media/${mediaId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      return null;
    }

    const data: BitHarborMediaItem = await response.json();
    return this.transformMediaItem(data, data.media_id);
  }

  /**
   * Smart vector search using ImageBind embeddings
   * This is THE killer feature - semantic search, not just keywords!
   */
  async vectorSearch(
    queryText: string,
    options: {
      top_k?: number;
      participant_id?: string;
      threshold?: number;
    } = {}
  ): Promise<{ items: MediaItem[]; scores: number[] }> {
    const request: BitHarborSearchRequest = {
      query_text: queryText,
      top_k: options.top_k || 20,
      participant_id: options.participant_id,
      threshold: options.threshold || 0.5,
    };

    const response = await fetch(`${this.baseUrl}/search`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Search failed');
    }

    const data = await response.json();
    const results: BitHarborSearchResult[] = data.results || [];

    return {
      items: results.map(r => this.transformMediaItem(r.metadata, r.media_id)),
      scores: results.map(r => r.score),
    };
  }

  /**
   * Get stream URL for media playback
   */
  getStreamUrl(mediaId: string): string {
    return `${this.baseUrl}/media/${mediaId}/stream`;
  }

  /**
   * Ingest new media file
   */
  async ingestMedia(filePath: string, participantId?: string): Promise<{ mediaId: string }> {
    const response = await fetch(`${this.baseUrl}/ingest/start`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        path: filePath,
        participant_id: participantId,
      }),
    });

    if (!response.ok) {
      throw new Error('Ingest failed');
    }

    const data = await response.json();
    return {
      mediaId: data.media_id || data.file_hash,
    };
  }

  /**
   * Get participants (for admin)
   */
  async getParticipants(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/admin/participants`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch participants');
    }

    const data = await response.json();
    return data.participants || [];
  }

  /**
   * Check health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl.replace('/api/v1', '')}/healthz`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const bitHarborAdapter = new BitHarborAdapter();
