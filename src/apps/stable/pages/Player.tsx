import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, CircularProgress, Alert } from '@mui/material';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { unifiedApiClient } from '@/lib/api/unified-client';

export function Player() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: item, isLoading, error } = useQuery({
    queryKey: ['item', id],
    queryFn: () => unifiedApiClient.getItemById(id!),
    enabled: !!id,
  });

  const reportProgressMutation = useMutation({
    mutationFn: ({ position, isPaused }: { position: number; isPaused: boolean }) =>
      unifiedApiClient.reportPlaybackProgress(id!, position, isPaused),
  });

  const reportStoppedMutation = useMutation({
    mutationFn: (position: number) => unifiedApiClient.reportPlaybackStopped(id!, position),
  });

  const handleProgressUpdate = (position: number) => {
    currentTime = position; // Update current time
    reportProgressMutation.mutate({ position, isPaused: false });

    // Mark as watched at 90%
    if (item && position >= item.RunTimeTicks! / 10000000 * 0.9) {
      unifiedApiClient.markAsPlayed(id!);
    }
  };

  const handlePlaybackEnd = () => {
    if (item) {
      reportStoppedMutation.mutate(item.RunTimeTicks! / 10000000);
      unifiedApiClient.markAsPlayed(id!);
    }
    navigate(-1); // Go back to previous page
  };

  const handleBack = () => {
    // Report current position before going back
    if (item) {
      reportStoppedMutation.mutate(currentTime);
    }
    navigate(-1);
  };

  let currentTime = 0; // Track current time for back button

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
      itemType={item.Type}
      duration={duration}
      startPosition={startPosition}
      onProgressUpdate={handleProgressUpdate}
      onPlaybackEnd={handlePlaybackEnd}
      onBack={handleBack}
    />
  );
}
