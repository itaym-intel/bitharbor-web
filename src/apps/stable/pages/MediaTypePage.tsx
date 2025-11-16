import { useState, useMemo } from 'react';
import { SearchBar } from '@/components/common/SearchBar';
import { useNavigate } from 'react-router-dom';
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
import { bitHarborAdapter } from '@/lib/api/bitharbor-adapter';
import { MediaCard } from '@/components/cards/MediaCard';
import type { MediaItem, MediaType } from '@/types/api';

interface MediaTypePageProps {
  mediaType: MediaType;
  title: string;
  libraryId: string;
}

export function MediaTypePage({ mediaType, title }: MediaTypePageProps) {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<'SortName' | 'PremiereDate' | 'CommunityRating'>('SortName');
  const [sortOrder, setSortOrder] = useState<'Ascending' | 'Descending'>('Ascending');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<MediaItem[] | null>(null);

  // Fetch media items for this media type
  const { data: items, isLoading } = useQuery({
    queryKey: [mediaType],
    queryFn: async () => {
      try {
        const result = await bitHarborAdapter.getMedia(mediaType);
        return result.Items;
      } catch (err) {
        if (err instanceof Error && err.message.includes('404')) {
          return [];
        }
        throw err;
      }
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Use search results if present, otherwise use all items
  const filteredAndSortedItems = useMemo(() => {
    let baseItems: MediaItem[] = [];
    if (searchResults && items) {
      // Map search result IDs to full items from the already-fetched items
      const itemsById = new Map(items.map(item => [item.Id, item]));
      baseItems = searchResults
        .map(result => itemsById.get(result.Id))
        .filter((item): item is MediaItem => !!item);
    } else {
      baseItems = items || [];
    }
    let filteredItems = [...baseItems];
    if (selectedGenres.length > 0) {
      filteredItems = filteredItems.filter((item: MediaItem) =>
        item.Genres?.some(genre => selectedGenres.includes(genre))
      );
    }
    filteredItems.sort((a: MediaItem, b: MediaItem) => {
      let compareResult = 0;
      switch (sortBy) {
        case 'SortName':
          compareResult = (a.Name || '').localeCompare(b.Name || '');
          break;
        case 'PremiereDate':
          const dateA = a.ProductionYear || 0;
          const dateB = b.ProductionYear || 0;
          compareResult = dateA - dateB;
          break;
        case 'CommunityRating':
          compareResult = (a.CommunityRating || 0) - (b.CommunityRating || 0);
          break;
        default:
          compareResult = (a.Name || '').localeCompare(b.Name || '');
      }
      return sortOrder === 'Descending' ? -compareResult : compareResult;
    });
    return filteredItems;
  }, [items, searchResults, selectedGenres, sortBy, sortOrder]);

  // Extract unique genres from all items (not filtered)
  const availableGenres = useMemo(() => {
    if (!items) return [];
    return Array.from(
      new Set(
        items
          .flatMap((item: MediaItem) => item.Genres || [])
          .filter(Boolean)
      )
    ).sort() as string[];
  }, [items]);

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
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {filteredAndSortedItems.length} items
          {selectedGenres.length > 0 && ` (filtered from ${items?.length || 0})`}
        </Typography>
      </Box>

      {/* Search Bar */}
      <SearchBar mediaType={mediaType} onResults={setSearchResults} />

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
                Showing {filteredAndSortedItems.length} items matching: {selectedGenres.join(', ')}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Items Grid */}
      {filteredAndSortedItems.length > 0 ? (
        <Grid container spacing={3}>
          {filteredAndSortedItems.map((item: MediaItem) => (
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
