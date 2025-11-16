import { http, HttpResponse } from 'msw';
import {
  mockUser,
  mockAccessToken,
  mockLibraries,
  mockContinueWatching,
  mockRecentlyAdded,
  mockFavorites,
  mockMovieLibraryItems,
  mockTVShowLibraryItems,
  mockMusicLibraryItems,
  mockMusicTrackItems,
  mockTVEpisodeItems,
  mockVideoItems,
  mockPersonalMediaItems,
  mockPodcastItems,
} from './data';
import { generatePosterSVG, generateBackdropSVG } from './images';
import type { MediaType, MediaTypeRoute, SearchRequest, SearchResponse, MediaListResponse, MediaDetail, IngestRequest, IngestResponse } from '@/types/api';

const MOCK_SERVER_URL = 'http://localhost:8096';
const API_BASE = `${MOCK_SERVER_URL}/api/v1`;

// Helper function to validate Bearer token (mimics Python FastAPI auth)
function validateBearerToken(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    console.warn('⚠️ [MSW] No Authorization header');
    return false;
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    console.warn('⚠️ [MSW] Invalid auth format, expected Bearer token');
    return false;
  }
  
  const token = authHeader.substring(7);
  if (token === mockAccessToken) {
    return true;
  }
  
  console.warn('⚠️ [MSW] Invalid token');
  return false;
}

// Helper to get media items by type
function getMediaItemsByType(type: MediaType): any[] {
  switch (type) {
    case 'movie':
      return mockMovieLibraryItems;
    case 'tv':
      return [...mockTVShowLibraryItems, ...mockTVEpisodeItems];
    case 'music':
      return [...mockMusicLibraryItems, ...mockMusicTrackItems];
    case 'podcast':
      return mockPodcastItems;
    case 'video':
      return mockVideoItems;
    case 'personal':
      return mockPersonalMediaItems;
    default:
      return [];
  }
}

// Helper to transform our MediaItem to MediaDetail format
function transformToMediaDetail(item: any): MediaDetail {
  return {
    media_id: item.Id,
    type: item.Type || item.MediaType,
    title: item.Name,
    source_type: item.SourceType || 'catalog',
    vector_hash: `vector_${item.Id}`,
    file_hash: `file_${item.Id}`,
    metadata: {
      title: item.Name,
      description: item.Overview,
      year: item.ProductionYear,
      rating: item.CommunityRating,
      content_rating: item.OfficialRating,
      genres: item.Genres,
      duration_seconds: item.RunTimeTicks ? item.RunTimeTicks / 10000000 : undefined,
      original_title: item.OriginalTitle,
      release_date: item.ReleaseDate,
      runtime_minutes: item.RuntimeMinutes,
      cast: item.Cast,
      director: item.Director,
      series_name: item.SeriesName,
      season_number: item.SeasonNumber,
      episode_number: item.EpisodeNumber,
      air_date: item.AirDate,
      artist: item.Artist,
      album: item.Album,
      album_artist: item.AlbumArtist,
      track_number: item.TrackNumber,
      disc_number: item.DiscNumber,
      duration: item.Duration,
      show_name: item.ShowName,
      pub_date: item.PubDate,
      episode_title: item.EpisodeTitle,
      capture_date: item.CaptureDate,
      device_make: item.DeviceMake,
      device_model: item.DeviceModel,
      gps_lat: item.GpsLat,
      gps_lon: item.GpsLon,
      album_name: item.AlbumName,
      platform: item.Platform,
      channel_name: item.ChannelName,
      uploader: item.Uploader,
    },
  };
}

// Create handlers for all 6 media types
const mediaTypes: Array<{ route: MediaTypeRoute; type: MediaType }> = [
  { route: 'movies', type: 'movie' },
  { route: 'tv', type: 'tv' },
  { route: 'music', type: 'music' },
  { route: 'podcasts', type: 'podcast' },
  { route: 'videos', type: 'video' },
  { route: 'personal', type: 'personal' },
];

