import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@shared/schema";
import { authService, AuthResponse } from "@/lib/auth";
import { wsService } from "@/lib/websocket";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    role: 'fan' | 'model' | 'worker';
    bio?: string;
  }) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      if (authService.isAuthenticated()) {
        const userData = await authService.getCurrentUser();
        if (userData) {
          setUser(userData);
          // Connect to WebSocket if user is authenticated
          const token = authService.getToken();
          if (token) {
            wsService.connect(token);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response: AuthResponse = await authService.login(email, password);
    setUser(response.user);
    wsService.connect(response.token);
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    role: 'fan' | 'model' | 'worker';
    bio?: string;
  }) => {
    const response: AuthResponse = await authService.register(userData);
    setUser(response.user);
    wsService.connect(response.token);
  };

  const logout = () => {
    authService.logout();
    wsService.disconnect();
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      updateUser,
    }}>
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
