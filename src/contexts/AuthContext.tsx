import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jellyfinClient } from '@/lib/jellyfin/client';
import type { User, AuthResponse } from '@/types/jellyfin';

const TOKEN_KEY = 'jellyfin_token';
const USER_KEY = 'jellyfin_user';
const SERVER_KEY = 'jellyfin_server';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (serverUrl: string, username: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session ONCE on mount
    const token = localStorage.getItem(TOKEN_KEY);
    const userData = localStorage.getItem(USER_KEY);
    const serverUrl = localStorage.getItem(SERVER_KEY);

    if (token && userData && serverUrl) {
      setUser(JSON.parse(userData));
      jellyfinClient.connect(serverUrl).then(() => {
        jellyfinClient.setAccessToken(token);
      }).catch(() => {
        // Clear invalid session
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(SERVER_KEY);
        setUser(null);
      }).finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (serverUrl: string, username: string, password: string) => {
    try {
      // Connect to server
      await jellyfinClient.connect(serverUrl);
      
      // Authenticate
      const response = await fetch(`${serverUrl}/Users/AuthenticateByName`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Emby-Authorization': `MediaBrowser Client="Jellyfin Dupe", Device="Web Browser", DeviceId="${crypto.randomUUID()}", Version="0.1.0"`,
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
      
      jellyfinClient.setAccessToken(data.AccessToken);
      setUser(data.User);
      
      return data.User;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SERVER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
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
