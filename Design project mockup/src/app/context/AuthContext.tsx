import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api from '../../api/axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'owner' | 'admin';
  phone?: string | null;
  isVerified?: boolean;
  verificationStatus?: string | null;
  businessName?: string | null;
  businessAddress?: string | null;
  businessType?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  const refreshUser = useCallback(async () => {
    const t = localStorage.getItem('token');
    if (!t) return;
    try {
      let data: any;
      try {
        ({ data } = await api.get('/profile'));
      } catch (err: any) {
        // Backward compatibility: older backend instances may not have `/profile`.
        // If `/profile` is missing (404), fall back to the existing `/auth/me`.
        const status = err?.response?.status;
        if (status === 404) {
          ({ data } = await api.get('/auth/me'));
        } else {
          throw err;
        }
      }

      const u: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        phone: data.phone ?? null,
        isVerified: data.isVerified,
        verificationStatus: data.verificationStatus ?? null,
        businessName: data.businessName ?? null,
        businessAddress: data.businessAddress ?? null,
        businessType: data.businessType ?? null,
      };
      setUser(u);
      localStorage.setItem('user', JSON.stringify(u));
    } catch (err: any) {
      const status = err?.response?.status;
      // Only clear auth state on real authentication failures.
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    refreshUser();
  }, [token, refreshUser]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
