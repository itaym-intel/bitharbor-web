import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
import { jellyfinApi } from '@/lib/jellyfin/api';

export function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // For now, we'll get the item from our existing API calls
  // In a real app, we'd have a getItemById function
  const { data: continueWatching } = useQuery({
    queryKey: ['continueWatching'],
    queryFn: () => jellyfinApi.getContinueWatching(),
  });

  const { data: recentlyAdded } = useQuery({
    queryKey: ['recentlyAdded'],
    queryFn: () => jellyfinApi.getRecentlyAdded(),
  });

  const allItems = [...(continueWatching || []), ...(recentlyAdded || [])];
  const item = allItems.find((i) => i.Id === id);

  if (!item) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const backdropUrl = item.ImageTags?.Primary
    ? jellyfinApi.getImageUrl(item.Id, 'Backdrop', 1920)
    : undefined;

  const posterUrl = item.ImageTags?.Primary
    ? jellyfinApi.getImageUrl(item.Id, 'Primary', 300)
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
                onClick={() => console.log('Play:', item.Name)}
              >
                {item.UserData?.PlayedPercentage ? 'Resume' : 'Play'}
              </Button>
              <IconButton
                sx={{
                  border: 1,
                  borderColor: 'divider',
                }}
                onClick={() => console.log('Toggle favorite:', item.Name)}
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
            {item.Type === 'Episode' && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Episode Info
                </Typography>
                <Typography variant="body2">
                  Season {item.ParentIndexNumber} • Episode {item.IndexNumber}
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
