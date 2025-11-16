import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Alert,
  LinearProgress,
} from '@mui/material';
import { Search as SearchIcon, Psychology as AIIcon } from '@mui/icons-material';
import { unifiedApiClient } from '@/lib/api/unified-client';
import { MediaCard } from '@/components/cards/MediaCard';
import type { MediaItem } from '@/types/api';

export function EnhancedSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [showScores, setShowScores] = useState(false);
  
  const backendType = unifiedApiClient.getBackendType();
  const isSmartSearch = backendType === 'bittemple';

  // Update local state when URL params change
  useEffect(() => {
    const queryParam = searchParams.get('q') || '';
    setSearchQuery(queryParam);
  }, [searchParams]);

  // Fetch search results (with or without scores)
  const { data: searchData, isLoading } = useQuery({
    queryKey: ['search', initialQuery, isSmartSearch],
    queryFn: async () => {
      if (isSmartSearch) {
        // Use smart vector search
        return unifiedApiClient.vectorSearch(initialQuery, { top_k: 50, threshold: 0.3 });
      } else {
        // Use keyword search
        const items = await unifiedApiClient.search(initialQuery);
        return { items, scores: [] };
      }
    },
    enabled: initialQuery.length > 0,
  });

  const results = searchData?.items || [];
  const scores = searchData?.scores || [];

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h4">
            Search
          </Typography>
          {isSmartSearch && (
            <Chip
              icon={<AIIcon />}
              label="AI-Powered"
              color="primary"
              size="small"
            />
          )}
        </Box>

        {isSmartSearch && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Smart Search</strong> - Use natural language! Try: "action movies with explosions" or "sad piano music"
          </Alert>
        )}
        
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
            placeholder={
              isSmartSearch
                ? "Describe what you're looking for..."
                : "Search for movies, TV shows, music..."
            }
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

        {isSmartSearch && (
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Example queries:
            </Typography>
            <Chip
              label="movies like The Matrix"
              size="small"
              onClick={() => {
                setSearchQuery('movies like The Matrix');
                setSearchParams({ q: 'movies like The Matrix' });
              }}
              sx={{ cursor: 'pointer' }}
            />
            <Chip
              label="relaxing nature videos"
              size="small"
              onClick={() => {
                setSearchQuery('relaxing nature videos');
                setSearchParams({ q: 'relaxing nature videos' });
              }}
              sx={{ cursor: 'pointer' }}
            />
            <Chip
              label="comedy specials"
              size="small"
              onClick={() => {
                setSearchQuery('comedy specials');
                setSearchParams({ q: 'comedy specials' });
              }}
              sx={{ cursor: 'pointer' }}
            />
          </Stack>
        )}
      </Box>

      {/* Results */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : initialQuery && results ? (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              {results.length} {results.length === 1 ? 'result' : 'results'} for "{initialQuery}"
            </Typography>
            {isSmartSearch && scores.length > 0 && (
              <Chip
                label={showScores ? 'Hide Scores' : 'Show Scores'}
                onClick={() => setShowScores(!showScores)}
                size="small"
                variant="outlined"
              />
            )}
          </Box>

          {results.length > 0 ? (
            <Grid container spacing={3}>
              {results.map((item, index) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={item.Id}>
                  <Box>
                    <MediaCard item={item} onClick={() => handleItemClick(item)} />
                    {isSmartSearch && showScores && scores[index] !== undefined && (
                      <Box sx={{ mt: 1, px: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Match: {(scores[index] * 100).toFixed(0)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={scores[index] * 100}
                          sx={{ height: 4, borderRadius: 2 }}
                        />
                      </Box>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', mt: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No results found for "{initialQuery}"
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {isSmartSearch
                  ? 'Try describing what you want differently'
                  : 'Try searching with different keywords'}
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <SearchIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {isSmartSearch ? 'Describe what you want to find' : 'Start typing to search'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {isSmartSearch
              ? 'Use natural language - our AI will understand!'
              : 'Search across your entire media library'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
