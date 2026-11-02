import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserPreferences, NotificationPreferences } from '@/types';
import { authService, LoginDTO, RegisterDTO, VerifyOtpDTO } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  preferences: UserPreferences | null;
  notificationPreferences: NotificationPreferences | null;
  loading: boolean;
  login: (data: LoginDTO) => Promise<User>;
  register: (data: RegisterDTO) => Promise<{ user_id: number; email: string; dev_otp?: string }>;
  verifyOtp: (data: VerifyOtpDTO) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');

  const setTheme = useCallback((newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authService.getCurrentUser();
      if (res.data?.user) {
        setUser(res.data.user);
        if (res.data.preferences) {
          setPreferences(res.data.preferences);
          setTheme(res.data.preferences.theme);
        }
        if (res.data.notification_preferences) {
          setNotificationPreferences(res.data.notification_preferences);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setTheme]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (data: LoginDTO) => {
    const res = await authService.login(data);
    if (!res.data?.user) {
      throw new Error(res.error || 'Authentication failed');
    }
    await refreshUser();
    return res.data.user;
  };

  const register = async (data: RegisterDTO) => {
    const res = await authService.register(data);
    if (!res.data) {
      throw new Error(res.error || 'Registration failed');
    }
    return res.data;
  };

  const verifyOtp = async (data: VerifyOtpDTO) => {
    const res = await authService.verifyOtp(data);
    if (!res.data?.user) {
      throw new Error(res.error || 'Verification failed');
    }
    await refreshUser();
    return res.data.user;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setPreferences(null);
      setNotificationPreferences(null);
    }
  };

  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    const res = await authService.updatePreferences(newPrefs);
    if (res.data?.preferences) {
      setPreferences(res.data.preferences);
      if (res.data.preferences.theme) {
        setTheme(res.data.preferences.theme);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        preferences,
        notificationPreferences,
        loading,
        login,
        register,
        verifyOtp,
        logout,
        refreshUser,
        updatePreferences,
        theme,
        setTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
