import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { applicationService, CreateApplicationDTO } from '@/services/applicationService';
import { companyService } from '@/services/companyService';
import { Application, ApplicationStatus, Company } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Briefcase,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Calendar,
  ExternalLink,
  Copy,
  Trash2,
  Edit2,
  DollarSign,
  MapPin,
} from 'lucide-react';

const STATUS_TABS: { label: string; value?: ApplicationStatus }[] = [
  { label: 'All' },
  { label: 'Saved', value: 'SAVED' },
  { label: 'Applied', value: 'APPLIED' },
  { label: 'Assessment', value: 'ASSESSMENT' },
  { label: 'Interview', value: 'INTERVIEW' },
  { label: 'Offer', value: 'OFFER' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Withdrawn', value: 'WITHDRAWN' },
];

export const ApplicationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<Application[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<ApplicationStatus | undefined>(
    (searchParams.get('status') as ApplicationStatus) || undefined
  );
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('updated_at');

  // Modal State
  const [modalOpen, setModalOpen] = useState(searchParams.get('action') === 'new');
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState<CreateApplicationDTO>({
    company_name: '',
    job_title: '',
    job_url: '',
    location: '',
    employment_type: 'FULL_TIME',
    salary_min: null,
    salary_max: null,
    currency: 'USD',
    deadline: '',
    status: 'SAVED',
    notes: '',
  });

  useEffect(() => {
    loadApplications();
    loadCompanies();
  }, [activeStatus, search, sortBy]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await applicationService.getApplications({
        status: activeStatus,
        search: search.trim() || undefined,
        sort_by: sortBy,
        sort_order: 'desc',
        page: 1,
        page_size: 100,
      });
      if (res.data?.items) {
        setApplications(res.data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const res = await companyService.getCompanies();
      if (res.data) setCompanies(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreate = () => {
    setEditingApp(null);
    setFormData({
      company_name: '',
      job_title: '',
      job_url: '',
      location: '',
      employment_type: 'FULL_TIME',
      salary_min: null,
      salary_max: null,
      currency: 'USD',
      deadline: '',
      status: 'SAVED',
      notes: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (app: Application) => {
    setEditingApp(app);
    setFormData({
      company_name: app.company_name,
      company_id: app.company_id,
      job_title: app.job_title,
      job_url: app.job_url || '',
      location: app.location || '',
      employment_type: app.employment_type,
      salary_min: app.salary_min,
      salary_max: app.salary_max,
      currency: app.currency,
      deadline: app.deadline || '',
      status: app.status,
      notes: app.notes || '',
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (editingApp) {
        await applicationService.updateApplication(editingApp.id, formData);
      } else {
        await applicationService.createApplication(formData);
      }
      setModalOpen(false);
      loadApplications();
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this job application?')) {
      try {
        await applicationService.deleteApplication(id);
        loadApplications();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await applicationService.duplicateApplication(id);
      loadApplications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (id: number, newStatus: ApplicationStatus) => {
    try {
      await applicationService.updateStatus(id, newStatus);
      loadApplications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Job Applications</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your opportunities, track deadlines, and log status evolutions
          </p>
        </div>
        <Button variant="primary" size="md" className="gap-2" onClick={handleOpenCreate}>
          <Plus className="w-4 h-4" />
          <span>New Application</span>
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {STATUS_TABS.map((tab) => {
            const isSelected = activeStatus === tab.value;
            return (
              <button
                key={tab.label}
                onClick={() => {
                  setActiveStatus(tab.value);
                  if (tab.value) {
                    searchParams.set('status', tab.value);
                  } else {
                    searchParams.delete('status');
                  }
                  setSearchParams(searchParams);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search role, company..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="updated_at">Recently Updated</option>
            <option value="created_at">Date Created</option>
            <option value="company_name">Company Name</option>
            <option value="salary_max">Highest Salary</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-900 rounded-xl" />
          ))}
        </div>
      ) : applications.length > 0 ? (
        <div className="space-y-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3
                    onClick={() => navigate(`/app/applications/${app.id}`)}
                    className="text-base font-bold text-white hover:text-indigo-400 cursor-pointer transition-colors truncate"
                  >
                    {app.job_title}
                  </h3>
                  <Badge status={app.status} />
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">{app.company_name}</span>
                  {app.location && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {app.location}
                    </span>
                  )}
                  {(app.salary_min || app.salary_max) && (
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
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

              {/* Status Selector & Actions */}
              <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                <select
                  value={app.status}
                  onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="SAVED">Saved</option>
                  <option value="APPLIED">Applied</option>
                  <option value="ASSESSMENT">Assessment</option>
                  <option value="INTERVIEW">Interview</option>
                  <option value="OFFER">Offer</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                </select>

                {app.job_url && (
                  <a
                    href={app.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    title="View Job URL"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                <button
                  onClick={() => handleDuplicate(app.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800"
                  title="Duplicate Application"
                >
                  <Copy className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleOpenEdit(app)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(app.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/30">
          <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Applications Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search || activeStatus
              ? 'No jobs match your search filters. Try clearing filters or creating a new entry.'
              : 'Start your career management by adding your first job application.'}
          </p>
          <Button variant="primary" size="sm" className="mt-4 gap-1.5" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" />
            <span>Add Application</span>
          </Button>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingApp ? 'Edit Job Application' : 'Track New Opportunity'}
        description="Record details about the role, compensation, and deadlines."
        maxWidth="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              required
              placeholder="e.g. Stripe"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            />

            <Input
              label="Job Title"
              required
              placeholder="e.g. Senior Backend Engineer"
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Job Posting URL"
              type="url"
              placeholder="https://..."
              value={formData.job_url || ''}
              onChange={(e) => setFormData({ ...formData, job_url: e.target.value })}
            />

            <Input
              label="Location"
              placeholder="e.g. San Francisco, CA / Remote"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Employment Type
              </label>
              <select
                value={formData.employment_type}
                onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="REMOTE">Remote</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Current Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ApplicationStatus })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
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

            <Input
              label="Application Deadline"
              type="date"
              value={formData.deadline || ''}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Min Salary"
              type="number"
              placeholder="150000"
              value={formData.salary_min || ''}
              onChange={(e) => setFormData({ ...formData, salary_min: e.target.value ? Number(e.target.value) : null })}
            />

            <Input
              label="Max Salary"
              type="number"
              placeholder="200000"
              value={formData.salary_max || ''}
              onChange={(e) => setFormData({ ...formData, salary_max: e.target.value ? Number(e.target.value) : null })}
            />

            <Input
              label="Currency"
              placeholder="USD"
              value={formData.currency || 'USD'}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Personal Notes
            </label>
            <textarea
              rows={3}
              placeholder="Key requirements, referral contacts, or preparation remarks..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={formLoading}>
              {editingApp ? 'Save Changes' : 'Create Application'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
