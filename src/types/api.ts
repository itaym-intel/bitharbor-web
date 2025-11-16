export interface ServerInfo {
  Id: string;
  Name: string;
  Version: string;
  LocalAddress: string;
}

// Legacy User interface (for backward compatibility)
export interface User {
  Id: string;
  Name: string;
  ServerId: string;
  HasPassword: boolean;
  HasConfiguredPassword: boolean;
  LastLoginDate?: string;
}

// Legacy AuthResponse (for backward compatibility)
export interface AuthResponse {
  User: User;
  AccessToken: string;
  ServerId: string;
}

// BitHarbor Admin and Participant types
export interface Admin {
  admin_id: string;
  email: string;
  display_name: string;
}

export type ParticipantRole = 'viewer' | 'editor' | 'admin';

export interface Participant {
  participant_id: string;
  handle: string;
  display_name: string;
  email: string;
  role: ParticipantRole;
  preferences_json: string | null;
}

export interface BitHarborAuthResponse {
  access_token: string;
  token_type: 'bearer';
  admin: Admin;
  participants: Participant[];
}

export interface BitHarborSetupRequest {
  email: string;
  password: string;
  display_name: string;
  participants?: Array<{
    handle: string;
    display_name: string;
    email: string;
    role: ParticipantRole;
  }>;
}

export interface BitHarborLoginRequest {
  email: string;
  password: string;
}

// BitHarbor media types
export type MediaType = 'movie' | 'tv' | 'music' | 'podcast' | 'video' | 'personal';
export type SourceType = 'catalog' | 'home';

// Cast and Crew types
export interface CastMember {
  name: string;
  character: string;
  order: number; // 0 = top billed
  profile_path: string | null;
}

export interface CrewMember {
  name: string;
  job: string; // "Director", "Writer", etc.
  department: string; // "Directing", "Writing", etc.
}

export interface ImageMetadata {
  file_path: string;
  width: number | null;
  height: number | null;
  aspect_ratio: number | null;
  vote_average: number | null;
  vote_count: number | null;
  iso_639_1: string | null; // Language code
}

// Enriched Metadata types
export interface MovieMetadata {
  tmdb_id: number | null;
  imdb_id: string | null;
  title: string;
  original_title: string | null;
  tagline: string | null;
  overview: string | null;
  release_date: string | null; // ISO 8601
  year: number | null;
  status: string | null;
  runtime_min: number | null;
  budget: number | null;
  revenue: number | null;
  genres: string[] | null;
  languages: string[] | null;
  countries: string[] | null;
  vote_average: number | null; // 0-10
  vote_count: number | null;
  popularity: number | null;
  cast: CastMember[] | null;
  crew: CrewMember[] | null;
  poster_path: string | null;
  backdrop_path: string | null;
  posters: ImageMetadata[] | null;
  backdrops: ImageMetadata[] | null;
  poster_url: string | null;
  backdrop_url: string | null;
  homepage: string | null;
  adult: boolean | null;
}

export interface TvShowMetadata {
  tmdb_id: number | null;
  imdb_id: string | null;
  tvmaze_id: number | null;
  name: string;
  original_name: string | null;
  tagline: string | null;
  overview: string | null;
  type: string | null;
  status: string | null;
  first_air_date: string | null; // ISO 8601
  last_air_date: string | null; // ISO 8601
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  genres: string[] | null;
  languages: string[] | null;
  countries: string[] | null;
  vote_average: number | null;
  vote_count: number | null;
  popularity: number | null;
  cast: CastMember[] | null;
  crew: CrewMember[] | null;
  created_by: string[] | null;
  poster_path: string | null;
  backdrop_path: string | null;
  posters: ImageMetadata[] | null;
  backdrops: ImageMetadata[] | null;
  poster_url: string | null;
  backdrop_url: string | null;
  homepage: string | null;
  networks: string[] | null;
}

