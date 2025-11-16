import {
  Container,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Switch,
  Divider,
  Alert,
} from '@mui/material';
import { useTheme } from '@/contexts/ThemeContext';

export function Settings() {
  const { mode, toggleTheme } = useTheme();

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        
        <Paper sx={{ mt: 3 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Appearance
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              <ListItem>
                <ListItemText
                  primary="Dark Mode"
                  secondary={mode === 'dark' ? 'Currently using dark theme' : 'Currently using light theme (coming soon)'}
                />
                <Switch
                  edge="end"
                  onChange={toggleTheme}
                  checked={mode === 'dark'}
                  inputProps={{
                    'aria-label': 'dark mode toggle',
                  }}
                />
              </ListItem>
            </List>
            
            {mode === 'light' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Light mode is currently under development. The UI may not display optimally.
              </Alert>
            )}
          </Box>
        </Paper>

        <Paper sx={{ mt: 3 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              About
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="body2" color="text.secondary" paragraph>
              BitHarbor Web Client
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Version 0.1.0
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
