import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { applicationService } from '@/services/applicationService';
import { interviewService, CreateInterviewDTO } from '@/services/interviewService';
import { documentService } from '@/services/documentService';
import { reminderService, CreateReminderDTO } from '@/services/reminderService';
import {
  Application,
  ApplicationStatus,
  ApplicationStatusHistory,
  Interview,
  DocumentItem,
  Reminder,
} from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Building2,
  Calendar,
  ExternalLink,
  MapPin,
  DollarSign,
  Video,
  FileText,
  Clock,
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Edit2,
  Download,
  History,
  CheckCircle2,
} from 'lucide-react';

export const ApplicationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const appId = Number(id);

  const [app, setApp] = useState<Application | null>(null);
  const [history, setHistory] = useState<ApplicationStatusHistory[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [interviewModal, setInterviewModal] = useState(false);
  const [reminderModal, setReminderModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);

  // Forms
  const [targetStatus, setTargetStatus] = useState<ApplicationStatus>('INTERVIEW');
  const [statusNotes, setStatusNotes] = useState('');
  const [interviewForm, setInterviewForm] = useState<CreateInterviewDTO>({
    application_id: appId,
    interview_date: '',
    timezone: 'UTC',
    interview_type: 'TECHNICAL',
    interview_round: 1,
    meeting_link: '',
    interviewer_details: '',
    prep_notes: '',
  });
  const [reminderForm, setReminderForm] = useState<CreateReminderDTO>({
    application_id: appId,
    title: '',
    reminder_type: 'FOLLOW_UP',
    due_date: '',
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<'RESUME' | 'COVER_LETTER' | 'OTHER'>('RESUME');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (appId) {
      loadDetails();
    }
  }, [appId]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const [appRes, histRes, intRes, docRes, remRes] = await Promise.all([
        applicationService.getApplicationById(appId),
        applicationService.getStatusHistory(appId),
        interviewService.getInterviews(),
        documentService.getDocuments(appId),
        reminderService.getReminders(true),
      ]);

      if (appRes.data) setApp(appRes.data);
      if (histRes.data) setHistory(histRes.data);
      if (intRes.data) {
        setInterviews(intRes.data.filter((i) => i.application_id === appId));
      }
      if (docRes.data) setDocuments(docRes.data);
      if (remRes.data) {
        setReminders(remRes.data.filter((r) => r.application_id === appId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await applicationService.updateStatus(appId, targetStatus, statusNotes);
      setStatusModal(false);
      loadDetails();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await interviewService.createInterview({ ...interviewForm, application_id: appId });
      setInterviewModal(false);
      loadDetails();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reminderService.createReminder({ ...reminderForm, application_id: appId });
      setReminderModal(false);
      loadDetails();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setSubmitting(true);
    try {
      await documentService.uploadDocument(uploadFile, docType, appId);
      setUploadModal(false);
      setUploadFile(null);
      loadDetails();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Delete this application permanently?')) {
      await applicationService.deleteApplication(appId);
      navigate('/app/applications');
    }
  };

  if (loading || !app) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-900 rounded" />
        <div className="h-40 bg-slate-900 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-900 rounded-2xl lg:col-span-2" />
          <div className="h-64 bg-slate-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/app/applications"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Applications</span>
        </Link>
      </div>

      {/* Main Details Banner */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{app.job_title}</h1>
            <Badge status={app.status} />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-400" />
              {app.company_name}
            </span>
            {app.location && (
              <span className="flex items-center gap-1 text-slate-400">
                <MapPin className="w-3.5 h-3.5" />
                {app.location}
              </span>
            )}
            {(app.salary_min || app.salary_max) && (
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <DollarSign className="w-3.5 h-3.5" />
                {app.salary_min && `$${Number(app.salary_min).toLocaleString()}`}
                {app.salary_min && app.salary_max && ' - '}
                {app.salary_max && `$${Number(app.salary_max).toLocaleString()}`} {app.currency}
              </span>
            )}
            {app.deadline && (
              <span className="flex items-center gap-1 text-amber-400">
                <Calendar className="w-3.5 h-3.5" />
                Deadline: {app.deadline}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setTargetStatus(app.status);
              setStatusModal(true);
            }}
          >
            Change Stage
          </Button>

          {app.job_url && (
            <a href={app.job_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Job Posting</span>
              </Button>
            </a>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
            title="Delete Application"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Grid: Left Column Details & Right Column Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Notes & Description */}
          <Card>
            <CardHeader>
              <CardTitle>Role Overview & Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-slate-300 leading-relaxed">
              {app.job_description && (
                <div>
                  <h4 className="font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Job Description
                  </h4>
                  <p className="whitespace-pre-line bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                    {app.job_description}
                  </p>
                </div>
              )}

              {app.notes ? (
                <div>
                  <h4 className="font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Internal Notes
                  </h4>
                  <p className="whitespace-pre-line bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                    {app.notes}
                  </p>
                </div>
              ) : (
                <p className="text-slate-500 italic">No notes added yet for this role.</p>
              )}
            </CardContent>
          </Card>

          {/* Scheduled Interviews */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Interview Stages</CardTitle>
                <p className="text-xs text-slate-400 mt-1">Coordinated rounds and feedback</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                className="gap-1.5"
                onClick={() => setInterviewModal(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule Round</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {interviews.length > 0 ? (
                interviews.map((it) => (
                  <div
                    key={it.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">
                          Round {it.interview_round}: {it.interview_type}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold border border-indigo-500/20">
                          {it.result}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(it.interview_date).toLocaleString()}
                      </div>
                    </div>

                    {it.interviewer_details && (
                      <p className="text-xs text-slate-400">
                        <strong>Interviewer:</strong> {it.interviewer_details}
                      </p>
                    )}
                    {it.prep_notes && (
                      <p className="text-xs text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800">
                        <strong>Prep:</strong> {it.prep_notes}
                      </p>
                    )}
                    {it.meeting_link && (
                      <div className="pt-1">
                        <a
                          href={it.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-400 hover:underline inline-flex items-center gap-1 font-semibold"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Open Meeting Link</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">
                  No interview rounds scheduled yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Attached Documents */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Documents & Resumes</CardTitle>
                <p className="text-xs text-slate-400 mt-1">Versions linked to this application</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => setUploadModal(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <div>
                        <p className="text-xs font-semibold text-white">{doc.document_name}</p>
                        <p className="text-[10px] text-slate-400">
                          {doc.document_type} &bull; {(doc.file_size_bytes / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <a
                      href={documentService.getDownloadUrl(doc.id)}
                      download
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">No documents uploaded.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Status Timeline & Reminders */}
        <div className="space-y-6">
          {/* Status Evolution Audit History */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                <CardTitle>Lifecycle Progression</CardTitle>
              </div>
              <p className="text-xs text-slate-400 mt-1">Audit log of state transitions</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {history.length > 0 ? (
                <div className="relative border-l border-slate-800 ml-2 space-y-4 py-1">
                  {history.map((h, i) => (
                    <div key={h.id || i} className="ml-4 relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-slate-900" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{h.to_status}</span>
                        {h.from_status && (
                          <span className="text-[10px] text-slate-500">from {h.from_status}</span>
                        )}
                      </div>
                      {h.notes && <p className="text-xs text-slate-400 mt-1">{h.notes}</p>}
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(h.changed_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No transitions logged.</p>
              )}
            </CardContent>
          </Card>

          {/* Action Reminders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Follow-ups & Reminders</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs"
                onClick={() => setReminderModal(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {reminders.length > 0 ? (
                reminders.map((rem) => (
                  <div
                    key={rem.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1"
                  >
                    <p className="font-semibold text-white">{rem.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>Due: {new Date(rem.due_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">No active reminders.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Change Stage Modal */}
      <Modal
        isOpen={statusModal}
        onClose={() => setStatusModal(false)}
        title="Update Application Stage"
        maxWidth="md"
      >
        <form onSubmit={handleStatusChange} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Stage</label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as ApplicationStatus)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="SAVED">Saved</option>
              <option value="APPLIED">Applied</option>
              <option value="ASSESSMENT">Assessment</option>
              <option value="INTERVIEW">Interview</option>
              <option value="OFFER">Offer</option>
              <option value="REJECTED">Rejected</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Notes</label>
            <textarea
              rows={3}
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="Reason or update summary..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setStatusModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Update Status
            </Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={interviewModal}
        onClose={() => setInterviewModal(false)}
        title="Schedule Interview Round"
        maxWidth="md"
      >
        <form onSubmit={handleCreateInterview} className="space-y-4">
          <Input
            label="Date and Time"
            type="datetime-local"
            required
            value={interviewForm.interview_date}
            onChange={(e) => setInterviewForm({ ...interviewForm, interview_date: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Type</label>
              <select
                value={interviewForm.interview_type}
                onChange={(e) => setInterviewForm({ ...interviewForm, interview_type: e.target.value as any })}
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
            <Input
              label="Round Number"
              type="number"
              min={1}
              value={interviewForm.interview_round}
              onChange={(e) => setInterviewForm({ ...interviewForm, interview_round: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Meeting Link"
            type="url"
            placeholder="https://meet.google.com/..."
            value={interviewForm.meeting_link || ''}
            onChange={(e) => setInterviewForm({ ...interviewForm, meeting_link: e.target.value })}
          />

          <Input
            label="Interviewer Name / Details"
            placeholder="Sarah (Hiring Manager)"
            value={interviewForm.interviewer_details || ''}
            onChange={(e) => setInterviewForm({ ...interviewForm, interviewer_details: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setInterviewModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Schedule Interview
            </Button>
          </div>
        </form>
      </Modal>

      {/* Upload Document Modal */}
      <Modal
        isOpen={uploadModal}
        onClose={() => setUploadModal(false)}
        title="Upload Resume or Document"
        maxWidth="md"
      >
        <form onSubmit={handleUploadDoc} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="RESUME">Resume</option>
              <option value="COVER_LETTER">Cover Letter</option>
              <option value="PORTFOLIO">Portfolio</option>
              <option value="CERTIFICATE">Certificate</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Choose File</label>
            <input
              type="file"
              required
              onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setUploadModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Upload Document
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Reminder Modal */}
      <Modal
        isOpen={reminderModal}
        onClose={() => setReminderModal(false)}
        title="Add Follow-up Reminder"
        maxWidth="md"
      >
        <form onSubmit={handleCreateReminder} className="space-y-4">
          <Input
            label="Reminder Title"
            required
            placeholder="e.g. Check in with recruiter about offer letter"
            value={reminderForm.title}
            onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
          />

          <Input
            label="Due Date and Time"
            type="datetime-local"
            required
            value={reminderForm.due_date}
            onChange={(e) => setReminderForm({ ...reminderForm, due_date: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setReminderModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Set Reminder
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
