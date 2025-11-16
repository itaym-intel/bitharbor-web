

import { Box, Typography } from '@mui/material';
import { MediaTypePage } from './MediaTypePage';



export function Home() {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Home
      </Typography>
      <Box sx={{ mb: 6 }}>
        <MediaTypePage
          mediaType="movie"
          title="Movies"
          libraryId="mock-library-movies"
        />
      </Box>
      <Box sx={{ mb: 6 }}>
        <MediaTypePage
          mediaType="tv"
          title="TV Shows"
          libraryId="mock-library-tv"
        />
      </Box>
      <Box sx={{ mb: 6 }}>
        <MediaTypePage
          mediaType="music"
          title="Music"
          libraryId="mock-library-music"
        />
      </Box>
    </Box>
  );
}
