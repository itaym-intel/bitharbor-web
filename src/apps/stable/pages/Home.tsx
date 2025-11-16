import { Box, CircularProgress, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { bitHarborAdapter } from '@/lib/api/bitharbor-adapter';
import { MediaRow } from '@/components/cards/MediaRow';

export function Home() {
  const navigate = useNavigate();

  // Get movies from BitHarbor backend
  const { data: movies, isLoading: loadingMovies } = useQuery({
    queryKey: ['movies'],
    queryFn: async () => {
      const result = await bitHarborAdapter.getMedia('movie', { limit: 12, offset: 0 });
      return result.Items;
    },
  });

  // Get TV shows from BitHarbor backend
  const { data: tvShows, isLoading: loadingTV } = useQuery({
    queryKey: ['tv'],
    queryFn: async () => {
      const result = await bitHarborAdapter.getMedia('tv', { limit: 12, offset: 0 });
      return result.Items;
    },
  });

  // Get music from BitHarbor backend
  const { data: music, isLoading: loadingMusic } = useQuery({
    queryKey: ['music'],
    queryFn: async () => {
      const result = await bitHarborAdapter.getMedia('music', { limit: 12, offset: 0 });
      return result.Items;
    },
  });

  const handleItemClick = (item: any) => {
    navigate(`/item/${item.Id}`);
  };

  const isLoading = loadingMovies || loadingTV || loadingMusic;

  return (
    <Box>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="h4" sx={{ mb: 3 }}>
            Welcome to BitHarbor
          </Typography>
          
          {movies && movies.length > 0 && (
            <MediaRow
              title="Movies"
              items={movies}
              onItemClick={handleItemClick}
            />
          )}
          {tvShows && tvShows.length > 0 && (
            <MediaRow
              title="TV Shows"
              items={tvShows}
              onItemClick={handleItemClick}
            />
          )}
          {music && music.length > 0 && (
            <MediaRow
              title="Music"
              items={music}
              onItemClick={handleItemClick}
            />
          )}
        </>
      )}
    </Box>
  );
}
