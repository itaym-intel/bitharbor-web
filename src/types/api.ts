export interface ServerInfo {
  Id: string;
  Name: string;
  Version: string;
  LocalAddress: string;
}

export interface User {
  Id: string;
  Name: string;
  ServerId: string;
  HasPassword: boolean;
  HasConfiguredPassword: boolean;
  LastLoginDate?: string;
}

export interface AuthResponse {
  User: User;
  AccessToken: string;
  ServerId: string;
}

// BitHarbor media types
export type MediaType = 'movie' | 'tv' | 'music' | 'podcast' | 'video' | 'personal';
export type SourceType = 'catalog' | 'home';

export interface MediaItem {
  Id: string;
  Name: string;
  Type: MediaType; // BitHarbor media type
  MediaType?: MediaType; // Alias for Type
  SourceType?: SourceType; // catalog (movies/tv) or home (personal media)
  SeriesName?: string;
  SeasonName?: string;
  IndexNumber?: number; // Episode number or track number
  ParentIndexNumber?: number; // Season number or disc number
  Overview?: string;
  ImageTags?: Record<string, string>;
  UserData?: {
    PlayedPercentage?: number;
    Played: boolean;
    IsFavorite: boolean;
    PlaybackPositionTicks: number;
  };
  ProductionYear?: number;
  RunTimeTicks?: number;
  OfficialRating?: string;
  CommunityRating?: number;
  Genres?: string[];
  // Movie-specific
  OriginalTitle?: string;
  ReleaseDate?: string;
  RuntimeMinutes?: number;
  Cast?: string[];
  Director?: string;
  // TV-specific
  SeriesId?: string;
  SeasonNumber?: number;
  EpisodeNumber?: number;
  AirDate?: string;
  // Music-specific
  Artist?: string;
  Album?: string;
  AlbumArtist?: string;
  TrackNumber?: number;
  DiscNumber?: number;
  Duration?: number; // seconds
  // Podcast-specific
  ShowName?: string;
  PubDate?: string;
  EpisodeTitle?: string;
  // Personal media-specific
  CaptureDate?: string;
  DeviceMake?: string;
  DeviceModel?: string;
  GpsLat?: number;
  GpsLon?: number;
  AlbumName?: string;
  // Video-specific (online videos)
  Platform?: string; // youtube, vimeo, etc
  ChannelName?: string;
  Uploader?: string;
}

export interface Library {
  Id: string;
  Name: string;
  CollectionType?: string;
  ItemId?: string;
}
