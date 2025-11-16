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
  TextField,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { ContentCopy as CopyIcon } from '@mui/icons-material';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export function Settings() {
  const { mode, toggleTheme } = useTheme();
  const { admin } = useAuth();
  const [copySuccess, setCopySuccess] = useState(false);

  // Get token from localStorage
  const token = localStorage.getItem('access_token') || 'Not logged in';

  const handleCopyToken = () => {
    navigator.clipboard.writeText(token);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

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
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Version 0.1.0
            </Typography>

            {admin && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Admin: {admin.display_name} ({admin.email})
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                  Access Token:
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={token}
                  InputProps={{
                    readOnly: true,
                    sx: { fontFamily: 'monospace', fontSize: '0.75rem' },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleCopyToken} edge="end" size="small">
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                {copySuccess && (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    Token copied to clipboard!
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
