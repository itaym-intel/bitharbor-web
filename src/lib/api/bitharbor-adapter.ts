/**
 * BitHarbor Backend Adapter
 * 
 * Adapts BitHarbor's API structure to match our frontend's expected format.
 * Allows seamless switching between mock API and real BitHarbor backend.
 * 
 * Updated for type-specific routes: /api/v1/{type}/search, /api/v1/{type}/media, etc.
 */

import { apiService } from './client';
import type { 
  MediaItem, 
  MediaType, 
  MediaTypeRoute, 
  SearchRequest, 
  SearchResponse, 
  MediaListResponse, 
  MediaDetail, 
  IngestRequest, 
  IngestResponse 
} from '@/types/api';

export class BitHarborAdapter {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080/api/v1') {
    this.baseUrl = baseUrl;
  }

  /**
   * Map MediaType to API route segment
   */
  private getTypeRoute(type: MediaType): MediaTypeRoute {
    const mapping: Record<MediaType, MediaTypeRoute> = {
      'movie': 'movies',
      'tv': 'tv',
      'music': 'music',
      'podcast': 'podcasts',
      'video': 'videos',
      'personal': 'personal',
    };
    return mapping[type];
  }

  /**
   * Transform BitHarbor MediaDetail to our MediaItem format
   */
  private transformMediaItem(detail: MediaDetail): MediaItem {
    const metadata = detail.metadata || {};
    
    return {
      Id: detail.media_id,
      Name: detail.title || metadata.title || 'Unknown',
      Type: detail.type,
      MediaType: detail.type,
      SourceType: detail.source_type,
      Overview: metadata.description || metadata.overview,
      ImageTags: metadata.poster_url ? { Primary: 'has-image' } : undefined,
      UserData: {
        PlaybackPositionTicks: 0,
        IsFavorite: false,
        Played: false,
      },
      ProductionYear: metadata.year,
      RunTimeTicks: metadata.duration_seconds ? metadata.duration_seconds * 10000000 : undefined,
      Genres: metadata.genres || [],
      CommunityRating: metadata.rating,
      OfficialRating: metadata.content_rating,
      // Movie-specific
      OriginalTitle: metadata.original_title,
      ReleaseDate: metadata.release_date,
      RuntimeMinutes: metadata.runtime_minutes,
      Cast: metadata.cast,
      Director: metadata.director,
      // TV-specific
      SeriesName: metadata.series_name,
      SeasonNumber: metadata.season_number,
      EpisodeNumber: metadata.episode_number,
      AirDate: metadata.air_date,
      // Music-specific
      Artist: metadata.artist,
      Album: metadata.album,
      AlbumArtist: metadata.album_artist,
      TrackNumber: metadata.track_number,
      DiscNumber: metadata.disc_number,
      Duration: metadata.duration,
      // Podcast-specific
      ShowName: metadata.show_name,
      PubDate: metadata.pub_date,
      EpisodeTitle: metadata.episode_title,
      // Personal-specific
      CaptureDate: metadata.capture_date,
      DeviceMake: metadata.device_make,
      DeviceModel: metadata.device_model,
      GpsLat: metadata.gps_lat,
      GpsLon: metadata.gps_lon,
      AlbumName: metadata.album_name,
      // Video-specific
      Platform: metadata.platform,
      ChannelName: metadata.channel_name,
      Uploader: metadata.uploader,
    };
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
   * Get all media items for a specific type (or all types if type is null)
   */
  async getMedia(
    type: MediaType | null,
    params?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<{ Items: MediaItem[]; TotalRecordCount: number }> {
    // If no type specified, query all types and combine
    if (type === null) {
      const allTypes: MediaType[] = ['movie', 'tv', 'music', 'podcast', 'video', 'personal'];
      const results = await Promise.all(
        allTypes.map(t => this.getMedia(t, params))
      );
      
      // Combine and flatten results
      const allItems = results.flatMap(r => r.Items);
      const limit = params?.limit || 50;
      const offset = params?.offset || 0;
      
      return {
        Items: allItems.slice(offset, offset + limit),
        TotalRecordCount: results.reduce((sum, r) => sum + r.TotalRecordCount, 0),
      };
    }

    const typeRoute = this.getTypeRoute(type);
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${this.baseUrl}/${typeRoute}/media${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      throw new Error('Failed to fetch media');
    }

    const data: MediaListResponse = await response.json();
    return {
      Items: data.items.map(item => this.transformMediaItem(item)),
      TotalRecordCount: data.total,
    };
  }

  /**
   * Get single media item by ID (requires knowing the type)
   * If type is unknown, will try all types
   */
  async getMediaById(mediaId: string, type?: MediaType): Promise<MediaItem | null> {
    // If type provided, query that type directly
    if (type) {
      const typeRoute = this.getTypeRoute(type);
      const response = await fetch(`${this.baseUrl}/${typeRoute}/media/${mediaId}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const data: MediaDetail = await response.json();
      return this.transformMediaItem(data);
    }

    // If type unknown, try all types until we find it
    const allTypes: MediaType[] = ['movie', 'tv', 'music', 'podcast', 'video', 'personal'];
    for (const t of allTypes) {
      const item = await this.getMediaById(mediaId, t);
      if (item) {
        return item;
      }
    }

    return null;
  }

  /**
   * Smart vector search using ImageBind embeddings
   * Searches across a specific type or all types
   */
  async vectorSearch(
    queryText: string,
    type?: MediaType,
    options: {
      k?: number;
    } = {}
  ): Promise<{ items: MediaItem[]; scores: number[] }> {
    // If no type, search all types and combine
    if (!type) {
      const allTypes: MediaType[] = ['movie', 'tv', 'music', 'podcast', 'video', 'personal'];
      const results = await Promise.all(
        allTypes.map(t => this.vectorSearch(queryText, t, options))
      );
      
      // Combine and sort by score
      const combined = results.flatMap(r => 
        r.items.map((item, i) => ({ item, score: r.scores[i] }))
      );
      combined.sort((a, b) => b.score - a.score);
      
      // Take top k
      const k = options.k || 20;
      const topResults = combined.slice(0, k);
      
      return {
        items: topResults.map(r => r.item),
        scores: topResults.map(r => r.score),
      };
    }

    const typeRoute = this.getTypeRoute(type);
    const request: SearchRequest = {
      query: queryText,
      k: options.k || 20,
    };

    const response = await fetch(`${this.baseUrl}/${typeRoute}/search`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Search failed');
    }

    const data: SearchResponse = await response.json();
    
    // Transform search results to MediaItem format
    const items: MediaItem[] = data.results.map(result => ({
      Id: result.media_id,
      Name: result.title,
      Type: result.type,
      MediaType: result.type,
      Overview: undefined,
      UserData: {
        PlaybackPositionTicks: 0,
        IsFavorite: false,
        Played: false,
      },
    }));

    return {
      items,
      scores: data.results.map(r => r.score),
    };
  }

  /**
   * Get stream URL for media playback
   */
  getStreamUrl(mediaId: string, type?: MediaType): string {
    // If type not provided, we can't construct the URL
    // This is a limitation of the type-specific routes
    if (!type) {
      console.warn('⚠️ Stream URL requires media type, using "movie" as fallback');
      type = 'movie';
    }
    const typeRoute = this.getTypeRoute(type);
    return `${this.baseUrl}/${typeRoute}/media/${mediaId}/stream`;
  }

  /**
   * Ingest new media file
   */
  async ingestMedia(
    type: MediaType,
    filePath: string,
    sourceType: 'catalog' | 'home',
    metadata?: Record<string, any>,
    posterPath?: string
  ): Promise<{ mediaId: string; fileHash: string; vectorHash: string }> {
    const typeRoute = this.getTypeRoute(type);
    const request: IngestRequest = {
      path: filePath,
      source_type: sourceType,
      metadata: metadata || {},
      poster_path: posterPath,
    };

    const response = await fetch(`${this.baseUrl}/${typeRoute}/ingest/start`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Ingest failed');
    }

    const data: IngestResponse = await response.json();
    return {
      mediaId: data.media_id,
      fileHash: data.file_hash,
      vectorHash: data.vector_hash,
    };
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