const typeSpecificHandlers = mediaTypes.flatMap(({ route, type }) => [
  // POST /api/v1/{type}/search
  http.post(`${API_BASE}/${route}/search`, async ({ request }) => {
    if (!validateBearerToken(request)) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json() as SearchRequest;
    console.log(`🔍 [MSW] Search request for ${type}:`, body.query);

    const items = getMediaItemsByType(type);
    const query = body.query.toLowerCase();
    
    const results = items
      .filter(item =>
        item.Name.toLowerCase().includes(query) ||
        (item.Overview && item.Overview.toLowerCase().includes(query))
      )
      .slice(0, body.k || 20)
      .map(item => ({
        media_id: item.Id,
        score: 0.95,
        type: type,
        title: item.Name,
        preview_url: null,
      }));

    console.log(`✅ [MSW] Found ${results.length} results for ${type}`);
    const response: SearchResponse = { results };
    return HttpResponse.json(response);
  }),

  // GET /api/v1/{type}/media
  http.get(`${API_BASE}/${route}/media`, ({ request }) => {
    if (!validateBearerToken(request)) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    console.log(`📚 [MSW] List ${type} media: limit=${limit}, offset=${offset}`);

    const items = getMediaItemsByType(type);
    const paginatedItems = items.slice(offset, offset + limit);

    const response: MediaListResponse = {
      items: paginatedItems.map(transformToMediaDetail),
      total: items.length,
    };

    console.log(`✅ [MSW] Returning ${paginatedItems.length} of ${items.length} ${type} items`);
    return HttpResponse.json(response);
  }),

  // GET /api/v1/{type}/media/{media_id}
  http.get(`${API_BASE}/${route}/media/:mediaId`, ({ request, params }) => {
    if (!validateBearerToken(request)) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    const { mediaId } = params;
    console.log(`🎬 [MSW] Get ${type} detail:`, mediaId);

    const items = getMediaItemsByType(type);
    const item = items.find(i => i.Id === mediaId);

    if (item) {
      console.log(`✅ [MSW] Found ${type}:`, item.Name);
      const response: MediaDetail = transformToMediaDetail(item);
      return HttpResponse.json(response);
    }

    console.log(`❌ [MSW] ${type} not found:`, mediaId);
    return HttpResponse.json({ detail: 'Media not found' }, { status: 404 });
  }),

  // GET /api/v1/{type}/media/{media_id}/stream
  http.get(`${API_BASE}/${route}/media/:mediaId/stream`, ({ request, params }) => {
    if (!validateBearerToken(request)) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    const { mediaId } = params;
    console.log(`📺 [MSW] Stream ${type}:`, mediaId);

    return HttpResponse.text('Mock media stream data', {
      headers: {
        'Content-Type': type === 'music' || type === 'podcast' ? 'audio/mpeg' : 'video/mp4',
        'Accept-Ranges': 'bytes',
      },
    });
  }),

  // POST /api/v1/{type}/ingest/start
  http.post(`${API_BASE}/${route}/ingest/start`, async ({ request }) => {
    if (!validateBearerToken(request)) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json() as IngestRequest;
    console.log(`📥 [MSW] Ingest ${type}:`, body.path);

    const response: IngestResponse = {
      media_id: `mock_${type}_${Date.now()}`,
      file_hash: `file_hash_${Date.now()}`,
      vector_hash: `vector_hash_${Date.now()}`,
    };

    console.log(`✅ [MSW] Ingested ${type}:`, response.media_id);
    return HttpResponse.json(response);
  }),
]);

