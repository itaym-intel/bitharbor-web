import { Box, Typography, Grid, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Favorite as FavoriteIcon } from '@mui/icons-material';
import { MediaCard } from '@/components/cards/MediaCard';

export function Favorites() {
  const navigate = useNavigate();

  // BitHarbor doesn't have favorites endpoint yet - show placeholder
  const favorites: any[] = [];
  const isLoading = false;

  const handleItemClick = (item: any) => {
    navigate(`/item/${item.Id}`);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
        }}
      >
        <FavoriteIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          No Favorites Yet
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Mark items as favorite to see them here
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <FavoriteIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h4">
          Favorites
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          ({favorites.length} items)
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {favorites.map((item) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={item.Id}>
            <MediaCard item={item} onClick={() => handleItemClick(item)} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
