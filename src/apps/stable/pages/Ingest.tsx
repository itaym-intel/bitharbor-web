import { useState } from 'react';
import {
  Box,
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
} from '@/types/api';

export function Ingest() {
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('');
  const [limit, setLimit] = useState(10);
  const [matches, setMatches] = useState<CatalogMatch[]>([]);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeMatchKey, setActiveMatchKey] = useState<string | null>(null);

  const searchMutation = useMutation<CatalogMatchResponse, Error, void>({
    mutationFn: async () => {
      if (!query.trim()) {
        throw new Error('Enter a title to search');
      }
      const parsedYear = year ? Number(year) : undefined;
      if (parsedYear && Number.isNaN(parsedYear)) {
        throw new Error('Year must be a number');
      }
      return bitHarborAdapter.searchCatalogMovies(query.trim(), {
        limit,
        year: parsedYear,
      });
    },
    onSuccess: (response) => {
      setMatches(response.matches || []);
      if (!response.matches?.length) {
        setAlert({ type: 'error', message: 'No catalog matches found.' });
      }
    },
    onError: (error) => {
      setAlert({ type: 'error', message: error.message || 'Catalog search failed.' });
    },
  });

  const downloadMutation = useMutation<CatalogDownloadResponse, Error, string>({
    mutationFn: async (matchKey) => {
      setActiveMatchKey(matchKey);
      return bitHarborAdapter.downloadCatalogMovie({
        match_key: matchKey,
        execute: true,
      });
    },
    onSuccess: (response) => {
      setAlert({ type: 'success', message: `Download started for ${response.title}` });
    },
    onError: (error) => {
      setAlert({ type: 'error', message: error.message || 'Download failed.' });
    },
    onSettled: () => {
      setActiveMatchKey(null);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchMutation.mutate();
  };

  const handleCloseAlert = () => setAlert(null);

  const renderMatchCard = (match: CatalogMatch) => {
    const { tmdb_movie: movie, best_candidate: best } = match;
    const details = [
      movie.release_date || movie.year ? `Released: ${movie.release_date || movie.year}` : null,
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
              onClick={() => downloadMutation.mutate(match.match_key)}
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
    <Box>
      <Typography variant="h4" gutterBottom>
        Catalog Ingest
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Search TMDb and Internet Archive for movies that are not yet in your library, then download them directly into BitHarbor.
      </Typography>

      <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <TextField
          label="Movie title"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
          InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} /> }}
          sx={{ flex: 2, minWidth: 240 }}
        />
        <TextField
          label="Year (optional)"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          type="number"
          sx={{ width: 150 }}
          inputProps={{ min: 1900, max: new Date().getFullYear() }}
        />
        <TextField
          label="Limit"
          type="number"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          sx={{ width: 120 }}
          inputProps={{ min: 1, max: 50 }}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={searchMutation.isPending}
          sx={{ height: { xs: 48, sm: 56 } }}
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
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography variant="body1" color="text.secondary">
            Enter a title above to find catalog matches.
          </Typography>
        </Box>
      )}

      <Snackbar
        open={Boolean(alert)}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {alert ? (
          <Alert onClose={handleCloseAlert} severity={alert.type} sx={{ width: '100%' }}>
            {alert.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
