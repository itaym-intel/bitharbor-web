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
  MediaDetail, 
  IngestRequest, 
  IngestResponse,
  BitHarborAuthResponse,
  BitHarborSetupRequest,
  Admin,
  Participant,
  ParticipantRole,
  CatalogMatchResponse,
  CatalogDownloadRequest,
  CatalogDownloadResponse,
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
    const enriched = detail.enriched_metadata;
    
    // Extract data from enriched_metadata if available
    let baseItem: MediaItem = {
      Id: detail.media_id,
      Name: detail.title || metadata.title || 'Unknown',
      Type: detail.type,
      MediaType: detail.type,
      SourceType: detail.source_type,
      Overview: metadata.description || metadata.overview,
      ImageTags: metadata.poster_url ? { Primary: 'has-image' } : undefined,
      PosterUrl: metadata.poster_url,
      BackdropUrl: metadata.backdrop_url,
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
    };

    // Enrich with type-specific metadata
    if (enriched?.movie) {
      const movie = enriched.movie;
      baseItem = {
        ...baseItem,
        Name: movie.title,
        OriginalTitle: movie.original_title || undefined,
        Overview: movie.overview || baseItem.Overview,
        ProductionYear: movie.year || baseItem.ProductionYear,
        ReleaseDate: movie.release_date || undefined,
        RuntimeMinutes: movie.runtime_min || undefined,
        RunTimeTicks: movie.runtime_min ? movie.runtime_min * 60 * 10000000 : baseItem.RunTimeTicks,
        Genres: movie.genres || baseItem.Genres,
        CommunityRating: movie.vote_average || baseItem.CommunityRating,
        Cast: movie.cast?.map(c => c.name) || undefined,
        Director: movie.crew?.find(c => c.job === 'Director')?.name,
        ImageTags: movie.poster_url ? { Primary: 'has-image' } : baseItem.ImageTags,
        PosterUrl: movie.poster_url || baseItem.PosterUrl,
        BackdropUrl: movie.backdrop_url || baseItem.BackdropUrl,
        Tagline: movie.tagline || undefined,
        Budget: movie.budget || undefined,
        Revenue: movie.revenue || undefined,
      };
    } else if (enriched?.tv_show || enriched?.tv_episode) {
      const show = enriched.tv_show;
      const episode = enriched.tv_episode;
      
      if (episode) {
        baseItem = {
          ...baseItem,
          Name: episode.name,
          SeriesName: episode.series_name || show?.name || undefined,
          SeasonNumber: episode.season_number,
          EpisodeNumber: episode.episode_number,
          Overview: episode.overview || show?.overview || baseItem.Overview,
          AirDate: episode.air_date || undefined,
          RuntimeMinutes: episode.runtime_min || undefined,
          RunTimeTicks: episode.runtime_min ? episode.runtime_min * 60 * 10000000 : baseItem.RunTimeTicks,
          CommunityRating: episode.vote_average || show?.vote_average || baseItem.CommunityRating,
          Cast: episode.cast?.map(c => c.name) || show?.cast?.map(c => c.name) || undefined,
        };
      }
      
      if (show) {
        baseItem = {
          ...baseItem,
          Genres: show.genres || baseItem.Genres,
          ProductionYear: show.first_air_date ? new Date(show.first_air_date).getFullYear() : baseItem.ProductionYear,
          ImageTags: show.poster_url ? { Primary: 'has-image' } : baseItem.ImageTags,
        };
      }
    } else if (enriched?.music) {
      const music = enriched.music;
      baseItem = {
        ...baseItem,
        Name: music.title,
        Artist: music.artist || undefined,
        Album: music.album || undefined,
        TrackNumber: music.track_number || undefined,
        DiscNumber: music.disc_number || undefined,
        Duration: music.duration_s || undefined,
        RunTimeTicks: music.duration_s ? music.duration_s * 10000000 : baseItem.RunTimeTicks,
        ProductionYear: music.year || baseItem.ProductionYear,
        Genres: music.genres || baseItem.Genres,
      };
    } else if (enriched?.podcast) {
      const podcast = enriched.podcast;
      baseItem = {
        ...baseItem,
        Name: podcast.title,
        ShowName: podcast.show_name || undefined,
        EpisodeTitle: podcast.title,
        Overview: podcast.description || baseItem.Overview,
        PubDate: podcast.pub_date || undefined,
        Duration: podcast.duration_s || undefined,
        RunTimeTicks: podcast.duration_s ? podcast.duration_s * 10000000 : baseItem.RunTimeTicks,
        ImageTags: podcast.image_url ? { Primary: 'has-image' } : baseItem.ImageTags,
      };
    }

    // Fallback to basic metadata if no enriched data
    if (!enriched) {
      baseItem = {
        ...baseItem,
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
    
    return baseItem;
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
  async login(email: string, password: string): Promise<{ accessToken: string; user: any; admin?: Admin; participants?: Participant[] }> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data: BitHarborAuthResponse = await response.json();
    return {
      accessToken: data.access_token,
      user: {
        Id: data.admin.admin_id,
        Name: data.admin.display_name || data.admin.email.split('@')[0],
        ServerId: 'bitharbor',
      },
      admin: data.admin,
      participants: data.participants,
    };
  }

  /**
   * First-time setup (creates admin account)
   */
  async setup(email: string, password: string, displayName: string, participants?: Participant[]): Promise<{ accessToken: string; admin: Admin; participants: Participant[] }> {
    const request: BitHarborSetupRequest = {
      email,
      password,
      display_name: displayName,
      participants,
    };

    const response = await fetch(`${this.baseUrl}/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Setup failed');
    }

    const data: BitHarborAuthResponse = await response.json();
    return {
      accessToken: data.access_token,
      admin: data.admin,
      participants: data.participants,
    };
  }

  /**
   * Get current admin details
   */
  async getMe(): Promise<{ admin: Admin }> {
    const response = await fetch(`${this.baseUrl}/auth/me`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get admin details');
    }

    return await response.json();
  }

  /**
   * Participant Management
   */
  async getParticipants(): Promise<Participant[]> {
    const response = await fetch(`${this.baseUrl}/admin/participants`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get participants');
    }

    return await response.json();
  }

  async createParticipant(participant: Omit<Participant, 'participant_id'>): Promise<Participant> {
    const response = await fetch(`${this.baseUrl}/admin/participants`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(participant),
    });

    if (!response.ok) {
      throw new Error('Failed to create participant');
    }

    return await response.json();
  }

  async updateParticipant(participantId: string, updates: Partial<Omit<Participant, 'participant_id' | 'handle'>>): Promise<Participant> {
    const response = await fetch(`${this.baseUrl}/admin/participants/${participantId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update participant');
    }

    return await response.json();
  }

  async assignRole(participantId: string, role: ParticipantRole): Promise<Participant> {
    const response = await fetch(`${this.baseUrl}/admin/participants/${participantId}/assign`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      throw new Error('Failed to assign role');
    }

    return await response.json();
  }

  async getParticipant(participantId: string): Promise<Participant> {
    const response = await fetch(`${this.baseUrl}/participants/${participantId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get participant');
    }

    return await response.json();
  }


  /**
   * Get all media items for a specific type (or all types if type is null)
   */
  async getMedia(
    type: MediaType | null,
  ): Promise<{ Items: MediaItem[]; TotalRecordCount: number }> {
    // If no type specified, query all types and combine
    if (type === null) {
      const allTypes: MediaType[] = ['movie', 'tv', 'music', 'podcast', 'video', 'personal'];
      const results = await Promise.all(
        allTypes.map(t => this.getMedia(t))
      );
      
      // Combine and flatten results
      const allItems = results.flatMap(r => r.Items);
      
      return {
        Items: allItems,
        TotalRecordCount: results.reduce((sum, r) => sum + r.TotalRecordCount, 0),
      };
    }

    const typeRoute = this.getTypeRoute(type);
    
    // Use /all endpoint to list all media of this type (no pagination params)
    const url = `${this.baseUrl}/${typeRoute}/all`;
    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      throw new Error('Failed to fetch media');
    }

    // /all endpoint returns an array directly, not { items, total }
    const data: any[] = await response.json();
    console.log(`📦 [${typeRoute}/all] Response:`, JSON.stringify(data, null, 2));
    
    // Transform each item from the /all format to MediaDetail format
    const mediaDetails = data.map((item): MediaDetail => ({
      media_id: item.file_hash, // Use file_hash as unique ID
      type: type,
      title: item.title,
      source_type: 'catalog' as 'catalog',
      vector_hash: item.embedding_hash,
      file_hash: item.file_hash,
      metadata: {
        title: item.title,
        year: item.year,
        description: item.overview,
        overview: item.overview,
        poster_url: item.poster?.file_path,
        backdrop_url: item.backdrop?.file_path,
        rating: item.vote_average,
        genres: item.genres,
        duration_seconds: item.runtime_min ? item.runtime_min * 60 : undefined,
      },
      enriched_metadata: type === 'movie' ? {
        movie: {
          title: item.title,
          original_title: item.title,
          overview: item.overview,
          year: item.year,
          tmdb_id: parseInt(item.catalog_id) || null,
          imdb_id: null,
          tagline: item.tagline || null,
          release_date: item.release_date,
          runtime_min: item.runtime_min,
          budget: null,
          revenue: null,
          vote_average: item.vote_average,
          vote_count: item.vote_count,
          poster_url: item.poster?.file_path,
          backdrop_url: item.backdrop?.file_path,
          posters: null,
          backdrops: null,
          poster_path: null,
          backdrop_path: null,
          cast: item.cast || null,
          crew: null,
          genres: item.genres || null,
          languages: item.languages || null,
          countries: null,
          homepage: null,
          status: 'Released',
          popularity: null,
          adult: null,
        }
      } : null,
    }));
    
    return {
      Items: mediaDetails.map(item => this.transformMediaItem(item)),
      TotalRecordCount: data.length,
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
   * Search upstream catalog (TMDb + Internet Archive) for movies not yet ingested
   */
  async searchCatalogMovies(
    query: string,
    options: { limit?: number; year?: number } = {}
  ): Promise<CatalogMatchResponse> {
    const params = new URLSearchParams({ query });
    const limit = options.limit ?? 10;
    params.set('limit', limit.toString());
    if (options.year) {
      params.set('year', options.year.toString());
    }

    const response = await fetch(`${this.baseUrl}/movies/catalog/search?${params.toString()}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Catalog search failed');
    }

    return await response.json();
  }

  /**
   * Trigger catalog download for a movie match key (plan or execute)
   */
  async downloadCatalogMovie(request: CatalogDownloadRequest): Promise<CatalogDownloadResponse> {
    const payload: CatalogDownloadRequest = {
      match_key: request.match_key,
      execute: request.execute ?? true,
    };

    const response = await fetch(`${this.baseUrl}/movies/catalog/download`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Catalog download failed');
    }

    return await response.json();
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
   * 
   * NOTE: After ingesting media, you should invalidate the React Query cache
   * for the corresponding media type to ensure the UI reflects the new data:
   * 
   * ```typescript
   * await bitHarborAdapter.ingestMedia(...);
   * queryClient.invalidateQueries({ queryKey: [mediaType] });
   * ```
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

// Export singleton instance with environment variable
// @ts-ignore - Vite env variable
const backendUrl = import.meta.env?.VITE_BITHARBOR_URL || 'http://localhost:8080/api/v1';
console.log('🔧 BitHarborAdapter initialized with URL:', backendUrl);
export const bitHarborAdapter = new BitHarborAdapter(backendUrl);
