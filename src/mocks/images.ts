// Generate SVG poster images for mock data
export function generatePosterSVG(itemId: string, title: string, type: string): string {
  const colors = {
    'movie-1': { bg: '#1a1a2e', accent: '#16213e', text: '#e94560' },
    'movie-2': { bg: '#0f3460', accent: '#16213e', text: '#e94560' },
    'movie-10': { bg: '#2d1b00', accent: '#5c3d2e', text: '#d4af37' },
    'movie-11': { bg: '#1a1a1a', accent: '#2d2d2d', text: '#ff6b35' },
    'movie-12': { bg: '#ff1493', accent: '#ff69b4', text: '#ffffff' },
    'episode-1': { bg: '#1e3a2e', accent: '#2d5a3d', text: '#7fb069' },
    'series-1': { bg: '#2c1810', accent: '#4a2817', text: '#d4a574' },
    'series-2': { bg: '#1a2634', accent: '#2d4356', text: '#4a90e2' },
  };

  const color = colors[itemId as keyof typeof colors] || { bg: '#1a1a1a', accent: '#2d2d2d', text: '#ffffff' };
  
  const width = 300;
  const height = 450;
  
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad-${itemId}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${color.bg};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${color.accent};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad-${itemId})"/>
    <text x="50%" y="45%" text-anchor="middle" fill="${color.text}" font-size="28" font-weight="bold" font-family="Arial, sans-serif" style="text-transform: uppercase;">
      ${title.split(' ').slice(0, 2).join(' ')}
    </text>
    <text x="50%" y="55%" text-anchor="middle" fill="${color.text}" font-size="16" font-family="Arial, sans-serif" opacity="0.7">
      ${type}
    </text>
    <rect x="20" y="20" width="60" height="30" rx="5" fill="${color.text}" opacity="0.2"/>
    <text x="50" y="40" text-anchor="middle" fill="${color.text}" font-size="14" font-weight="bold" font-family="Arial, sans-serif">
      ${type === 'Movie' ? '4K' : type === 'Episode' ? 'EP' : 'TV'}
    </text>
  </svg>`;
}

export function generateBackdropSVG(itemId: string, title: string): string {
  const colors = {
    'movie-1': '#16213e',
    'movie-2': '#0f3460',
    'movie-10': '#5c3d2e',
    'movie-11': '#2d2d2d',
    'movie-12': '#ff69b4',
    'episode-1': '#2d5a3d',
    'series-1': '#4a2817',
    'series-2': '#2d4356',
  };

  const color = colors[itemId as keyof typeof colors] || '#1a1a1a';
  
  return `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="backdrop-grad-${itemId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color};stop-opacity:0.8" />
        <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#backdrop-grad-${itemId})"/>
    <text x="50%" y="50%" text-anchor="middle" fill="rgba(255,255,255,0.1)" font-size="120" font-weight="bold" font-family="Arial, sans-serif">
      ${title}
    </text>
  </svg>`;
}
