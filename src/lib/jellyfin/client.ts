import { Jellyfin } from '@jellyfin/sdk';
import type { Api } from '@jellyfin/sdk';

class JellyfinClient {
  private sdk: Jellyfin;
  private api: Api | null = null;
  private serverUrl: string = '';
  private accessToken: string = '';

  constructor() {
    this.sdk = new Jellyfin({
      clientInfo: {
        name: 'Jellyfin Dupe',
        version: '0.1.0',
      },
      deviceInfo: {
        name: 'Web Browser',
        id: this.getDeviceId(),
      },
    });
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
    this.api = this.sdk.createApi(serverUrl);
    
    // Test connection
    const response = await fetch(`${serverUrl}/System/Info/Public`);
    if (!response.ok) {
      throw new Error('Cannot connect to server');
    }
    
    return await response.json();
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    if (this.api) {
      this.api.accessToken = token;
    }
  }

  getApi(): Api {
    if (!this.api) {
      throw new Error('Client not initialized. Call connect() first.');
    }
    return this.api;
  }

  getServerUrl(): string {
    return this.serverUrl;
  }

  getAccessToken(): string {
    return this.accessToken;
  }
}

export const jellyfinClient = new JellyfinClient();
