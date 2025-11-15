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

export interface MediaItem {
  Id: string;
  Name: string;
  Type: string;
  SeriesName?: string;
  SeasonName?: string;
  IndexNumber?: number; // Episode number
  ParentIndexNumber?: number; // Season number
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
}

export interface Library {
  Id: string;
  Name: string;
  CollectionType?: string;
  ItemId?: string;
}
