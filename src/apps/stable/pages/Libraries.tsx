import { Box, Typography, Grid, Card, CardContent, CardMedia } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api/api';
import { VideoLibrary as VideoLibraryIcon } from '@mui/icons-material';

export function Libraries() {
  const navigate = useNavigate();
  
  const { data: libraries, isLoading } = useQuery({
    queryKey: ['libraries'],
    queryFn: () => apiClient.getLibraries(),
  });

  // Fetch item counts for each library
  const { data: movieCount } = useQuery({
    queryKey: ['libraryCount', 'mock-library-movies'],
    queryFn: async () => {
      const result = await apiClient.getLibraryItems('mock-library-movies', { limit: 1 });
      return result.totalCount;
    },
  });

  const { data: tvCount } = useQuery({
    queryKey: ['libraryCount', 'mock-library-tvshows'],
    queryFn: async () => {
      const result = await apiClient.getLibraryItems('mock-library-tvshows', { limit: 1 });
      return result.totalCount;
    },
  });

  const { data: musicCount } = useQuery({
    queryKey: ['libraryCount', 'mock-library-music'],
    queryFn: async () => {
      const result = await apiClient.getLibraryItems('mock-library-music', { limit: 1 });
      return result.totalCount;
    },
  });

  const getItemCount = (libraryId: string) => {
    if (libraryId === 'mock-library-movies') return movieCount;
    if (libraryId === 'mock-library-tvshows') return tvCount;
    if (libraryId === 'mock-library-music') return musicCount;
    return undefined;
  };

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
              onClick={() => navigate(`/library/${library.Id}`)}
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
                  {getItemCount(library.Id) !== undefined && ` • ${getItemCount(library.Id)} items`}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
