/**
 * API Client Configuration
 * 
 * Supports both mock API (for development) and BitHarbor backend (for production).
 * Switch between them using environment variable: VITE_BACKEND_TYPE
 */

import { MediaApiService } from './api';
import { BitHarborAdapter } from './bitharbor-adapter';

export type BackendType = 'mock' | 'bitharbor';

export class UnifiedApiClient {
  private backendType: BackendType;
  private mockApi: MediaApiService;
  private bitHarborApi: BitHarborAdapter;

  constructor() {
    // @ts-ignore - Vite env variable
    this.backendType = (import.meta.env?.VITE_BACKEND_TYPE || 'mock') as BackendType;
    // @ts-ignore - Vite env variable
    const backendUrl = import.meta.env?.VITE_BITHARBOR_URL || 'http://localhost:8080/api/v1';
    
    this.mockApi = new MediaApiService();
    this.bitHarborApi = new BitHarborAdapter(backendUrl);

    console.log(`🔧 API Client initialized with backend: ${this.backendType}`);
    console.log(`🌐 Backend URL: ${backendUrl}`);
    // @ts-ignore
    console.log('🔍 Debug - import.meta.env:', import.meta.env);
  }

  /**
   * Get current backend type
   */
  getBackendType(): BackendType {
    return this.backendType;
  }

  /**
   * Smart search - uses vector search if BitHarbor, keyword search if mock
   */
  async search(query: string, limit = 20): Promise<any[]> {
    if (this.backendType === 'bitharbor') {
      console.log('🔍 [BitHarbor] Vector search:', query);
      const result = await this.bitHarborApi.vectorSearch(query, undefined, { k: limit });
      return result.items;
    } else {
      console.log('🔍 [Mock] Keyword search:', query);
      return this.mockApi.search(query, limit);
    }
  }

  /**
   * Advanced vector search (BitHarbor only)
   * Returns items with similarity scores
   */
  async vectorSearch(
    query: string,
    options: { top_k?: number; threshold?: number } = {}
  ): Promise<{ items: any[]; scores: number[] }> {
    if (this.backendType === 'bitharbor') {
      return this.bitHarborApi.vectorSearch(query, undefined, { k: options.top_k });
    } else {
      // Fallback to regular search, no scores
      const items = await this.mockApi.search(query, options.top_k);
      return { items, scores: items.map(() => 1.0) };
    }
  }

  /**
   * Get libraries (mock API only - BitHarbor doesn't have libraries concept)
   */
  async getLibraries() {
    if (this.backendType === 'mock') {
      return this.mockApi.getLibraries();
    } else {
      // BitHarbor: Create virtual "All Media" library
      return [{
        Id: 'all-media',
        Name: 'All Media',
        CollectionType: 'mixed',
      }];
    }
  }

  /**
   * Get library items
   */
  async getLibraryItems(libraryId: string, options: any = {}) {
    if (this.backendType === 'mock') {
      return this.mockApi.getLibraryItems(libraryId, options);
    } else {
      // BitHarbor: Get all media (no library filtering)
      const result = await this.bitHarborApi.getMedia(null, {
        limit: options.limit || 50,
        offset: options.startIndex || 0,
      });
      return {
        items: result.Items,
        totalCount: result.TotalRecordCount,
      };
    }
  }

  /**
   * Get item by ID
   */
  async getItemById(itemId: string) {
    if (this.backendType === 'mock') {
      return this.mockApi.getItemById(itemId);
    } else {
      return this.bitHarborApi.getMediaById(itemId);
    }
  }

  /**
   * Get continue watching items
   */
  async getContinueWatching(limit = 12) {
    if (this.backendType === 'mock') {
      return this.mockApi.getContinueWatching(limit);
    } else {
      // BitHarbor: Get recent media as fallback
      const result = await this.bitHarborApi.getMedia(null, { limit });
      return result.Items;
    }
  }

  /**
   * Get recently added items
   */
  async getRecentlyAdded(limit = 12) {
    if (this.backendType === 'mock') {
      return this.mockApi.getRecentlyAdded(limit);
    } else {
      const result = await this.bitHarborApi.getMedia(null, { limit });
      return result.Items;
    }
  }

  /**
   * Get favorites
   */
  async getFavorites(limit = 12) {
    if (this.backendType === 'mock') {
      return this.mockApi.getFavorites(limit);
    } else {
      // BitHarbor: No favorites yet, return empty
      return [];
    }
  }

  /**
   * Toggle favorite
   */
  async toggleFavorite(itemId: string, isFavorite: boolean) {
    if (this.backendType === 'mock') {
      return this.mockApi.toggleFavorite(itemId, isFavorite);
    } else {
      // BitHarbor: Not implemented yet
      console.warn('Favorites not supported in BitHarbor backend yet');
      return false;
    }
  }

  /**
   * Report playback progress
   */
  async reportPlaybackProgress(itemId: string, positionSeconds: number, isPaused: boolean) {
    if (this.backendType === 'mock') {
      return this.mockApi.reportPlaybackProgress(itemId, positionSeconds, isPaused);
    } else {
      // BitHarbor: Not implemented yet
      console.log('Playback tracking not implemented in BitHarbor yet');
      return false;
    }
  }

  /**
   * Report playback stopped
   */
  async reportPlaybackStopped(itemId: string, positionSeconds: number) {
    if (this.backendType === 'mock') {
      return this.mockApi.reportPlaybackStopped(itemId, positionSeconds);
    } else {
      return false;
    }
  }

  /**
   * Mark as played
   */
  async markAsPlayed(itemId: string) {
    if (this.backendType === 'mock') {
      return this.mockApi.markAsPlayed(itemId);
    } else {
      return false;
    }
  }

  /**
   * Get image URL
   */
  getImageUrl(itemId: string, imageType = 'Primary', width?: number) {
    if (this.backendType === 'mock') {
      return this.mockApi.getImageUrl(itemId, imageType, width);
    } else {
      // BitHarbor: Use media stream endpoint for thumbnails (if supported)
      // For now, return placeholder
      return `https://via.placeholder.com/${width || 300}x${Math.floor((width || 300) * 1.5)}?text=${encodeURIComponent('Media')}`;
    }
  }

  /**
   * Get stream URL
   */
  getStreamUrl(itemId: string) {
    if (this.backendType === 'mock') {
      // Mock: return dummy URL
      return `http://localhost:8096/Videos/${itemId}/stream.mp4`;
    } else {
      // BitHarbor: stream URL requires media type, but we don't have it here
      // This is a limitation - in real usage, we should pass the item's type
      return this.bitHarborApi.getStreamUrl(itemId, undefined);
    }
  }
}

// Export singleton
export const unifiedApiClient = new UnifiedApiClient();
