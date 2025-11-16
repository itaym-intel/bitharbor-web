import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '@/lib/api/client';
import type { User, AuthResponse, Admin, Participant } from '@/types/api';

const TOKEN_KEY = 'access_token';
const USER_KEY = 'user_data';
const SERVER_KEY = 'server_url';
const ADMIN_KEY = 'admin_data';
const PARTICIPANTS_KEY = 'participants_data';

interface AuthContextType {
  // Legacy user support
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // New BitTemple admin/participant support
  admin: Admin | null;
  participants: Participant[];
  currentDisplayName: string | null;
  
  // Auth methods
  login: (serverUrl: string, username: string, password: string) => Promise<User>;
  loginWithEmail: (email: string, password: string) => Promise<Admin>;
  logout: () => void;
  
  // Helper methods
  getAccessToken: () => string | null;
  refreshAdminInfo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Computed property for display name
  const currentDisplayName = admin?.display_name || user?.Name || null;

  useEffect(() => {
    // Check for existing session ONCE on mount
    const token = localStorage.getItem(TOKEN_KEY);
    const userData = localStorage.getItem(USER_KEY);
    const adminData = localStorage.getItem(ADMIN_KEY);
    const participantsData = localStorage.getItem(PARTICIPANTS_KEY);
    const serverUrl = localStorage.getItem(SERVER_KEY);

    if (!token) {
      setIsLoading(false);
      return;
    }

    apiService.setAccessToken(token);

  // New BitTemple auth flow (email login with admin data)
    if (adminData) {
      setAdmin(JSON.parse(adminData));
      if (participantsData) {
        setParticipants(JSON.parse(participantsData));
      }
      if (userData) {
        setUser(JSON.parse(userData));
      }
      setIsLoading(false);
      return;
    }

    // Legacy server-based auth fallback
    if (userData && serverUrl) {
      setUser(JSON.parse(userData));
      apiService.connect(serverUrl)
        .catch(() => {
          // Clear invalid session
          logout();
        })
        .finally(() => {
          setIsLoading(false);
        });
      return;
    }

    setIsLoading(false);
  }, []);

  // Legacy login method (for backward compatibility)
  const login = async (serverUrl: string, username: string, password: string) => {
    try {
      // Connect to server
      await apiService.connect(serverUrl);
      
      // Authenticate - Python FastAPI backend uses simple JSON auth
      const response = await fetch(`${serverUrl}/Users/AuthenticateByName`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Username: username,
          Pw: password,
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data: AuthResponse = await response.json();
      
      // Save session
      localStorage.setItem(TOKEN_KEY, data.AccessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(data.User));
      localStorage.setItem(SERVER_KEY, serverUrl);
      
      apiService.setAccessToken(data.AccessToken);
      setUser(data.User);
      
      return data.User;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // New BitTemple login method
  const loginWithEmail = async (email: string, password: string) => {
    try {
      // Use the BitTemple adapter for authentication
      const result = await apiService.bitTempleAdapter.login(email, password);
      
      // Save session with new format
      localStorage.setItem(TOKEN_KEY, result.accessToken);
      localStorage.setItem(ADMIN_KEY, JSON.stringify(result.admin));
      localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(result.participants || []));
      
      // Also save user for backward compatibility
      if (result.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(result.user));
        setUser(result.user);
      }
      
      apiService.setAccessToken(result.accessToken);
      
      if (result.admin) {
        setAdmin(result.admin);
      }
      if (result.participants) {
        setParticipants(result.participants);
      }
      
      return result.admin!;
    } catch (error) {
      console.error('Login with email failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SERVER_KEY);
    localStorage.removeItem(ADMIN_KEY);
    localStorage.removeItem(PARTICIPANTS_KEY);
    setUser(null);
    setAdmin(null);
    setParticipants([]);
  };

  const getAccessToken = () => {
    return localStorage.getItem(TOKEN_KEY);
  };

  const refreshAdminInfo = async () => {
    try {
      const result = await apiService.bitTempleAdapter.getMe();
      if (result.admin) {
        setAdmin(result.admin);
        localStorage.setItem(ADMIN_KEY, JSON.stringify(result.admin));
      }
    } catch (error) {
      console.error('Failed to refresh admin info:', error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user || !!admin, 
        isLoading, 
        admin,
        participants,
        currentDisplayName,
        login, 
        loginWithEmail,
        logout,
        getAccessToken,
        refreshAdminInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
