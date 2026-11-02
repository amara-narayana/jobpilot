import React, { useEffect, useState } from 'react';
import { interviewService, CreateInterviewDTO } from '@/services/interviewService';
import { applicationService } from '@/services/applicationService';
import { Interview, Application, InterviewType, InterviewResult } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Video,
  Calendar,
  Clock,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
} from 'lucide-react';

export const InterviewsPage: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'UPCOMING' | 'ALL'>('UPCOMING');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIt, setEditingIt] = useState<Interview | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState<CreateInterviewDTO>({
    application_id: 0,
    interview_date: '',
    timezone: 'UTC',
    interview_type: 'TECHNICAL',
    interview_round: 1,
    meeting_link: '',
    interviewer_details: '',
    prep_notes: '',
    feedback: '',
    result: 'PENDING',
  });

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itRes, appRes] = await Promise.all([
        interviewService.getInterviews({ upcoming: tab === 'UPCOMING' }),
        applicationService.getAllApplications(),
      ]);
      if (itRes.data) setInterviews(itRes.data);
      if (appRes.data) setApplications(appRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingIt(null);
    setFormData({
      application_id: applications.length > 0 ? applications[0].id : 0,
      interview_date: '',
      timezone: 'UTC',
      interview_type: 'TECHNICAL',
      interview_round: 1,
      meeting_link: '',
      interviewer_details: '',
      prep_notes: '',
      feedback: '',
      result: 'PENDING',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (it: Interview) => {
    setEditingIt(it);
    setFormData({
      application_id: it.application_id,
      interview_date: it.interview_date.replace(' ', 'T').substring(0, 16),
      timezone: it.timezone,
      interview_type: it.interview_type,
      interview_round: it.interview_round,
      meeting_link: it.meeting_link || '',
      interviewer_details: it.interviewer_details || '',
      prep_notes: it.prep_notes || '',
      feedback: it.feedback || '',
      result: it.result,
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingIt) {
        await interviewService.updateInterview(editingIt.id, formData);
      } else {
        await interviewService.createInterview(formData);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this interview record?')) {
      try {
        await interviewService.deleteInterview(id);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Video className="w-6 h-6 text-indigo-400" />
            <span>Interview Schedule & Prep</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track interview rounds, meeting coordinates, prep notes, and feedback
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => setTab('UPCOMING')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                tab === 'UPCOMING' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setTab('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                tab === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All History
            </button>
          </div>

          <Button variant="primary" size="sm" className="gap-1.5" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" />
            <span>Schedule Round</span>
          </Button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-900/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : interviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {interviews.map((it) => (
            <Card key={it.id} className="p-5 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                      Round {it.interview_round} &bull; {it.interview_type}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5">{it.company_name}</h3>
                    <p className="text-xs text-slate-400">{it.job_title}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(it)}
                      className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(it.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(it.interview_date).toLocaleString()}</span>
                  </div>

                  {it.interviewer_details && (
                    <p className="text-slate-400">
                      <strong>Panel:</strong> {it.interviewer_details}
                    </p>
                  )}
                </div>

                {it.prep_notes && (
                  <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                    <strong className="text-slate-300 block mb-0.5">Prep Notes:</strong>
                    <p className="line-clamp-2">{it.prep_notes}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    it.result === 'PASSED'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : it.result === 'FAILED'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {it.result}
                </span>

                {it.meeting_link && (
                  <a
                    href={it.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm shadow-indigo-950"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Meeting</span>
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40">
          <Video className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Interviews Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {tab === 'UPCOMING'
              ? 'No interviews currently scheduled. Stay sharp and keep applying!'
              : 'No past interviews on record.'}
          </p>
          <Button variant="primary" size="sm" className="mt-4 gap-1.5" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" />
            <span>Schedule Interview</span>
          </Button>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingIt ? 'Edit Interview Round' : 'Schedule Interview'}
        maxWidth="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target Job Application
            </label>
            <select
              value={formData.application_id}
              onChange={(e) => setFormData({ ...formData, application_id: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
            >
              {applications.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.company_name} — {a.job_title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date & Time"
              type="datetime-local"
              required
              value={formData.interview_date}
              onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Round</label>
              <select
                value={formData.interview_type}
                onChange={(e) => setFormData({ ...formData, interview_type: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="SCREENING">Screening</option>
                <option value="TECHNICAL">Technical</option>
                <option value="BEHAVIORAL">Behavioral</option>
                <option value="SYSTEM_DESIGN">System Design</option>
                <option value="ONSITE">Onsite</option>
                <option value="FINAL">Final</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Round #"
              type="number"
              min={1}
              value={formData.interview_round}
              onChange={(e) => setFormData({ ...formData, interview_round: Number(e.target.value) })}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Outcome</label>
              <select
                value={formData.result}
                onChange={(e) => setFormData({ ...formData, result: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="PENDING">Pending</option>
                <option value="PASSED">Passed</option>
                <option value="FAILED">Failed</option>
                <option value="RESCHEDULED">Rescheduled</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <Input
            label="Meeting URL"
            type="url"
            placeholder="https://zoom.us/j/..."
            value={formData.meeting_link || ''}
            onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
          />

          <Input
            label="Interviewer(s)"
            placeholder="e.g. Lead Architect & Staff Engineer"
            value={formData.interviewer_details || ''}
            onChange={(e) => setFormData({ ...formData, interviewer_details: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Preparation Notes</label>
            <textarea
              rows={3}
              placeholder="Key concepts to brush up on, questions to ask the interviewer..."
              value={formData.prep_notes || ''}
              onChange={(e) => setFormData({ ...formData, prep_notes: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={formLoading}>
              {editingIt ? 'Save Changes' : 'Schedule Round'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
