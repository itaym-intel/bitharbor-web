import { Box, Typography, Grid, Card, CardContent, CardMedia } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { jellyfinApi } from '@/lib/jellyfin/api';
import { VideoLibrary as VideoLibraryIcon } from '@mui/icons-material';

export function Libraries() {
  const { data: libraries, isLoading } = useQuery({
    queryKey: ['libraries'],
    queryFn: () => jellyfinApi.getLibraries(),
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <Typography>Loading libraries...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Libraries
      </Typography>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {libraries?.map((library) => (
          <Grid item xs={12} sm={6} md={4} key={library.Id}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
              }}
              onClick={() => console.log('Navigate to library:', library.Name)}
            >
              <CardMedia
                sx={{
                  height: 140,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'primary.dark',
                }}
              >
                <VideoLibraryIcon sx={{ fontSize: 60, color: 'primary.light' }} />
              </CardMedia>
              <CardContent>
                <Typography variant="h6">{library.Name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {library.CollectionType || 'Mixed'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
