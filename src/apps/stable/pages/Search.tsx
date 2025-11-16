import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { bitTempleAdapter } from '@/lib/api/bittemple-adapter';
import { MediaCard } from '@/components/cards/MediaCard';
import type { MediaItem } from '@/types/api';

// Helper to map pathname to media type
function getMediaTypeFromPath(pathname: string): string | undefined {
  if (pathname.startsWith('/movies')) return 'movie';
  if (pathname.startsWith('/tv')) return 'tv';
  if (pathname.startsWith('/music')) return 'music';
  if (pathname.startsWith('/podcasts')) return 'podcast';
  if (pathname.startsWith('/videos')) return 'video';
  if (pathname.startsWith('/personal')) return 'personal';
  return undefined;
}

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  // Update local state when URL params change
  useEffect(() => {
    const queryParam = searchParams.get('q') || '';
    setSearchQuery(queryParam);
  }, [searchParams]);

  // Determine media type from route
  const mediaType = getMediaTypeFromPath(location.pathname);

  // Fetch search results using BitTemple vector search
  const { data: results, isLoading } = useQuery({
    queryKey: ['local/search', initialQuery, mediaType],
    queryFn: async () => {
      if (!initialQuery.trim()) return [];
      // Only search the current media type if on a media type tab, otherwise search all
  const searchResult = await bitTempleAdapter.vectorSearch(initialQuery, mediaType as any, { k: 50 });
      return searchResult.items;
    },
    enabled: initialQuery.length > 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const handleItemClick = (item: MediaItem) => {
    navigate(`/item/${item.Id}`);
  };

  return (
    <Box>
      {/* Search Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Search
        </Typography>
        
        {/* Search Input */}
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{ maxWidth: 600, mt: 3 }}
        >
          <TextField
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for movies, TV shows, music..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            autoFocus
          />
        </Box>
      </Box>

      {/* Results */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : initialQuery && results ? (
        <Box>
          <Typography variant="h6" sx={{ mb: 3 }}>
            {results.length} {results.length === 1 ? 'result' : 'results'} for "{initialQuery}"
          </Typography>

          {results.length > 0 ? (
            <Grid container spacing={3}>
              {results.map((item) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={item.Id}>
                  <MediaCard item={item} onClick={() => handleItemClick(item)} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', mt: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No results found for "{initialQuery}"
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try searching with different keywords
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <SearchIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Start typing to search
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Search across your entire media library
          </Typography>
        </Box>
      )}
    </Box>
  );
}
