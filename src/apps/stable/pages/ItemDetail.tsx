import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Grid,
  IconButton,
  Link,
  Divider,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ArrowBack as ArrowBackIcon,
  Language as WebIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { apiClient } from '@/lib/api/api';
import type { MediaItem } from '@/types/api';

export function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Try to find the item in cached data first (movies, tv, music)
  const { data: item, isLoading } = useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      console.log('🔍 ItemDetail queryFn called for ID:', id);
      
      // First check if this item exists in any of the cached media lists
      const movieCache = queryClient.getQueryData<MediaItem[]>(['movie']);
      const tvCache = queryClient.getQueryData<MediaItem[]>(['tv']);
      const musicCache = queryClient.getQueryData<MediaItem[]>(['music']);
      
      console.log('📦 Cache check - movies:', movieCache?.length, 'tv:', tvCache?.length, 'music:', musicCache?.length);
      
      const cachedItem = 
        movieCache?.find(item => item.Id === id) ||
        tvCache?.find(item => item.Id === id) ||
        musicCache?.find(item => item.Id === id);
      
      if (cachedItem) {
        console.log('✅ Using cached item data:', cachedItem);
        return cachedItem;
      }
      
      // If not in cache, we don't have a way to fetch single items from BitHarbor yet
      // This shouldn't happen if user navigates from a list page
      console.error('❌ Item not found in cache. ID:', id);
      throw new Error('Item not found. Please navigate from the media list.');
    },
    enabled: !!id,
  });

  // Mutation for toggling favorite
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!item) return false;
      return apiClient.toggleFavorite(item.Id, item.UserData?.IsFavorite || false);
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['item', id] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['continueWatching'] });
      queryClient.invalidateQueries({ queryKey: ['recentlyAdded'] });
      queryClient.invalidateQueries({ queryKey: ['libraryItems'] });
    },
  });

  const handleToggleFavorite = () => {
    toggleFavoriteMutation.mutate();
  };

  if (isLoading || !item) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Use direct URLs from item data (already includes full TMDb URLs)
  const backdropUrl = item.BackdropUrl;
  const posterUrl = item.PosterUrl;

  const runtime = item.RunTimeTicks
    ? Math.floor(item.RunTimeTicks / 600000000) // Convert ticks to minutes
    : item.RuntimeMinutes || null;

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return null;
    }
  };

  return (
    <Box>
      {/* Back Button */}
      <Box sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: 'white' }}>
          <ArrowBackIcon />
        </IconButton>
      </Box>

      {/* Backdrop */}
      {backdropUrl && (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: 400,
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.9)), url(${backdropUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: 2,
            mb: 3,
          }}
        />
      )}

      <Grid container spacing={3}>
        {/* Poster */}
        <Grid item xs={12} sm={4} md={3}>
          {posterUrl && (
            <Paper
              component="img"
              src={posterUrl}
              alt={item.Name}
              sx={{
                width: '100%',
                height: 'auto',
                borderRadius: 2,
              }}
            />
          )}
        </Grid>

        {/* Details */}
        <Grid item xs={12} sm={8} md={9}>
          <Box>
            {/* Title and Year */}
            <Typography variant="h3" gutterBottom>
              {item.Name}
              {item.OriginalTitle && item.OriginalTitle !== item.Name && (
                <Typography component="span" variant="h5" color="text.secondary" sx={{ ml: 2 }}>
                  ({item.OriginalTitle})
                </Typography>
              )}
            </Typography>
            
            {/* Tagline (if available from enriched metadata) */}
            {item.Tagline && (
              <Typography variant="h6" color="text.secondary" sx={{ fontStyle: 'italic', mb: 2 }}>
                "{item.Tagline}"
              </Typography>
            )}

            {/* Year and External Links */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              {item.ProductionYear && (
                <Typography variant="h6" color="text.secondary">
                  {item.ProductionYear}
                </Typography>
              )}
              {item.ReleaseDate && (
                <Typography variant="body2" color="text.secondary">
                  {formatDate(item.ReleaseDate)}
                </Typography>
              )}
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, my: 3 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayIcon />}
                onClick={() => navigate(`/player/${item.Id}`)}
              >
                {item.UserData?.PlayedPercentage ? 'Resume' : 'Play'}
              </Button>
              <IconButton
                sx={{
                  border: 1,
                  borderColor: 'divider',
                }}
                onClick={handleToggleFavorite}
                disabled={toggleFavoriteMutation.isPending}
              >
                {item.UserData?.IsFavorite ? (
                  <FavoriteIcon color="error" />
                ) : (
                  <FavoriteBorderIcon />
                )}
              </IconButton>
            </Box>

            {/* Metadata Chips */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              <Chip label={item.Type || 'Media'} color="primary" />
              {item.OfficialRating && <Chip label={item.OfficialRating} variant="outlined" />}
              {runtime && <Chip label={`${runtime} min`} variant="outlined" />}
              {item.CommunityRating && (
                <Chip 
                  icon={<StarIcon sx={{ fontSize: 16 }} />}
                  label={`${item.CommunityRating.toFixed(1)}/10`} 
                  variant="outlined" 
                />
              )}
            </Box>

            {/* Genres */}
            {item.Genres && item.Genres.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Genres
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {item.Genres.map((genre) => (
                    <Chip key={genre} label={genre} size="small" />
                  ))}
                </Box>
              </Box>
            )}

            {/* Overview */}
            {item.Overview && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Overview
                </Typography>
                <Typography variant="body1">{item.Overview}</Typography>
              </Box>
            )}

            {/* Cast */}
            {item.Cast && item.Cast.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Cast
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {item.Cast.slice(0, 10).map((actor, index) => (
                    <Chip key={index} label={actor} size="small" variant="outlined" />
                  ))}
                  {item.Cast.length > 10 && (
                    <Chip label={`+${item.Cast.length - 10} more`} size="small" variant="outlined" />
                  )}
                </Stack>
              </Box>
            )}

            {/* Director */}
            {item.Director && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Director
                </Typography>
                <Typography variant="body2">{item.Director}</Typography>
              </Box>
            )}

            {/* TV Episode Info */}
            {item.Type === 'tv' && (item.EpisodeNumber || item.SeasonNumber) && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Episode Info
                </Typography>
                <Typography variant="body2">
                  {item.SeriesName && `${item.SeriesName} • `}
                  Season {item.ParentIndexNumber || item.SeasonNumber} • Episode {item.IndexNumber || item.EpisodeNumber}
                </Typography>
                {item.AirDate && (
                  <Typography variant="body2" color="text.secondary">
                    Aired: {formatDate(item.AirDate)}
                  </Typography>
                )}
              </Box>
            )}

            {/* Music Track Info */}
            {item.Type === 'music' && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Track Info
                </Typography>
                {item.Artist && <Typography variant="body2">Artist: {item.Artist}</Typography>}
                {item.Album && <Typography variant="body2">Album: {item.Album}</Typography>}
                {item.TrackNumber && <Typography variant="body2">Track: {item.TrackNumber}</Typography>}
              </Box>
            )}

            {/* Podcast Episode Info */}
            {item.Type === 'podcast' && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Podcast Info
                </Typography>
                {item.ShowName && <Typography variant="body2">Show: {item.ShowName}</Typography>}
                {item.PubDate && (
                  <Typography variant="body2">
                    Published: {formatDate(item.PubDate)}
                  </Typography>
                )}
              </Box>
            )}

            {/* Additional Movie Details */}
            {item.Type === 'movie' && (
              <>
                {/* Budget and Revenue */}
                {(item.Budget || item.Revenue) && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Box Office
                    </Typography>
                    {item.Budget && (
                      <Typography variant="body2">
                        Budget: {formatCurrency(item.Budget)}
                      </Typography>
                    )}
                    {item.Revenue && (
                      <Typography variant="body2">
                        Revenue: {formatCurrency(item.Revenue)}
                      </Typography>
                    )}
                  </Box>
                )}
              </>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
