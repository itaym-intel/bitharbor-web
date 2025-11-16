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
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { apiClient } from '@/lib/api/api';

export function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch the item by ID
  const { data: item, isLoading } = useQuery({
    queryKey: ['item', id],
    queryFn: () => apiClient.getItemById(id!),
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

  const backdropUrl = item.ImageTags?.Primary
    ? apiClient.getImageUrl(item.Id, 'Backdrop', 1920)
    : undefined;

  const posterUrl = item.ImageTags?.Primary
    ? apiClient.getImageUrl(item.Id, 'Primary', 300)
    : undefined;

  const runtime = item.RunTimeTicks
    ? Math.floor(item.RunTimeTicks / 600000000) // Convert ticks to minutes
    : null;

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
            </Typography>
            {item.ProductionYear && (
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {item.ProductionYear}
              </Typography>
            )}

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
              <Chip label={item.Type} color="primary" />
              {item.OfficialRating && <Chip label={item.OfficialRating} variant="outlined" />}
              {runtime && <Chip label={`${runtime} min`} variant="outlined" />}
              {item.CommunityRating && (
                <Chip label={`⭐ ${item.CommunityRating.toFixed(1)}`} variant="outlined" />
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

            {/* Additional Info for Episodes */}
            {item.Type === 'tv' && item.EpisodeNumber && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Episode Info
                </Typography>
                <Typography variant="body2">
                  Season {item.ParentIndexNumber || item.SeasonNumber} • Episode {item.IndexNumber || item.EpisodeNumber}
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
