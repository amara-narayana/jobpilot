import { api } from './api';
import { Interview, InterviewType, InterviewResult, ApiResponse } from '@/types';

export interface CreateInterviewDTO {
  application_id: number;
  interview_date: string;
  timezone?: string;
  interview_type: InterviewType;
  interview_round: number;
  meeting_link?: string | null;
  interviewer_details?: string | null;
  prep_notes?: string | null;
  feedback?: string | null;
  result?: InterviewResult;
}

export const interviewService = {
  async getInterviews(params?: { from?: string; to?: string; upcoming?: boolean }): Promise<ApiResponse<Interview[]>> {
    const query = new URLSearchParams();
    if (params?.from) query.append('from', params.from);
    if (params?.to) query.append('to', params.to);
    if (params?.upcoming) query.append('upcoming', 'true');
    const queryString = query.toString();
    return api.get(`/interviews${queryString ? `?${queryString}` : ''}`);
  },

  async getInterviewById(id: number): Promise<ApiResponse<Interview>> {
    return api.get(`/interviews/${id}`);
  },

  async createInterview(data: CreateInterviewDTO): Promise<ApiResponse<Interview>> {
    return api.post('/interviews', data);
  },

  async updateInterview(id: number, data: Partial<CreateInterviewDTO>): Promise<ApiResponse<Interview>> {
    return api.put(`/interviews/${id}`, data);
  },

  async deleteInterview(id: number): Promise<ApiResponse<void>> {
    return api.delete(`/interviews/${id}`);
  },
};
