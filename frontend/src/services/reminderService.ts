import { api } from './api';
import { Reminder, ReminderType, ApiResponse } from '@/types';

export interface CreateReminderDTO {
  title: string;
  description?: string;
  reminder_type: ReminderType;
  due_date: string;
  application_id?: number | null;
  interview_id?: number | null;
}

export const reminderService = {
  async getReminders(includeCompleted = false): Promise<ApiResponse<Reminder[]>> {
    return api.get(`/reminders?include_completed=${includeCompleted}`);
  },

  async createReminder(data: CreateReminderDTO): Promise<ApiResponse<Reminder>> {
    return api.post('/reminders', data);
  },

  async toggleComplete(id: number, is_completed: boolean): Promise<ApiResponse<Reminder>> {
    return api.patch(`/reminders/${id}/complete`, { is_completed });
  },

  async deleteReminder(id: number): Promise<ApiResponse<void>> {
    return api.delete(`/reminders/${id}`);
  },
};
