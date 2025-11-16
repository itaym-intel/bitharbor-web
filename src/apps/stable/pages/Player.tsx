import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, CircularProgress, Alert } from '@mui/material';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { apiClient } from '@/lib/api/api';

export function Player() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: item, isLoading, error } = useQuery({
    queryKey: ['item', id],
    queryFn: () => apiClient.getItemById(id!),
    enabled: !!id,
  });

  const reportProgressMutation = useMutation({
    mutationFn: ({ position, isPaused }: { position: number; isPaused: boolean }) =>
      apiClient.reportPlaybackProgress(id!, position, isPaused),
  });

  const reportStoppedMutation = useMutation({
    mutationFn: (position: number) => apiClient.reportPlaybackStopped(id!, position),
  });

  const handleProgressUpdate = (position: number) => {
    reportProgressMutation.mutate({ position, isPaused: false });

    // Mark as watched at 90%
    if (item && position >= item.RunTimeTicks! / 10000000 * 0.9) {
      apiClient.markAsPlayed(id!);
    }
  };

  const handlePlaybackEnd = () => {
    if (item) {
      reportStoppedMutation.mutate(item.RunTimeTicks! / 10000000);
      apiClient.markAsPlayed(id!);
    }
    navigate(-1); // Go back to previous page
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: 'black',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !item) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: 'black',
        }}
      >
        <Alert severity="error">Failed to load media item</Alert>
      </Box>
    );
  }

  const duration = item.RunTimeTicks ? item.RunTimeTicks / 10000000 : 3600; // Convert ticks to seconds
  const startPosition = item.UserData?.PlaybackPositionTicks
    ? item.UserData.PlaybackPositionTicks / 10000000
    : 0;

  return (
    <VideoPlayer
      itemId={item.Id}
      itemName={item.Name || 'Unknown'}
      duration={duration}
      startPosition={startPosition}
      onProgressUpdate={handleProgressUpdate}
      onPlaybackEnd={handlePlaybackEnd}
    />
  );
}
