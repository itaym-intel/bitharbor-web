
import { Box, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { bitTempleAdapter } from '@/lib/api/bittemple-adapter';
import { MediaRow } from '@/components/cards/MediaRow';

export function Home() {
  const navigate = useNavigate();

  // Movies
  const moviesQuery = useQuery({
    queryKey: ['movie'],
    queryFn: async () => {
      const result = await bitTempleAdapter.getMedia('movie');
      return result.Items;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // TV Shows
  const tvQuery = useQuery({
    queryKey: ['tv'],
    queryFn: async () => {
      const result = await bitTempleAdapter.getMedia('tv');
      return result.Items;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Music
  const musicQuery = useQuery({
    queryKey: ['music'],
    queryFn: async () => {
      const result = await bitTempleAdapter.getMedia('music');
      return result.Items;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const movies = moviesQuery.data;
  const tvShows = tvQuery.data;
  const music = musicQuery.data;
  const isLoading = moviesQuery.isLoading || tvQuery.isLoading || musicQuery.isLoading;


  const handleItemClick = (item: any) => {
    navigate(`/item/${item.Id}`);
  };

  return (
    <Box>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
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
