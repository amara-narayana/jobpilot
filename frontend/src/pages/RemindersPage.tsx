import React, { useEffect, useState } from 'react';
import { reminderService, CreateReminderDTO } from '@/services/reminderService';
import { applicationService } from '@/services/applicationService';
import { Reminder, Application, ReminderType } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Bell,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Calendar,
  Building2,
  Circle,
} from 'lucide-react';

export const RemindersPage: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [includeCompleted, setIncludeCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateReminderDTO>({
    title: '',
    description: '',
    reminder_type: 'FOLLOW_UP',
    due_date: '',
    application_id: undefined,
  });

  useEffect(() => {
    loadData();
  }, [includeCompleted]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [remRes, appRes] = await Promise.all([
        reminderService.getReminders(includeCompleted),
        applicationService.getAllApplications(),
      ]);
      if (remRes.data) setReminders(remRes.data);
      if (appRes.data) setApplications(appRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reminderService.createReminder(form);
      setModalOpen(false);
      setForm({
        title: '',
        description: '',
        reminder_type: 'FOLLOW_UP',
        due_date: '',
      });
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: number, current: boolean) => {
    try {
      await reminderService.toggleComplete(id, !current);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await reminderService.deleteReminder(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-indigo-400" />
            <span>Reminders & Notifications</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated alerts for interview preparations, follow-ups, and application deadlines
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCompleted}
              onChange={(e) => setIncludeCompleted(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Show Completed</span>
          </label>

          <Button variant="primary" size="sm" className="gap-1.5" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Add Reminder</span>
          </Button>
        </div>
      </div>

      {/* Reminders List */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-900/60 rounded-xl" />
          ))}
        </div>
      ) : reminders.length > 0 ? (
        <div className="space-y-3">
          {reminders.map((rem) => (
            <div
              key={rem.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                rem.is_completed
                  ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <button
                  onClick={() => handleToggle(rem.id, rem.is_completed)}
                  className={`mt-1 transition-colors ${
                    rem.is_completed ? 'text-emerald-400' : 'text-slate-500 hover:text-indigo-400'
                  }`}
                >
                  {rem.is_completed ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold truncate ${
                        rem.is_completed ? 'line-through text-slate-400' : 'text-white'
                      }`}
                    >
                      {rem.title}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                      {rem.reminder_type}
                    </span>
                  </div>

                  {rem.description && (
                    <p className="text-xs text-slate-400 leading-relaxed">{rem.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                    <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Due: {new Date(rem.due_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>

                    {rem.company_name && (
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{rem.company_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(rem.id)}
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40">
          <Bell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Reminders Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Create reminders to follow up with recruiters, complete assessments, or prepare for interviews.
          </p>
          <Button variant="primary" size="sm" className="mt-4 gap-1.5" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Add Reminder</span>
          </Button>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Reminder"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Reminder Title"
            required
            placeholder="e.g. Email recruiter regarding next steps"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Type</label>
              <select
                value={form.reminder_type}
                onChange={(e) => setForm({ ...form, reminder_type: e.target.value as ReminderType })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="FOLLOW_UP">Follow-up</option>
                <option value="INTERVIEW">Interview</option>
                <option value="DEADLINE">Deadline</option>
                <option value="ASSESSMENT">Assessment</option>
              </select>
            </div>

            <Input
              label="Due Date & Time"
              type="datetime-local"
              required
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Related Application (Optional)
            </label>
            <select
              value={form.application_id || ''}
              onChange={(e) => setForm({ ...form, application_id: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="">None (Independent reminder)</option>
              {applications.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.company_name} — {a.job_title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Details (Optional)</label>
            <textarea
              rows={3}
              placeholder="Additional context or notes..."
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Create Reminder
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