export interface TvEpisodeMetadata {
  tmdb_id: number | null;
  imdb_id: string | null;
  tvmaze_id: number | null;
  series_name: string | null;
  series_tmdb_id: number | null;
  name: string;
  overview: string | null;
  season_number: number;
  episode_number: number;
  air_date: string | null; // ISO 8601
  runtime_min: number | null;
  vote_average: number | null;
  vote_count: number | null;
  cast: CastMember[] | null;
  crew: CrewMember[] | null;
  still_path: string | null;
  still_url: string | null;
}

export interface MusicTrackMetadata {
  musicbrainz_id: string | null;
  isrc: string | null;
  title: string;
  artist: string | null;
  album: string | null;
  track_number: number | null;
  disc_number: number | null;
  duration_s: number | null;
  year: number | null;
  genres: string[] | null;
}

export interface PodcastEpisodeMetadata {
  guid: string | null;
  title: string;
  show_name: string | null;
  description: string | null;
  pub_date: string | null; // ISO 8601
  duration_s: number | null;
  image_url: string | null;
}

export interface EnrichedMetadata {
  movie?: MovieMetadata;
  tv_show?: TvShowMetadata;
  tv_episode?: TvEpisodeMetadata;
  music?: MusicTrackMetadata;
  podcast?: PodcastEpisodeMetadata;
}

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
  PosterUrl?: string; // Direct URL to poster image
  BackdropUrl?: string; // Direct URL to backdrop image
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
  Tagline?: string;
  Budget?: number;
  Revenue?: number;
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

// BitHarbor type-specific route types
export type MediaTypeRoute = 'movies' | 'tv' | 'music' | 'podcasts' | 'videos' | 'personal';

export interface SearchRequest {
  query: string;
  k?: number; // default 20, max 100
}

export interface SearchResult {
  media_id: string;
  score: number;
  type: MediaType;
  title: string;
  preview_url: string | null;
}

export interface SearchResponse {
  results: SearchResult[];
}

export interface MediaListResponse {
  items: MediaDetail[];
  total: number;
}

export interface CatalogMovieDetails {
  title: string;
  tagline?: string | null;
  overview?: string | null;
  release_date?: string | null;
  year?: number | null;
  runtime_min?: number | null;
  genres?: string[] | null;
  languages?: string[] | null;
  vote_average?: number | null;
  vote_count?: number | null;
  cast?: string[] | null;
  rating?: string | null;
  catalog_source?: string | null;
  catalog_id?: string | null;
  poster?: ImageMetadata | null;
  backdrop?: ImageMetadata | null;
}

export interface CatalogMatchCandidate {
  identifier: string;
  score: number | null;
  downloads: number | null;
  catalog_source?: string | null;
  catalog_id?: string | null;
  movie?: CatalogMovieDetails | null;
}

export interface CatalogMatch {
  match_key: string;
  tmdb_id: number;
  tmdb_movie: CatalogMovieDetails;
  best_candidate: CatalogMatchCandidate;
  candidates: CatalogMatchCandidate[];
}

export interface CatalogMatchResponse {
  matches: CatalogMatch[];
  total: number;
}

export interface CatalogDownloadRequest {
  match_key: string;
  execute?: boolean;
}

export interface CatalogDownloadResponse {
  match_key: string;
  identifier: string;
  title: string;
  destination: string | null;
  video_file?: string | null;
  metadata_xml_file?: string | null;
  cover_art_file?: string | null;
  subtitle_files?: string[] | null;
  downloaded: boolean;
  video_path?: string | null;
  subtitle_paths?: string[] | null;
  file_hash?: string | null;
  vector_hash?: string | null;
  vector_row_id?: number | null;
  movie_id?: number | null;
  created?: boolean | null;
}

export interface MediaDetail {
  media_id: string;
  type: MediaType;
  title: string;
  source_type: SourceType;
  vector_hash: string;
  file_hash?: string;
  metadata?: Record<string, any>;
  enriched_metadata?: EnrichedMetadata | null;
}

export interface IngestRequest {
  path: string;
  source_type: SourceType;
  metadata?: Record<string, any>;
  poster_path?: string;
}

export interface IngestResponse {
  media_id: string;
  file_hash: string;
  vector_hash: string;
}
