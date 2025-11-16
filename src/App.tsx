import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline } from '@mui/material';
import { Login } from './apps/stable/pages/Login';
import { Home } from './apps/stable/pages/Home';
import { ItemDetail } from './apps/stable/pages/ItemDetail';
import { Libraries } from './apps/stable/pages/Libraries';
import { LibraryDetail } from './apps/stable/pages/LibraryDetail';
import { Favorites } from './apps/stable/pages/Favorites';
import { Player } from './apps/stable/pages/Player';
import { Search } from './apps/stable/pages/Search';
import { Settings } from './apps/stable/pages/Settings';
import { MainLayout } from './components/layout/MainLayout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function LoginRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : <Login />;
}

function AppRoutes() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Home />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/item/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ItemDetail />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/libraries"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Libraries />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/library/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <LibraryDetail />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/favorites"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Favorites />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Search />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Settings />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/player/:id"
        element={
          <ProtectedRoute>
            <Player />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CssBaseline />
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
