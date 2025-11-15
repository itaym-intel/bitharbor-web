import { Box, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { jellyfinApi } from '@/lib/jellyfin/api';
import { MediaRow } from '@/components/cards/MediaRow';

export function Home() {
  const navigate = useNavigate();

  const { data: continueWatching, isLoading: loadingContinue } = useQuery({
    queryKey: ['continueWatching'],
    queryFn: () => jellyfinApi.getContinueWatching(),
  });

  const { data: recentlyAdded, isLoading: loadingRecent } = useQuery({
    queryKey: ['recentlyAdded'],
    queryFn: () => jellyfinApi.getRecentlyAdded(),
  });

  const { data: favorites, isLoading: loadingFavorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => jellyfinApi.getFavorites(),
  });

  const handleItemClick = (item: any) => {
    navigate(`/item/${item.Id}`);
  };

  const isLoading = loadingContinue || loadingRecent || loadingFavorites;

  return (
    <Box>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {continueWatching && continueWatching.length > 0 && (
            <MediaRow
              title="Continue Watching"
              items={continueWatching}
              onItemClick={handleItemClick}
            />
          )}
          {recentlyAdded && recentlyAdded.length > 0 && (
            <MediaRow
              title="Recently Added"
              items={recentlyAdded}
              onItemClick={handleItemClick}
            />
          )}
          {favorites && favorites.length > 0 && (
            <MediaRow
              title="Favorites"
              items={favorites}
              onItemClick={handleItemClick}
            />
          )}
        </>
      )}
    </Box>
  );
}
