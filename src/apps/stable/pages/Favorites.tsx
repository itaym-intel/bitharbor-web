import { Box, Typography } from '@mui/material';
import { Favorite as FavoriteIcon } from '@mui/icons-material';

export function Favorites() {
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
        Favorites
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Your favorite items will appear here
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        (Coming soon)
      </Typography>
    </Box>
  );
}