// Legacy handlers (for backward compatibility with existing UI)
const legacyHandlers = [
  // Root endpoint - for server discovery/connection test
  http.get(`${MOCK_SERVER_URL}/`, () => {
    console.log('🏠 [MSW] Root endpoint hit');
    return HttpResponse.json({
      message: 'BitHarbor Media Server (Mock)',
      version: '1.0.0',
      status: 'running',
    });
  }),

  // System info endpoint - for server discovery
  http.get(`${MOCK_SERVER_URL}/System/Info/Public`, () => {
    console.log('🌐 [MSW] System info request');
    return HttpResponse.json({
      LocalAddress: MOCK_SERVER_URL,
      ServerName: 'Mock BitHarbor Server',
      Version: '1.0.0',
      Id: 'mock-server-id',
    });
  }),

  // Authentication endpoint
  http.post(`${MOCK_SERVER_URL}/Users/AuthenticateByName`, async ({ request }) => {
    console.log('🔐 [MSW] Authentication request intercepted');
    const body = await request.json() as any;
    
    if (body.Username && body.Pw !== undefined) {
      console.log('✅ [MSW] Authentication successful');
      return HttpResponse.json({
        User: mockUser,
        SessionInfo: {
          Id: 'mock-session-id',
          UserId: mockUser.Id,
        },
        AccessToken: mockAccessToken,
        ServerId: mockUser.ServerId,
      });
    }

    console.log('❌ [MSW] Authentication failed');
    return HttpResponse.json(
      { error: 'Invalid username or password' },
      { status: 401 }
    );
  }),

  // Get libraries
  http.get(`${MOCK_SERVER_URL}/Users/:userId/Views`, ({ request }) => {
    if (!validateBearerToken(request)) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }
    
    return HttpResponse.json({
      Items: mockLibraries,
      TotalRecordCount: mockLibraries.length,
    });
  }),

  // Get continue watching
  http.get(`${MOCK_SERVER_URL}/Users/:userId/Items/Resume`, ({ request }) => {
    if (!validateBearerToken(request)) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }
    
    return HttpResponse.json({
      Items: mockContinueWatching,
      TotalRecordCount: mockContinueWatching.length,
    });
  }),

  // Get recently added
  http.get(`${MOCK_SERVER_URL}/Users/:userId/Items/Latest`, ({ request }) => {
    if (!validateBearerToken(request)) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }
    
    return HttpResponse.json(mockRecentlyAdded);
  }),

  // Get items (library/favorites/search)
  http.get(`${MOCK_SERVER_URL}/Users/:userId/Items`, ({ request }) => {
    if (!validateBearerToken(request)) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }
    
    const url = new URL(request.url);
    const filters = url.searchParams.get('Filters');
    const searchTerm = url.searchParams.get('SearchTerm');
    const parentId = url.searchParams.get('ParentId');
    
    // Search
    if (searchTerm) {
      const allItems = [...mockMovieLibraryItems, ...mockTVShowLibraryItems, ...mockMusicLibraryItems];
      const results = allItems.filter(item =>
        item.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.Overview && item.Overview.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      return HttpResponse.json({
        Items: results,
        TotalRecordCount: results.length,
      });
    }
    
    // Favorites
    if (filters && filters.includes('IsFavorite')) {
      return HttpResponse.json({
        Items: mockFavorites,
        TotalRecordCount: mockFavorites.length,
      });
    }
    
    // Library items
    let items: any[] = [];
    if (parentId === 'mock-library-movies') {
      items = mockMovieLibraryItems;
    } else if (parentId === 'mock-library-tvshows') {
      items = [...mockTVShowLibraryItems, ...mockTVEpisodeItems];
    } else if (parentId === 'mock-library-music') {
      items = [...mockMusicLibraryItems, ...mockMusicTrackItems];
    } else if (parentId === 'mock-library-videos') {
      items = mockVideoItems;
    } else if (parentId === 'mock-library-podcasts') {
      items = mockPodcastItems;
    } else if (parentId === 'mock-library-personal') {
      items = mockPersonalMediaItems;
    }
    
    return HttpResponse.json({
      Items: items,
      TotalRecordCount: items.length,
    });
  }),

  // Get item by ID
  http.get(`${MOCK_SERVER_URL}/Users/:userId/Items/:itemId`, ({ request, params }) => {
    if (!validateBearerToken(request)) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }
    
    const { itemId } = params;
    const allItems = [
      ...mockContinueWatching,
      ...mockRecentlyAdded,
      ...mockFavorites,
      ...mockMovieLibraryItems,
      ...mockTVShowLibraryItems,
      ...mockTVEpisodeItems,
      ...mockMusicLibraryItems,
      ...mockMusicTrackItems,
      ...mockVideoItems,
      ...mockPodcastItems,
      ...mockPersonalMediaItems,
    ];
    
    const item = allItems.find(i => i.Id === itemId);
    if (item) {
      return HttpResponse.json(item);
    }
    
    return HttpResponse.json({ error: 'Item not found' }, { status: 404 });
  }),

  // Favorite/unfavorite
  http.post(`${MOCK_SERVER_URL}/Users/:userId/FavoriteItems/:itemId`, ({ request }) => {
    if (!validateBearerToken(request)) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }
    return HttpResponse.json({ success: true });
  }),

  http.delete(`${MOCK_SERVER_URL}/Users/:userId/FavoriteItems/:itemId`, ({ request }) => {
    if (!validateBearerToken(request)) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }
    return HttpResponse.json({ success: true });
  }),

  // Images
  http.get(`${MOCK_SERVER_URL}/Items/:itemId/Images/:imageType`, ({ params }) => {
    const { itemId, imageType } = params;
    const allItems = [...mockMovieLibraryItems, ...mockTVShowLibraryItems, ...mockMusicLibraryItems];
    const item = allItems.find(i => i.Id === itemId);
    
    let svg: string;
    if (imageType === 'Backdrop') {
      svg = generateBackdropSVG(itemId as string, item?.Name || 'Unknown');
    } else {
      svg = generatePosterSVG(itemId as string, item?.Name || 'Unknown', item?.Type || 'Media');
    }
    
    return HttpResponse.text(svg, {
      headers: { 'Content-Type': 'image/svg+xml' },
    });
  }),

  // Playback tracking
  http.post(`${MOCK_SERVER_URL}/Sessions/Playing/Progress`, ({ request }) => {
    if (!validateBearerToken(request)) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }
    return HttpResponse.json({ success: true });
  }),

  http.post(`${MOCK_SERVER_URL}/Sessions/Playing/Stopped`, ({ request }) => {
    if (!validateBearerToken(request)) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }
    return HttpResponse.json({ success: true });
  }),

  http.post(`${MOCK_SERVER_URL}/Users/:userId/PlayedItems/:itemId`, ({ request }) => {
    if (!validateBearerToken(request)) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }
    return HttpResponse.json({ success: true });
  }),
];

// Export all handlers
export const handlers = [...typeSpecificHandlers, ...legacyHandlers];
