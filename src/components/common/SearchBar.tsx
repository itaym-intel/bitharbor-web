import { useState, useEffect } from 'react';
import { CircularProgress, Box, TextField, InputAdornment } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { bitTempleAdapter } from '@/lib/api/bittemple-adapter';
import type { MediaType, MediaItem, LocalSearchResponse, LocalSearchResult } from '@/types/api';

interface SearchBarProps {
  mediaType: MediaType;
  onResults: (results: MediaItem[]) => void;
}

export function SearchBar({ mediaType, onResults }: SearchBarProps) {
  const [inputValue, setInputValue] = useState('');

  const { data, isFetching } = useQuery({
    queryKey: ['local-search', mediaType, inputValue],
    queryFn: async () => {
      const query = inputValue.trim();
      if (!query) return [];
      const typeRoute = (bitTempleAdapter as any).getTypeRoute(mediaType);
      const baseUrl = (bitTempleAdapter as any).baseUrl || '';
      const getHeaders = (bitTempleAdapter as any).getHeaders.bind(bitTempleAdapter);
      const url = `${baseUrl}/${typeRoute}/local/search?query=${encodeURIComponent(query)}&limit=12&min_score=0.01`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
      });
      if (!response.ok) {
        console.error('Local search failed', response.status, response.statusText);
        return [];
      }
      const payload: LocalSearchResponse = await response.json();
      const results = Array.isArray(payload?.results) ? payload.results : [];
      const normalized = results.map((result: LocalSearchResult, index: number) =>
        normalizeResult(result, mediaType, index)
      );
      console.log('[SearchBar] Local search results:', {
        query,
        mediaType,
        count: normalized.length,
        results: normalized,
      });
      return normalized;
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

function normalizeResult(result: LocalSearchResult, fallbackType: MediaType, index: number): MediaItem {
  const metadataByType = (result.metadata_by_type || {}) as Record<MediaType, Record<string, any>>;
  const detail = result.media || result.media_detail || result.media_metadata || null;
  const resultType = (detail?.type as MediaType) || (result.type as MediaType) || fallbackType;
  const metadataCandidates = [
    detail?.metadata,
    metadataByType[resultType],
    result.metadata,
  ].filter(Boolean) as Record<string, any>[];
  const metadata = metadataCandidates[0] || {};

  const id = coerceId(
    detail?.media_id,
    metadata.media_id,
    metadata.file_hash,
    result.media_id,
    result.file_hash,
    result.vector_row_id,
    result.id,
    `search-${fallbackType}-${index}`
  );

  const releaseYear = metadata.year
    || (metadata.release_date ? new Date(metadata.release_date).getFullYear() : undefined);

  return {
    Id: id,
    Name: metadata.title || metadata.name || detail?.title || result.title || 'Untitled',
    Type: resultType,
    MediaType: resultType,
    Overview: metadata.overview || metadata.description || result.overview,
    PosterUrl: metadata.poster_url || metadata.poster?.file_path || result.poster_url,
    BackdropUrl: metadata.backdrop_url || metadata.backdrop?.file_path || result.backdrop_url,
    ProductionYear: typeof releaseYear === 'number' && !Number.isNaN(releaseYear) ? releaseYear : undefined,
    ReleaseDate: metadata.release_date,
    Genres: metadata.genres || [],
    RuntimeMinutes: metadata.runtime_min || metadata.runtime_minutes,
    CommunityRating: metadata.vote_average,
    OfficialRating: metadata.rating || metadata.content_rating,
    SourceType: (metadata.source_type as any) || 'catalog',
    UserData: {
      PlaybackPositionTicks: 0,
      IsFavorite: false,
      Played: false,
    },
  } as MediaItem;
}

function coerceId(...values: Array<string | number | undefined | null>): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number' && !Number.isNaN(value)) return value.toString();
  }
  return `search-${Math.random().toString(36).slice(2, 10)}`;
}
