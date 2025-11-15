import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

// Start mock server and export promise
export async function startMockServer() {
  // @ts-ignore - Vite env variable
  if (import.meta.env?.DEV) {
    try {
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
      });
      console.log('🎭 Mock server enabled');
      console.log('📝 Test credentials: any username/password will work');
      console.log('🌐 Mock server URL: http://localhost:8096');
    } catch (error) {
      console.error('Failed to start mock server:', error);
    }
  }
}
