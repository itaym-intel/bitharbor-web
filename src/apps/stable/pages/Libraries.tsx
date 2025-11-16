import { Box, Typography, Grid, Card, CardContent, CardMedia } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Movie as MovieIcon,
  Tv as TvIcon,
  MusicNote as MusicIcon,
  Podcasts as PodcastIcon,
  VideoLibrary as VideoIcon,
  PhotoLibrary as PhotoIcon,
} from '@mui/icons-material';
import type { MediaItem } from '@/types/api';

export function Libraries() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Get counts from cached data
  const movieCache = queryClient.getQueryData<MediaItem[]>(['movie']);
  const tvCache = queryClient.getQueryData<MediaItem[]>(['tv']);
  const musicCache = queryClient.getQueryData<MediaItem[]>(['music']);
  const podcastCache = queryClient.getQueryData<MediaItem[]>(['podcast']);
  const videoCache = queryClient.getQueryData<MediaItem[]>(['video']);
  const personalCache = queryClient.getQueryData<MediaItem[]>(['personal']);

  const mediaTypes = [
    { id: 'movie', name: 'Movies', icon: MovieIcon, count: movieCache?.length || 0, path: '/movies' },
    { id: 'tv', name: 'TV Shows', icon: TvIcon, count: tvCache?.length || 0, path: '/tv' },
    { id: 'music', name: 'Music', icon: MusicIcon, count: musicCache?.length || 0, path: '/music' },
    { id: 'podcast', name: 'Podcasts', icon: PodcastIcon, count: podcastCache?.length || 0, path: '/podcasts' },
    { id: 'video', name: 'Videos', icon: VideoIcon, count: videoCache?.length || 0, path: '/videos' },
    { id: 'personal', name: 'Personal', icon: PhotoIcon, count: personalCache?.length || 0, path: '/personal' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Media Types
      </Typography>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {mediaTypes.map((mediaType) => {
          const Icon = mediaType.icon;
          return (
            <Grid item xs={12} sm={6} md={4} key={mediaType.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)',
                  },
                }}
                onClick={() => navigate(mediaType.path)}
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
                  <Icon sx={{ fontSize: 60, color: 'primary.light' }} />
                </CardMedia>
                <CardContent>
                  <Typography variant="h6">{mediaType.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {mediaType.count} items
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
