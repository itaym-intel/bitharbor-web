import { jellyfinClient } from './client';
import type { Library, MediaItem } from '@/types/jellyfin';

export class JellyfinApiService {
  private getUserId(): string {
    const userData = localStorage.getItem('jellyfin_user');
    if (!userData) throw new Error('User not logged in');
    return JSON.parse(userData).Id;
  }

  getImageUrl(itemId: string, imageType = 'Primary', width?: number): string {
    const url = jellyfinClient.getServerUrl() + '/Items/' + itemId + '/Images/' + imageType;
    return width ? url + '?width=' + width + '&quality=90' : url;
  }

  async getLibraries(): Promise<Library[]> {
    try {
      const userId = this.getUserId();
      const url = jellyfinClient.getServerUrl() + '/Users/' + userId + '/Views';
      const response = await fetch(url, {
        headers: { 'X-Emby-Token': jellyfinClient.getAccessToken() },
      });
      const data = await response.json();
      return (data.Items || []).map((item: any) => ({
        Id: item.Id,
        Name: item.Name,
        CollectionType: item.CollectionType,
      }));
    } catch (error) {
      console.error('Failed to fetch libraries:', error);
      return [];
    }
  }

  async getContinueWatching(limit = 12): Promise<MediaItem[]> {
    try {
      const userId = this.getUserId();
      const url = jellyfinClient.getServerUrl() + '/Users/' + userId + '/Items/Resume?Limit=' + limit;
      const response = await fetch(url, {
        headers: { 'X-Emby-Token': jellyfinClient.getAccessToken() },
      });
      const data = await response.json();
      return this.mapItems(data.Items || []);
    } catch (error) {
      console.error('Failed:', error);
      return [];
    }
  }

  async getRecentlyAdded(limit = 12): Promise<MediaItem[]> {
    try {
      const userId = this.getUserId();
      const url = jellyfinClient.getServerUrl() + '/Users/' + userId + '/Items/Latest?Limit=' + limit;
      const response = await fetch(url, {
        headers: { 'X-Emby-Token': jellyfinClient.getAccessToken() },
      });
      const data = await response.json();
      return this.mapItems(data);
    } catch (error) {
      console.error('Failed:', error);
      return [];
    }
  }

  async getFavorites(limit = 12): Promise<MediaItem[]> {
    try {
      const userId = this.getUserId();
      const params = new URLSearchParams({
        Filters: 'IsFavorite',
        Recursive: 'true',
        Limit: limit.toString(),
        SortBy: 'SortName',
        SortOrder: 'Ascending',
      });
      const url = `${jellyfinClient.getServerUrl()}/Users/${userId}/Items?${params.toString()}`;
      const response = await fetch(url, {
        headers: { 'X-Emby-Token': jellyfinClient.getAccessToken() },
      });
      const data = await response.json();
      return this.mapItems(data.Items || []);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      return [];
    }
  }

  async getLibraryItems(
    libraryId: string,
    options: {
      sortBy?: 'SortName' | 'PremiereDate' | 'CommunityRating' | 'DateCreated';
      sortOrder?: 'Ascending' | 'Descending';
      genres?: string[];
      limit?: number;
      startIndex?: number;
    } = {}
  ): Promise<{ items: MediaItem[]; totalCount: number }> {
    try {
      const userId = this.getUserId();
      const params = new URLSearchParams({
        ParentId: libraryId,
        IncludeItemTypes: 'Movie,Series,MusicAlbum',
        Recursive: 'true',
        Fields: 'PrimaryImageAspectRatio,BasicSyncInfo,ProductionYear',
        ImageTypeLimit: '1',
        EnableImageTypes: 'Primary,Backdrop,Thumb',
      });

      if (options.sortBy) params.append('SortBy', options.sortBy);
      if (options.sortOrder) params.append('SortOrder', options.sortOrder);
      if (options.genres && options.genres.length > 0) {
        params.append('Genres', options.genres.join(','));
      }
      if (options.limit) params.append('Limit', options.limit.toString());
      if (options.startIndex) params.append('StartIndex', options.startIndex.toString());

      const url = `${jellyfinClient.getServerUrl()}/Users/${userId}/Items?${params.toString()}`;
      const response = await fetch(url, {
        headers: { 'X-Emby-Token': jellyfinClient.getAccessToken() },
      });
      const data = await response.json();
      
      return {
        items: this.mapItems(data.Items || []),
        totalCount: data.TotalRecordCount || 0,
      };
    } catch (error) {
      console.error('Failed to fetch library items:', error);
      return { items: [], totalCount: 0 };
    }
  }

  async getItemById(itemId: string): Promise<MediaItem | null> {
    try {
      const userId = this.getUserId();
      const url = `${jellyfinClient.getServerUrl()}/Users/${userId}/Items/${itemId}`;
      const response = await fetch(url, {
        headers: { 'X-Emby-Token': jellyfinClient.getAccessToken() },
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return this.mapItems([data])[0];
    } catch (error) {
      console.error('Failed to fetch item:', error);
      return null;
    }
  }

  async toggleFavorite(itemId: string, isFavorite: boolean): Promise<boolean> {
    try {
      const userId = this.getUserId();
      const url = `${jellyfinClient.getServerUrl()}/Users/${userId}/FavoriteItems/${itemId}`;
      const method = isFavorite ? 'DELETE' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'X-Emby-Token': jellyfinClient.getAccessToken() },
      });
      
      return response.ok;
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      return false;
    }
  }

  private mapItems(items: any[]): MediaItem[] {
    return items.map(item => ({
      Id: item.Id || '',
      Name: item.Name || '',
      Type: item.Type || '',
      Overview: item.Overview,
      ImageTags: item.ImageTags,
      UserData: item.UserData,
      ProductionYear: item.ProductionYear,
      RunTimeTicks: item.RunTimeTicks,
      OfficialRating: item.OfficialRating,
      CommunityRating: item.CommunityRating,
      Genres: item.Genres,
    }));
  }
}

export const jellyfinApi = new JellyfinApiService();
