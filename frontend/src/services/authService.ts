import { api } from './api';
import { User, UserPreferences, NotificationPreferences, ApiResponse } from '@/types';

export interface RegisterDTO {
  full_name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface VerifyOtpDTO {
  email: string;
  otp: string;
}

export interface ResendOtpDTO {
  email: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  password: string;
}

export const authService = {
  async register(data: RegisterDTO): Promise<ApiResponse<{ user_id: number; email: string; dev_otp?: string }>> {
    return api.post('/auth/register', data);
  },

  async verifyOtp(data: VerifyOtpDTO): Promise<ApiResponse<{ user: User }>> {
    return api.post('/auth/verify-otp', data);
  },

  async resendOtp(data: ResendOtpDTO): Promise<ApiResponse<{ message: string; dev_otp?: string }>> {
    return api.post('/auth/resend-otp', data);
  },

  async login(data: LoginDTO): Promise<ApiResponse<{ user: User }>> {
    return api.post('/auth/login', data);
  },

  async logout(): Promise<ApiResponse<void>> {
    return api.post('/auth/logout');
  },

  async getCurrentUser(): Promise<ApiResponse<{ user: User; preferences?: UserPreferences; notification_preferences?: NotificationPreferences }>> {
    return api.get('/auth/me');
  },

  async forgotPassword(data: ForgotPasswordDTO): Promise<ApiResponse<{ message: string; dev_token?: string }>> {
    return api.post('/auth/forgot-password', data);
  },

  async resetPassword(data: ResetPasswordDTO): Promise<ApiResponse<{ message: string }>> {
    return api.post('/auth/reset-password', data);
  },

  async updateProfile(data: { full_name: string; email?: string }): Promise<ApiResponse<{ user: User }>> {
    return api.put('/user/profile', data);
  },

  async updatePreferences(data: Partial<UserPreferences>): Promise<ApiResponse<{ preferences: UserPreferences }>> {
    return api.put('/user/preferences', data);
  },

  async updateNotificationPreferences(data: Partial<NotificationPreferences>): Promise<ApiResponse<{ notification_preferences: NotificationPreferences }>> {
    return api.put('/user/notification-preferences', data);
  },
};
