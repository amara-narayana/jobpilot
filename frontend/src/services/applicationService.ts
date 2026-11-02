import { api } from './api';
import { Application, ApplicationStatus, ApplicationStatusHistory, ApiResponse, PaginatedResponse } from '@/types';

export interface ApplicationFilterParams {
  search?: string;
  status?: ApplicationStatus;
  company_id?: number;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CreateApplicationDTO {
  company_name: string;
  company_id?: number | null;
  job_title: string;
  job_description?: string;
  job_url?: string;
  location?: string;
  employment_type?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string;
  date_discovered?: string | null;
  date_applied?: string | null;
  deadline?: string | null;
  resume_version?: string;
  cover_letter?: string;
  notes?: string;
  status?: ApplicationStatus;
}

export const applicationService = {
  async getApplications(params: ApplicationFilterParams = {}): Promise<ApiResponse<PaginatedResponse<Application>>> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.company_id) query.append('company_id', params.company_id.toString());
    if (params.page) query.append('page', params.page.toString());
    if (params.page_size) query.append('page_size', params.page_size.toString());
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.sort_order) query.append('sort_order', params.sort_order);

    const queryString = query.toString();
    return api.get(`/applications${queryString ? `?${queryString}` : ''}`);
  },

  async getAllApplications(): Promise<ApiResponse<Application[]>> {
    return api.get('/applications/all');
  },

  async getApplicationById(id: number): Promise<ApiResponse<Application>> {
    return api.get(`/applications/${id}`);
  },

  async createApplication(data: CreateApplicationDTO): Promise<ApiResponse<Application>> {
    return api.post('/applications', data);
  },

  async updateApplication(id: number, data: Partial<CreateApplicationDTO>): Promise<ApiResponse<Application>> {
    return api.put(`/applications/${id}`, data);
  },

  async updateStatus(id: number, status: ApplicationStatus, notes?: string): Promise<ApiResponse<Application>> {
    return api.patch(`/applications/${id}/status`, { status, notes });
  },

  async bulkUpdateStatus(application_ids: number[], status: ApplicationStatus): Promise<ApiResponse<{ updated: number }>> {
    return api.post('/applications/bulk-status', { application_ids, status });
  },

  async duplicateApplication(id: number): Promise<ApiResponse<Application>> {
    return api.post(`/applications/${id}/duplicate`);
  },

  async deleteApplication(id: number): Promise<ApiResponse<void>> {
    return api.delete(`/applications/${id}`);
  },

  async getStatusHistory(id: number): Promise<ApiResponse<ApplicationStatusHistory[]>> {
    return api.get(`/applications/${id}/history`);
  },
};
