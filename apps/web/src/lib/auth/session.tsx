import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiClient, tokenStore } from '@/lib/api/client';
import type { AuthUser, LoginResponse } from '@/lib/api/types';

type AuthContextValue = {
  user: AuthUser | null;
  isBootstrapping: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setBootstrapping] = useState(true);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const profile = await apiClient.get<AuthUser>('/auth/me');
    setUser(profile);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await apiClient.post<LoginResponse>('/auth/login', {
      username,
      password,
    });
    tokenStore.set(result.accessToken);
    setUser(result.user);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (!tokenStore.get()) {
        setBootstrapping(false);
        return;
      }

      try {
        const profile = await apiClient.get<AuthUser>('/auth/me');
        if (mounted) {
          setUser(profile);
        }
      } catch {
        tokenStore.clear();
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setBootstrapping(false);
        }
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    window.addEventListener('silakap:unauthorized', logout);
    return () => window.removeEventListener('silakap:unauthorized', logout);
  }, [logout]);

  const value = useMemo(
    () => ({ user, isBootstrapping, login, logout, refreshUser }),
    [isBootstrapping, login, logout, refreshUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
