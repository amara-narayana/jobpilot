import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationService } from '@/services/applicationService';
import { Application, ApplicationStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  Kanban,
  Search,
  Plus,
  Building2,
  Calendar,
  DollarSign,
  MapPin,
  ChevronRight,
  MoveRight,
} from 'lucide-react';

const COLUMNS: { status: ApplicationStatus; title: string; color: string }[] = [
  { status: 'SAVED', title: 'Saved', color: 'border-slate-700 bg-slate-900/50' },
  { status: 'APPLIED', title: 'Applied', color: 'border-blue-900/40 bg-blue-950/20' },
  { status: 'ASSESSMENT', title: 'Assessment', color: 'border-amber-900/40 bg-amber-950/20' },
  { status: 'INTERVIEW', title: 'Interview', color: 'border-indigo-900/40 bg-indigo-950/20' },
  { status: 'OFFER', title: 'Offer', color: 'border-emerald-900/40 bg-emerald-950/20' },
  { status: 'REJECTED', title: 'Rejected', color: 'border-rose-900/40 bg-rose-950/20' },
  { status: 'WITHDRAWN', title: 'Withdrawn', color: 'border-zinc-800 bg-zinc-950/20' },
];

export const KanbanPage: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Move Modal State
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [targetStatus, setTargetStatus] = useState<ApplicationStatus>('APPLIED');
  const [statusNotes, setStatusNotes] = useState('');
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await applicationService.getAllApplications();
      if (res.data) {
        setApplications(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMove = (app: Application, nextStatus: ApplicationStatus) => {
    setSelectedApp(app);
    setTargetStatus(nextStatus);
    setStatusNotes('');
    setMoveModalOpen(true);
  };

  const handleConfirmMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    setMoving(true);
    try {
      await applicationService.updateStatus(selectedApp.id, targetStatus, statusNotes);
      setMoveModalOpen(false);
      loadApplications();
    } catch (err) {
      console.error(err);
    } finally {
      setMoving(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      app.company_name.toLowerCase().includes(q) ||
      app.job_title.toLowerCase().includes(q) ||
      (app.location && app.location.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Kanban className="w-6 h-6 text-indigo-400" />
            <span>Application Kanban Board</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visual pipeline progression across the 7 application lifecycle phases
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter board..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5"
            onClick={() => navigate('/app/applications?action=new')}
          >
            <Plus className="w-4 h-4" />
            <span>Add Job</span>
          </Button>
        </div>
      </div>

      {/* Kanban Board Columns Container */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="w-72 shrink-0 h-96 bg-slate-900/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 items-start">
          {COLUMNS.map((col) => {
            const colApps = filteredApps.filter((a) => a.status === col.status);
            return (
              <div
                key={col.status}
                className={`w-72 shrink-0 rounded-2xl border ${col.color} p-3 flex flex-col max-h-[calc(100vh-14rem)]`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {col.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-mono text-slate-300 font-semibold">
                      {colApps.length}
                    </span>
                  </div>
                </div>

                {/* Cards List in Column */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {colApps.length > 0 ? (
                    colApps.map((app) => (
                      <div
                        key={app.id}
                        className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-sm hover:shadow-md cursor-pointer group"
                        onClick={() => navigate(`/app/applications/${app.id}`)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                            {app.job_title}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">#{app.id}</span>
                        </div>

                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{app.company_name}</span>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-1">
                          {app.location && (
                            <span className="flex items-center gap-1 truncate max-w-[130px]">
                              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{app.location}</span>
                            </span>
                          )}

                          {app.salary_min && (
                            <span className="text-emerald-400 font-semibold">
                              ${Math.round(app.salary_min / 1000)}k
                              {app.salary_max ? ` - $${Math.round(app.salary_max / 1000)}k` : ''}
                            </span>
                          )}
                        </div>

                        {/* Quick Progression Trigger */}
                        <div
                          className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={app.status}
                            onChange={(e) => handleOpenMove(app, e.target.value as ApplicationStatus)}
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[10px] text-slate-300 focus:outline-none focus:border-indigo-500 font-medium"
                          >
                            <option value="SAVED">Saved</option>
                            <option value="APPLIED">Applied</option>
                            <option value="ASSESSMENT">Assessment</option>
                            <option value="INTERVIEW">Interview</option>
                            <option value="OFFER">Offer</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="WITHDRAWN">Withdrawn</option>
                          </select>

                          <button
                            onClick={() => {
                              const currentIndex = COLUMNS.findIndex((c) => c.status === app.status);
                              if (currentIndex >= 0 && currentIndex < COLUMNS.length - 1) {
                                handleOpenMove(app, COLUMNS[currentIndex + 1].status);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                            title="Move to Next Stage"
                          >
                            <MoveRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-24 border border-dashed border-slate-800/80 rounded-xl flex items-center justify-center text-[11px] text-slate-500">
                      Empty column
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Move Confirmation & Notes Modal */}
      <Modal
        isOpen={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        title="Move Application Stage"
        description={`Transitioning "${selectedApp?.job_title}" at ${selectedApp?.company_name}`}
        maxWidth="md"
      >
        <form onSubmit={handleConfirmMove} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target Stage
            </label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as ApplicationStatus)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-semibold"
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
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Reason or Transition Notes (Audit Log)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Recruiter confirmed interview date, submitted take-home project, or received offer details..."
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setMoveModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={moving}>
              Confirm Transition
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
