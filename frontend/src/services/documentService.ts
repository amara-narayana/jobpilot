import { api } from './api';
import { DocumentItem, DocumentType, ApiResponse } from '@/types';

export const documentService = {
  async getDocuments(application_id?: number): Promise<ApiResponse<DocumentItem[]>> {
    const endpoint = application_id ? `/documents?application_id=${application_id}` : '/documents';
    return api.get(endpoint);
  },

  async uploadDocument(file: File, document_type: DocumentType, application_id?: number): Promise<ApiResponse<DocumentItem>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', document_type);
    if (application_id) {
      formData.append('application_id', application_id.toString());
    }
    return api.post('/documents/upload', formData);
  },

  async deleteDocument(id: number): Promise<ApiResponse<void>> {
    return api.delete(`/documents/${id}`);
  },

  getDownloadUrl(id: number): string {
    return `/api/v1/documents/${id}/download`;
  },
};
