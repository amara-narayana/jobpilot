import React, { useEffect, useState } from 'react';
import { documentService } from '@/services/documentService';
import { applicationService } from '@/services/applicationService';
import { DocumentItem, Application, DocumentType } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  FileText,
  Download,
  Trash2,
  Plus,
  Upload,
  Search,
  FileCheck,
  FolderOpen,
} from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Upload modal
  const [modalOpen, setModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentType>('RESUME');
  const [applicationId, setApplicationId] = useState<number | undefined>(undefined);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docRes, appRes] = await Promise.all([
        documentService.getDocuments(),
        applicationService.getAllApplications(),
      ]);
      if (docRes.data) setDocuments(docRes.data);
      if (appRes.data) setApplications(appRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    try {
      await documentService.uploadDocument(file, docType, applicationId);
      setModalOpen(false);
      setFile(null);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this file permanently?')) {
      try {
        await documentService.deleteDocument(id);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredDocs = documents.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.document_name.toLowerCase().includes(q) ||
      d.document_type.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-400" />
            <span>Document & Resume Vault</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Store resume versions, tailored cover letters, portfolios, and certificates
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <Button variant="primary" size="sm" className="gap-1.5" onClick={() => setModalOpen(true)}>
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
          </Button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-900/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <Card key={doc.id} className="p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-white truncate" title={doc.document_name}>
                        {doc.document_name}
                      </h4>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {doc.document_type}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={documentService.getDownloadUrl(doc.id)}
                      download
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{(doc.file_size_bytes / 1024).toFixed(1)} KB</span>
                  <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40">
          <FolderOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Files Uploaded</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Upload custom resumes, cover letter templates, and portfolios.
          </p>
          <Button variant="primary" size="sm" className="mt-4 gap-1.5" onClick={() => setModalOpen(true)}>
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
          </Button>
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Upload Career Document"
        maxWidth="md"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocumentType)}
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
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Link to Application (Optional)
            </label>
            <select
              value={applicationId || ''}
              onChange={(e) => setApplicationId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="">General (Not tied to specific role)</option>
              {applications.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.company_name} — {a.job_title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select File (PDF, DOCX, TXT)</label>
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={uploading}>
              Upload Document
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
