import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  SelectChangeEvent,
} from '@mui/material';
import { apiClient } from '@/lib/api/api';
import { MediaCard } from '@/components/cards/MediaCard';
import type { MediaItem } from '@/types/api';

export function LibraryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [sortBy, setSortBy] = useState<'SortName' | 'PremiereDate' | 'CommunityRating'>('SortName');
  const [sortOrder, setSortOrder] = useState<'Ascending' | 'Descending'>('Ascending');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Fetch library info
  const { data: libraries } = useQuery({
    queryKey: ['libraries'],
    queryFn: () => apiClient.getLibraries(),
  });

  const currentLibrary = libraries?.find(lib => lib.Id === id);

  // Fetch library items
  const { data: libraryData, isLoading } = useQuery({
    queryKey: ['libraryItems', id, sortBy, sortOrder, selectedGenres],
    queryFn: () =>
      apiClient.getLibraryItems(id!, {
        sortBy,
        sortOrder,
        genres: selectedGenres.length > 0 ? selectedGenres : undefined,
      }),
    enabled: !!id,
  });

  // Extract unique genres from items
  const availableGenres = Array.from(
    new Set(
      libraryData?.items
        .flatMap((item: MediaItem) => item.Genres || [])
        .filter(Boolean)
    )
  ).sort();

  const handleSortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value as 'SortName' | 'PremiereDate' | 'CommunityRating');
  };

  const handleSortOrderChange = (event: SelectChangeEvent) => {
    setSortOrder(event.target.value as 'Ascending' | 'Descending');
  };

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleItemClick = (item: MediaItem) => {
    navigate(`/item/${item.Id}`);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {currentLibrary?.Name || 'Library'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {libraryData?.totalCount || 0} items
        </Typography>
      </Box>

      {/* Controls */}
      <Box sx={{ mb: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          {/* Sort By */}
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Sort By</InputLabel>
            <Select value={sortBy} label="Sort By" onChange={handleSortChange}>
              <MenuItem value="SortName">Name</MenuItem>
              <MenuItem value="PremiereDate">Date Added</MenuItem>
              <MenuItem value="CommunityRating">Rating</MenuItem>
            </Select>
          </FormControl>

          {/* Sort Order */}
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel>Order</InputLabel>
            <Select value={sortOrder} label="Order" onChange={handleSortOrderChange}>
              <MenuItem value="Ascending">
                {sortBy === 'SortName' ? 'A-Z' : sortBy === 'CommunityRating' ? 'Low-High' : 'Oldest'}
              </MenuItem>
              <MenuItem value="Descending">
                {sortBy === 'SortName' ? 'Z-A' : sortBy === 'CommunityRating' ? 'High-Low' : 'Newest'}
              </MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Genre Filters */}
        {availableGenres.length > 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Filter by Genre:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {availableGenres.map((genre) => (
                <Chip
                  key={genre}
                  label={genre}
                  onClick={() => handleGenreToggle(genre)}
                  color={selectedGenres.includes(genre) ? 'primary' : 'default'}
                  variant={selectedGenres.includes(genre) ? 'filled' : 'outlined'}
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
            {selectedGenres.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Showing {libraryData?.items.length} items matching: {selectedGenres.join(', ')}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Items Grid */}
      {libraryData?.items && libraryData.items.length > 0 ? (
        <Grid container spacing={3}>
          {libraryData.items.map((item: MediaItem) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={item.Id}>
              <MediaCard item={item} onClick={() => handleItemClick(item)} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No items found
          </Typography>
          {selectedGenres.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Try removing some filters
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
