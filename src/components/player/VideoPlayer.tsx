import { useState, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  Slider,
  Typography,
  Stack,
  Fade,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  FullscreenExit,
  Settings,
  Subtitles,
} from '@mui/icons-material';

interface VideoPlayerProps {
  itemId: string; // Used when real backend streaming is implemented
  itemName: string;
  duration: number; // in seconds
  startPosition?: number; // resume position in seconds
  onProgressUpdate: (position: number) => void;
  onPlaybackEnd: () => void;
}

export function VideoPlayer({
  itemId: _itemId, // Prefix with _ to indicate intentionally unused for now
  itemName,
  duration,
  startPosition = 0,
  onProgressUpdate,
  onPlaybackEnd,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(startPosition);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const playerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<number>();
  const hideControlsTimeoutRef = useRef<number>();

  // Simulate playback with timer for mock server
  useEffect(() => {
    if (isPlaying) {
      progressIntervalRef.current = window.setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= duration) {
            setIsPlaying(false);
            onPlaybackEnd();
            return duration;
          }
          // Report progress every 10 seconds
          if (newTime % 10 === 0) {
            onProgressUpdate(newTime);
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, duration, onProgressUpdate, onPlaybackEnd]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      hideControlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (_event: Event, value: number | number[]) => {
    const newTime = value as number;
    setCurrentTime(newTime);
    onProgressUpdate(newTime);
  };

  const handleVolumeChange = (_event: Event, value: number | number[]) => {
    const newVolume = (value as number) / 100;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      ref={playerRef}
      onMouseMove={handleMouseMove}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        backgroundColor: 'black',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: showControls ? 'default' : 'none',
      }}
    >
      {/* Mock Video Display - Black Canvas */}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'black',
        }}
      >
        {!isPlaying && (
          <Typography variant="h4" color="white" sx={{ opacity: 0.5 }}>
            {itemName}
          </Typography>
        )}
      </Box>

      {/* Controls Overlay */}
      <Fade in={showControls}>
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
            padding: 2,
            paddingBottom: 3,
          }}
        >
          {/* Progress Bar */}
          <Slider
            value={currentTime}
            max={duration}
            onChange={handleSeek}
            sx={{
              color: 'primary.main',
              height: 6,
              '& .MuiSlider-thumb': {
                width: 16,
                height: 16,
              },
            }}
          />

          {/* Control Buttons */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mt: 1 }}
          >
            {/* Left Side - Play/Pause and Time */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton
                onClick={handlePlayPause}
                sx={{ color: 'white' }}
                size="large"
              >
                {isPlaying ? <Pause fontSize="large" /> : <PlayArrow fontSize="large" />}
              </IconButton>

              <Typography variant="body2" color="white" sx={{ minWidth: 120 }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Typography>
            </Stack>

            {/* Right Side - Volume, Settings, Fullscreen */}
            <Stack direction="row" alignItems="center" spacing={1}>
              {/* Volume Control */}
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton
                  onClick={handleMuteToggle}
                  sx={{ color: 'white' }}
                  size="small"
                >
                  {isMuted || volume === 0 ? <VolumeOff /> : <VolumeUp />}
                </IconButton>
                <Box sx={{ width: 100 }}>
                  <Slider
                    value={isMuted ? 0 : volume * 100}
                    onChange={handleVolumeChange}
                    sx={{
                      color: 'white',
                      '& .MuiSlider-thumb': {
                        width: 12,
                        height: 12,
                      },
                    }}
                  />
                </Box>
              </Stack>

              {/* Subtitles Button */}
              <IconButton sx={{ color: 'white' }} size="small">
                <Subtitles />
              </IconButton>

              {/* Settings Button */}
              <IconButton sx={{ color: 'white' }} size="small">
                <Settings />
              </IconButton>

              {/* Fullscreen Button */}
              <IconButton
                onClick={handleFullscreenToggle}
                sx={{ color: 'white' }}
                size="small"
              >
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Stack>
          </Stack>
        </Box>
      </Fade>

      {/* Title Overlay */}
      <Fade in={showControls}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
            padding: 2,
          }}
        >
          <Typography variant="h5" color="white">
            {itemName}
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
}
