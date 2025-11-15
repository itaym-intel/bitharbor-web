import { http, HttpResponse } from 'msw';
import {
  mockUser,
  mockAccessToken,
  mockLibraries,
  mockContinueWatching,
  mockRecentlyAdded,
} from './data';
import { generatePosterSVG, generateBackdropSVG } from './images';

const MOCK_SERVER_URL = 'http://localhost:8096';

export const handlers = [
  // Authentication endpoint
  http.post(`${MOCK_SERVER_URL}/Users/AuthenticateByName`, async ({ request }) => {
    console.log('🔐 [MSW] Authentication request intercepted');
    const body = await request.json() as any;
    console.log('📝 [MSW] Login attempt:', { username: body.Username, hasPassword: !!body.Pw });
    
    // Accept any username/password for demo
    // For stricter testing, use: body.Username === 'demo' && body.Pw === 'demo'
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
    
    // Find the item to get its title and type
    const allItems = [...mockContinueWatching, ...mockRecentlyAdded];
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
