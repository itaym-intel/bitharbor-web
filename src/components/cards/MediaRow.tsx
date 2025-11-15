import { Box, Typography } from '@mui/material';
import { MediaCard } from './MediaCard';
import type { MediaItem } from '@/types/jellyfin';

interface MediaRowProps {
  title: string;
  items: MediaItem[];
  onItemClick?: (item: MediaItem) => void;
}

export function MediaRow({ title, items, onItemClick }: MediaRowProps) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 2,
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(255,255,255,0.1)',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255,255,255,0.3)',
            borderRadius: 4,
          },
        }}
      >
        {items.map((item) => (
          <MediaCard
            key={item.Id}
            item={item}
            onClick={() => onItemClick?.(item)}
          />
        ))}
      </Box>
    </Box>
  );
}
