import { useState, useEffect } from 'react';
import { CircularProgress, Box, TextField, InputAdornment } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { bitTempleAdapter } from '@/lib/api/bittemple-adapter';
import type { MediaType, MediaItem } from '@/types/api';

interface SearchBarProps {
  mediaType: MediaType;
  onResults: (results: MediaItem[]) => void;
}

export function SearchBar({ mediaType, onResults }: SearchBarProps) {
  const [inputValue, setInputValue] = useState('');

  const { data, isFetching } = useQuery({
    queryKey: ['search', inputValue, mediaType],
    queryFn: async () => {
      if (!inputValue.trim()) return [];
      // Use the /local/search endpoint for local search (GET with query params)
      const typeRoute = (bitTempleAdapter as any).getTypeRoute(mediaType);
      const baseUrl = (bitTempleAdapter as any).baseUrl || '';
      const getHeaders = (bitTempleAdapter as any).getHeaders.bind(bitTempleAdapter);
  const url = `${baseUrl}/${typeRoute}/local/search?query=${encodeURIComponent(inputValue)}&limit=5&min_score=0.2`;
  console.log('[SearchBar] Fetching:', url);
  const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      // Assume data.results is an array of search results
      return (data.results || []).map((result: any) => ({
        Id: result.media_id,
        Name: result.title,
        Type: result.type,
        MediaType: result.type,
        Overview: result.overview,
        UserData: {
          PlaybackPositionTicks: 0,
          IsFavorite: false,
          Played: false,
        },
      }));
    },
    enabled: !!inputValue.trim(),
  });

  useEffect(() => {
    if (data) {
      onResults(data);
    }
  }, [data, onResults]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!e.target.value.trim()) {
      onResults([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // No-op, search is live as you type
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400, mb: 3 }}>
      <TextField
        fullWidth
        value={inputValue}
        onChange={handleInputChange}
        placeholder={`Search ${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}s...`}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: isFetching ? <CircularProgress size={20} /> : null,
        }}
        size="small"
      />
    </Box>
  );
}
