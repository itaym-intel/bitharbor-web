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
} from './data';
import { generatePosterSVG, generateBackdropSVG } from './images';

const MOCK_SERVER_URL = 'http://localhost:8096';

export const handlers = [
  // Authentication endpoint
  http.post(`${MOCK_SERVER_URL}/Users/AuthenticateByName`, async ({ request }) => {
    console.log('🔐 [MSW] Authentication request intercepted');
    const body = await request.json() as any;
    console.log('📝 [MSW] Login attempt:', { username: body.Username, hasPassword: !!body.Pw });
    
    if (body.Username && body.Pw !== undefined) {
      console.log('[MSW] Authentication successful');
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

  // Get user views (libraries)
  http.get(`${MOCK_SERVER_URL}/Users/:userId/Views`, () => {
    return HttpResponse.json({
      Items: mockLibraries,
      TotalRecordCount: mockLibraries.length,
    });
  }),

  // Get continue watching (resume items)
  http.get(`${MOCK_SERVER_URL}/Users/:userId/Items/Resume`, () => {
    return HttpResponse.json({
      Items: mockContinueWatching,
      TotalRecordCount: mockContinueWatching.length,
    });
  }),

  // Get recently added (latest items)
  http.get(`${MOCK_SERVER_URL}/Users/:userId/Items/Latest`, () => {
    return HttpResponse.json(mockRecentlyAdded);
  }),

  // Get favorite items
  http.get(`${MOCK_SERVER_URL}/Users/:userId/Items`, ({ request }) => {
    const url = new URL(request.url);
    const filters = url.searchParams.get('Filters');
    
    // Check if this is a favorites request
    if (filters && filters.includes('IsFavorite')) {
      console.log('⭐ [MSW] Favorites request intercepted');
      return HttpResponse.json({
        Items: mockFavorites,
        TotalRecordCount: mockFavorites.length,
      });
    }
    
    // Otherwise handle as regular library items request
    const parentId = url.searchParams.get('ParentId');
    const sortBy = url.searchParams.get('SortBy') || 'SortName';
    const sortOrder = url.searchParams.get('SortOrder') || 'Ascending';
    const genres = url.searchParams.get('Genres');
    
    console.log('📚 [MSW] Library items request:', { parentId, sortBy, sortOrder, genres });
    
    // Determine which library
    let items: any[] = [];
    if (parentId === 'mock-library-movies') {
      items = [...mockMovieLibraryItems];
    } else if (parentId === 'mock-library-tvshows') {
      items = [...mockTVShowLibraryItems];
    } else if (parentId === 'mock-library-music') {
      items = [...mockMusicLibraryItems];
    } else {
      // Return all items if no parent specified
      items = [...mockMovieLibraryItems, ...mockTVShowLibraryItems, ...mockMusicLibraryItems];
    }
    
    // Filter by genre if specified
    if (genres) {
      const genreList = genres.split(',');
      items = items.filter(item => 
        item.Genres && item.Genres.some((g: string) => genreList.includes(g))
      );
    }
    
    // Sort items
    items.sort((a, b) => {
      let compareResult = 0;
      
      switch (sortBy) {
        case 'SortName':
          compareResult = a.Name.localeCompare(b.Name);
          break;
        case 'PremiereDate':
        case 'DateCreated':
          const dateA = new Date(a.PremiereDate || 0).getTime();
          const dateB = new Date(b.PremiereDate || 0).getTime();
          compareResult = dateA - dateB; // Oldest first for Ascending
          break;
        case 'CommunityRating':
          compareResult = (a.CommunityRating || 0) - (b.CommunityRating || 0); // Lowest first for Ascending
          break;
        default:
          compareResult = a.Name.localeCompare(b.Name);
      }
      
      return sortOrder === 'Descending' ? -compareResult : compareResult;
    });
    
    console.log(`✅ [MSW] Returning ${items.length} items`);
    
    return HttpResponse.json({
      Items: items,
      TotalRecordCount: items.length,
    });
  }),

  // Get single item by ID
  http.get(`${MOCK_SERVER_URL}/Users/:userId/Items/:itemId`, ({ params }) => {
    const { itemId } = params;
    console.log('🎬 [MSW] Item detail request:', itemId);
    
    const allItems = [
      ...mockContinueWatching,
      ...mockRecentlyAdded,
      ...mockFavorites,
      ...mockMovieLibraryItems,
      ...mockTVShowLibraryItems,
      ...mockMusicLibraryItems,
    ];
    
    const item = allItems.find(i => i.Id === itemId);
    
    if (item) {
      console.log('✅ [MSW] Found item:', item.Name);
      return HttpResponse.json(item);
    }
    
    console.log('❌ [MSW] Item not found:', itemId);
    return HttpResponse.json(
      { error: 'Item not found' },
      { status: 404 }
    );
  }),

  // Mark item as favorite
  http.post(`${MOCK_SERVER_URL}/Users/:userId/FavoriteItems/:itemId`, ({ params }) => {
    const { itemId } = params;
    console.log('⭐ [MSW] Marking item as favorite:', itemId);
    
    // Find and update the item across all collections
    const allCollections = [
      mockContinueWatching,
      mockRecentlyAdded,
      mockFavorites,
      mockMovieLibraryItems,
      mockTVShowLibraryItems,
      mockMusicLibraryItems,
    ];
    
    for (const collection of allCollections) {
      const item = collection.find((i: any) => i.Id === itemId);
      if (item && item.UserData) {
        item.UserData.IsFavorite = true;
        console.log('✅ [MSW] Item marked as favorite:', item.Name);
        break;
      }
    }
    
    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  // Remove item from favorites
  http.delete(`${MOCK_SERVER_URL}/Users/:userId/FavoriteItems/:itemId`, ({ params }) => {
    const { itemId } = params;
    console.log('💔 [MSW] Removing item from favorites:', itemId);
    
    // Find and update the item across all collections
    const allCollections = [
      mockContinueWatching,
      mockRecentlyAdded,
      mockFavorites,
      mockMovieLibraryItems,
      mockTVShowLibraryItems,
      mockMusicLibraryItems,
    ];
    
    for (const collection of allCollections) {
      const item = collection.find((i: any) => i.Id === itemId);
      if (item && item.UserData) {
        item.UserData.IsFavorite = false;
        console.log('✅ [MSW] Item removed from favorites:', item.Name);
        break;
      }
    }
    
    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  // Get system info (for server discovery)
  http.get(`${MOCK_SERVER_URL}/System/Info/Public`, () => {
    console.log('🌐 [MSW] System info request intercepted');
    return HttpResponse.json({
      LocalAddress: MOCK_SERVER_URL,
      ServerName: 'Mock Jellyfin Server',
      Version: '10.8.0',
      Id: 'mock-server-id',
    });
  }),

  // Image endpoint - return realistic poster
  http.get(`${MOCK_SERVER_URL}/Items/:itemId/Images/:imageType`, ({ params }) => {
    const { itemId, imageType } = params;
    
    // Find the item to get its title and type - check all item sources
    const allItems = [
      ...mockContinueWatching,
      ...mockRecentlyAdded,
      ...mockFavorites,
      ...mockMovieLibraryItems,
      ...mockTVShowLibraryItems,
      ...mockMusicLibraryItems,
    ];
    const item = allItems.find(i => i.Id === itemId);
    
    let svg: string;
    if (imageType === 'Backdrop') {
      svg = generateBackdropSVG(itemId as string, item?.Name || 'Unknown');
    } else {
      // Primary poster
      svg = generatePosterSVG(
        itemId as string,
        item?.Name || 'Unknown',
        item?.Type || 'Media'
      );
    }
    
    return HttpResponse.text(svg, {
      headers: { 'Content-Type': 'image/svg+xml' },
    });
  }),
];
