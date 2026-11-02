import { api } from './api';
import { Company, ApiResponse } from '@/types';

export interface CreateCompanyDTO {
  name: string;
  website?: string | null;
  industry?: string | null;
  location?: string | null;
  recruiter_name?: string | null;
  recruiter_email?: string | null;
  recruiter_phone?: string | null;
  notes?: string | null;
}

export const companyService = {
  async getCompanies(): Promise<ApiResponse<Company[]>> {
    return api.get('/companies');
  },

  async getCompanyById(id: number): Promise<ApiResponse<Company>> {
    return api.get(`/companies/${id}`);
  },

  async createCompany(data: CreateCompanyDTO): Promise<ApiResponse<Company>> {
    return api.post('/companies', data);
  },

  async updateCompany(id: number, data: Partial<CreateCompanyDTO>): Promise<ApiResponse<Company>> {
    return api.put(`/companies/${id}`, data);
  },

  async deleteCompany(id: number): Promise<ApiResponse<void>> {
    return api.delete(`/companies/${id}`);
  },
};
