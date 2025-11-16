import { Box, Typography } from '@mui/material';
import { CatalogIngestPanel } from '@/components/catalog/CatalogIngestPanel';

export function Ingest() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Catalog Ingest
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Search TMDb and Internet Archive for movies that are not yet in your library, then download them directly into BitHarbor.
      </Typography>

      <CatalogIngestPanel mediaType="movie" />
    </Box>
  );
}
