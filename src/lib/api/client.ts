/**
 * API Client for BitHarbor Media Server
 * Handles HTTP requests to Python FastAPI backend
 */

import { bitHarborAdapter } from './bitharbor-adapter';

class ApiServiceClient {
  private serverUrl: string = '';
  private accessToken: string = '';
  public bitHarborAdapter = bitHarborAdapter;

  constructor() {
    // Load saved server URL from localStorage
    const savedUrl = localStorage.getItem('server_url');
    if (savedUrl) {
      this.serverUrl = savedUrl;
    }

    // Load saved access token
    const savedToken = localStorage.getItem('access_token');
    if (savedToken) {
      this.accessToken = savedToken;
    }
  }

  private getDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  async connect(serverUrl: string) {
    this.serverUrl = serverUrl;
    localStorage.setItem('server_url', serverUrl);
    
    // Test connection to Python backend
    const response = await fetch(`${serverUrl}/`);
    if (!response.ok) {
      throw new Error('Cannot connect to server');
    }
    
    return await response.json();
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    localStorage.setItem('access_token', token);
  }

  getServerUrl(): string {
    return this.serverUrl || 'http://localhost:8096';
  }

  getAccessToken(): string {
    return this.accessToken;
  }

  getDeviceIdPublic(): string {
    return this.getDeviceId();
  }
}

export const apiService = new ApiServiceClient();
