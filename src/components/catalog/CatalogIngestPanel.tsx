import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Stack,
  Chip,
  Divider,
  Alert,
  Snackbar,
  LinearProgress,
} from '@mui/material';
import { Search as SearchIcon, CloudDownload as CloudDownloadIcon } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { bitHarborAdapter } from '@/lib/api/bitharbor-adapter';
import type {
  CatalogMatch,
  CatalogMatchResponse,
  CatalogDownloadResponse,
  MediaType,
} from '@/types/api';

const mediaTypeLabels: Record<MediaType, string> = {
  movie: 'Movies',
  tv: 'TV Shows',
  music: 'Music',
  podcast: 'Podcasts',
  video: 'Videos',
  personal: 'Personal Media',
};

interface CatalogIngestPanelProps {
  mediaType: MediaType;
  title?: string;
  description?: string;
  dense?: boolean;
}

export function CatalogIngestPanel({
  mediaType,
  title,
  description,
  dense = false,
}: CatalogIngestPanelProps) {
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('');
  const [limit, setLimit] = useState(10);
  const [matches, setMatches] = useState<CatalogMatch[]>([]);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeMatchKey, setActiveMatchKey] = useState<string | null>(null);

  const panelTitle = title ?? `Add ${mediaTypeLabels[mediaType]} from Catalog`;
  const panelDescription =
    description ??
    'Search upstream catalog sources (TMDb, Internet Archive, etc.) for titles that are not yet in your BitHarbor library.';

  const searchMutation = useMutation<CatalogMatchResponse, Error, void>({
    mutationFn: async () => {
      if (!query.trim()) {
        throw new Error('Enter a title to search');
      }
      const parsedYear = year ? Number(year) : undefined;
      if (parsedYear && Number.isNaN(parsedYear)) {
        throw new Error('Year must be a number');
      }
      return bitHarborAdapter.searchCatalog(mediaType, query.trim(), {
        limit,
        year: parsedYear,
      });
    },
    onSuccess: (response) => {
      setMatches(response.matches || []);
      if (response.matches?.length) {
        console.log('[CatalogIngest] First catalog match metadata:', response.matches[0].tmdb_movie);
      }
      if (!response.matches?.length) {
        setAlert({ type: 'error', message: 'No catalog matches found.' });
      }
    },
    onError: (error) => {
      setAlert({ type: 'error', message: error.message || 'Catalog search failed.' });
    },
  });

  const downloadMutation = useMutation<CatalogDownloadResponse, Error, { matchKey: string; title: string }>({
    mutationFn: async ({ matchKey }) => {
      setActiveMatchKey(matchKey);
      return bitHarborAdapter.downloadCatalog(mediaType, {
        match_key: matchKey,
        execute: true,
      });
    },
    onSuccess: (response) => {
      setAlert({ type: 'success', message: `Download completed for ${response.title}` });
    },
    onError: (error) => {
      setAlert({ type: 'error', message: error.message || 'Download failed.' });
    },
    onSettled: () => {
      setActiveMatchKey(null);
    },
  });

  const handleDownloadClick = (match: CatalogMatch) => {
    const title = match.tmdb_movie.title || 'catalog title';
    setAlert({ type: 'success', message: `Download started. Fetching ${title}` });
    downloadMutation.mutate({ matchKey: match.match_key, title });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchMutation.mutate();
  };

  const handleCloseAlert = () => setAlert(null);

  const renderMatchCard = (match: CatalogMatch) => {
    const { tmdb_movie: movie, best_candidate: best } = match;
    const releaseYearValue = movie.release_date
      ? new Date(movie.release_date).getFullYear()
      : movie.year ?? null;
    const releaseYear =
      typeof releaseYearValue === 'number' && !Number.isNaN(releaseYearValue)
        ? releaseYearValue.toString()
        : null;
    const details = [
      releaseYear ? `Released: ${releaseYear}` : null,
      movie.runtime_min ? `${movie.runtime_min} min` : null,
      movie.vote_average ? `Rating: ${movie.vote_average.toFixed(1)}` : null,
    ].filter(Boolean);

    return (
      <Grid item xs={12} md={6} lg={4} key={match.match_key}>
        <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flexGrow: 1 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Chip label="Catalog" color="secondary" size="small" />
              {movie.genres?.slice(0, 2).map((genre) => (
                <Chip key={genre} label={genre} size="small" variant="outlined" />
              ))}
            </Stack>
            <Typography variant="h6" gutterBottom>
              {movie.title}
            </Typography>
            {details.length > 0 && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {details.join(' • ')}
              </Typography>
            )}
            {movie.overview && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {movie.overview}
              </Typography>
            )}
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2">Best Source</Typography>
            <Typography variant="body2" color="text.secondary">
              {best.catalog_source || 'internet_archive'} · {best.identifier}
            </Typography>
            {typeof best.score === 'number' && (
              <Typography variant="body2" color="text.secondary">
                Score: {(best.score * 100).toFixed(0)}%
              </Typography>
            )}
            {typeof best.downloads === 'number' && (
              <Typography variant="body2" color="text.secondary">
                Downloads: {best.downloads.toLocaleString()}
              </Typography>
            )}
          </CardContent>
          <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              Match key: {match.match_key.slice(0, 10)}…
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<CloudDownloadIcon />}
              onClick={() => handleDownloadClick(match)}
              disabled={downloadMutation.isPending && activeMatchKey === match.match_key}
            >
              {downloadMutation.isPending && activeMatchKey === match.match_key ? 'Downloading…' : 'Download'}
            </Button>
          </CardActions>
        </Card>
      </Grid>
    );
  };

  return (
    <Paper variant="outlined" sx={{ p: dense ? 2 : 3, mb: dense ? 3 : 4 }}>
      <Typography variant={dense ? 'h6' : 'h5'} gutterBottom>
        {panelTitle}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {panelDescription}
      </Typography>

      <Box
        component="form"
        onSubmit={handleSearch}
        sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}
      >
        <TextField
          label="Title"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
          InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} /> }}
          sx={{ flex: 2, minWidth: 220 }}
        />
        <TextField
          label="Year (optional)"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          type="number"
          sx={{ width: 160 }}
          inputProps={{ min: 1900, max: new Date().getFullYear() }}
        />
        <TextField
          label="Limit"
          type="number"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          sx={{ width: 130 }}
          inputProps={{ min: 1, max: 50 }}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={searchMutation.isPending}
          sx={{ minHeight: 56 }}
        >
          Search Catalog
        </Button>
      </Box>

      {searchMutation.isPending && <LinearProgress sx={{ mb: 3 }} />}

      {matches.length > 0 && (
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
          Showing {matches.length} catalog match{matches.length > 1 ? 'es' : ''}
        </Typography>
      )}

      <Grid container spacing={3}>
        {matches.map(renderMatchCard)}
      </Grid>

      {!searchMutation.isPending && matches.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Enter a title above to find catalog matches.
          </Typography>
        </Box>
      )}

      <Snackbar
        open={Boolean(alert)}
        autoHideDuration={alert?.type === 'success' ? null : 6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {alert ? (
          <Alert onClose={handleCloseAlert} severity={alert.type} sx={{ width: '100%' }}>
            {alert.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Paper>
  );
}
