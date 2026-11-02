import React, { useEffect, useState } from 'react';
import { companyService, CreateCompanyDTO } from '@/services/companyService';
import { Company } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Building2,
  ExternalLink,
  Mail,
  Phone,
  User,
  Plus,
  Edit2,
  Trash2,
  Search,
  MapPin,
  Briefcase,
} from 'lucide-react';

export const CompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCompanyDTO>({
    name: '',
    website: '',
    industry: '',
    location: '',
    recruiter_name: '',
    recruiter_email: '',
    recruiter_phone: '',
    notes: '',
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const res = await companyService.getCompanies();
      if (res.data) setCompanies(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCompany(null);
    setFormData({
      name: '',
      website: '',
      industry: '',
      location: '',
      recruiter_name: '',
      recruiter_email: '',
      recruiter_phone: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (comp: Company) => {
    setEditingCompany(comp);
    setFormData({
      name: comp.name,
      website: comp.website || '',
      industry: comp.industry || '',
      location: comp.location || '',
      recruiter_name: comp.recruiter_name || '',
      recruiter_email: comp.recruiter_email || '',
      recruiter_phone: comp.recruiter_phone || '',
      notes: comp.notes || '',
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (editingCompany) {
        await companyService.updateCompany(editingCompany.id, formData);
      } else {
        await companyService.createCompany(formData);
      }
      setModalOpen(false);
      loadCompanies();
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this company profile?')) {
      try {
        await companyService.deleteCompany(id);
        loadCompanies();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredCompanies = companies.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.industry && c.industry.toLowerCase().includes(q)) ||
      (c.location && c.location.toLowerCase().includes(q)) ||
      (c.recruiter_name && c.recruiter_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-indigo-400" />
            <span>Companies & Recruiters</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Directory of organizations and direct recruitment points of contact
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <Button variant="primary" size="sm" className="gap-1.5" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" />
            <span>Add Company</span>
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
      ) : filteredCompanies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((c) => (
            <Card key={c.id} className="p-5 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">{c.name}</h3>
                    {c.industry && (
                      <span className="text-[11px] text-indigo-400 font-medium">{c.industry}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400">
                  {c.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{c.location}</span>
                    </div>
                  )}

                  {c.website && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <a
                        href={c.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:underline truncate"
                      >
                        {c.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}

                  {c.recruiter_name && (
                    <div className="flex items-center gap-2 text-slate-300 pt-1">
                      <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="font-semibold">{c.recruiter_name}</span>
                    </div>
                  )}

                  {c.recruiter_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <a href={`mailto:${c.recruiter_email}`} className="text-slate-300 hover:underline">
                        {c.recruiter_email}
                      </a>
                    </div>
                  )}
                </div>

                {c.notes && (
                  <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 line-clamp-2">
                    {c.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 font-medium text-slate-400">
                  <Briefcase className="w-3.5 h-3.5" />
                  {c.applications_count || 0} applications tracked
                </span>
                <span className="font-mono text-[10px]">ID: #{c.id}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Companies Recorded</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Add companies you are targeting or interviewing with.
          </p>
          <Button variant="primary" size="sm" className="mt-4 gap-1.5" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" />
            <span>Add Company</span>
          </Button>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCompany ? 'Edit Company Profile' : 'Add Target Company'}
        maxWidth="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Company Name"
            required
            placeholder="e.g. Datadog"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Website"
              type="url"
              placeholder="https://..."
              value={formData.website || ''}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
            <Input
              label="Industry"
              placeholder="Cloud / FinTech"
              value={formData.industry || ''}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />
          </div>

          <Input
            label="Headquarters / Location"
            placeholder="New York, NY / Remote"
            value={formData.location || ''}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />

          <div className="border-t border-slate-800 pt-3 space-y-3">
            <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Recruiter / Contact Person
            </h4>
            <Input
              label="Recruiter Name"
              placeholder="Sarah Jenkins"
              value={formData.recruiter_name || ''}
              onChange={(e) => setFormData({ ...formData, recruiter_name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="sjenkins@company.com"
                value={formData.recruiter_email || ''}
                onChange={(e) => setFormData({ ...formData, recruiter_email: e.target.value })}
              />
              <Input
                label="Phone"
                placeholder="+1 555-0192"
                value={formData.recruiter_phone || ''}
                onChange={(e) => setFormData({ ...formData, recruiter_phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Notes</label>
            <textarea
              rows={3}
              placeholder="Engineering stack, company culture, referral source..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={formLoading}>
              {editingCompany ? 'Save Changes' : 'Save Company'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
