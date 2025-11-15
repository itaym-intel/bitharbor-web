import { Card, CardMedia, CardContent, Typography, LinearProgress, Box, Chip } from '@mui/material';
import { jellyfinApi } from '@/lib/jellyfin/api';
import type { MediaItem } from '@/types/jellyfin';

interface MediaCardProps {
  item: MediaItem;
  onClick?: () => void;
}

export function MediaCard({ item, onClick }: MediaCardProps) {
  const imageUrl = item.ImageTags?.Primary
    ? jellyfinApi.getImageUrl(item.Id, 'Primary', 300)
    : undefined;

  const progress =
    item.UserData?.PlayedPercentage && item.UserData.PlayedPercentage > 0
      ? item.UserData.PlayedPercentage
      : undefined;

  return (
    <Card
      onClick={onClick}
      sx={{
        width: 200,
        minWidth: 200,
        flexShrink: 0,
        cursor: 'pointer',
        transition: 'transform 0.2s',
        position: 'relative',
        '&:hover': {
          transform: 'scale(1.05)',
        },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="300"
          image={imageUrl || '/placeholder.jpg'}
          alt={item.Name}
          sx={{ objectFit: 'cover' }}
        />
        {/* Type indicator badge */}
        <Chip
          label={item.Type}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            fontSize: '0.7rem',
            height: 20,
          }}
        />
      </Box>
      {progress !== undefined && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 4 }}
        />
      )}
      <CardContent>
        <Typography variant="subtitle2" noWrap>
          {item.Name}
        </Typography>
        {item.ProductionYear && (
          <Typography variant="caption" color="text.secondary">
            {item.ProductionYear}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
