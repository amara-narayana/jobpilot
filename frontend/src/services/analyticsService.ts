import { api } from './api';
import { DashboardMetrics, AnalyticsMetrics, ApiResponse } from '@/types';

export const analyticsService = {
  async getDashboardMetrics(): Promise<ApiResponse<DashboardMetrics>> {
    return api.get('/dashboard');
  },

  async getAnalyticsMetrics(): Promise<ApiResponse<AnalyticsMetrics>> {
    return api.get('/analytics');
  },

  async exportData(): Promise<Blob> {
    const response = await fetch('/api/v1/user/export', {
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Export failed');
    }
    return response.blob();
  },
};
