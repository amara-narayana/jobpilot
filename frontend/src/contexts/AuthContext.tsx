import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserPreferences, NotificationPreferences } from '@/types';
import { authService, LoginDTO, RegisterDTO, VerifyOtpDTO } from '@/services/authService';

export const LOCAL_USER: User = {
  id: 1,
  full_name: 'Amara Narayana',
  email: 'local@jobpilot.io',
  is_verified: true,
  created_at: '2026-11-02 00:00:00',
  updated_at: '2026-11-02 00:00:00',
};

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  default_currency: 'USD',
  timezone: 'UTC',
  email_notifications: true,
};

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email_interview_reminders: true,
  email_deadline_reminders: true,
  email_followup_reminders: true,
  email_daily_digest: false,
  lead_time_hours: 24,
};

interface AuthContextType {
  user: User;
  preferences: UserPreferences;
  notificationPreferences: NotificationPreferences;
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
  const [user, setUser] = useState<User>(LOCAL_USER);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [loading, setLoading] = useState(false);
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
        setUser(LOCAL_USER);
      }
    } catch {
      // Local standalone mode: fallback to LOCAL_USER
      setUser(LOCAL_USER);
    }
  }, [setTheme]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (_data: LoginDTO) => {
    return LOCAL_USER;
  };

  const register = async (_data: RegisterDTO) => {
    return { user_id: 1, email: LOCAL_USER.email };
  };

  const verifyOtp = async (_data: VerifyOtpDTO) => {
    return LOCAL_USER;
  };

  const logout = async () => {
    // Local standalone mode: No-op
  };

  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    try {
      setPreferences((prev) => ({ ...prev, ...newPrefs }));
      if (newPrefs.theme) {
        setTheme(newPrefs.theme);
      }
    } catch (e) {
      console.error('Failed to update preferences:', e);
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
