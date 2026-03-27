// src/components/claims/DocumentsVault.tsx
// Drop-in Documents tab for ClaimsRecoveryPage and any other claims page
// Props: practiceId (string) — pass your tenant/practice identifier

import { useEffect, useState, useCallback } from 'react';
import { FileText, Download, Trash2, Search, Filter, RefreshCw, FolderOpen } from 'lucide-react';

interface ClaimsDocument {
  documentId: string;
  patientName: string;
  patientDob: string | null;
  memberId: string | null;
  cdtCode: string;
  clinicName: string | null;
  providerName: string | null;
  denialCode: string | null;
  narrativeSummary: string | null;
  blobUrl: string;
  fileSizeBytes: number | null;
  createdBy: string | null;
  createdAt: string;
}

interface DocumentsVaultProps {
  practiceId?: string;
}

const API_BASE = 'https://api.uishealth.com';

export default function DocumentsVault({ practiceId = 'default' }: DocumentsVaultProps) {
  const [documents, setDocuments] = useState<ClaimsDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deletingAll, setDeletingAll] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterCdt, setFilterCdt] = useState('');
  const [filterClinic, setFilterClinic] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ practiceId, limit: '100', offset: '0' });
      if (filterCdt)    params.set('cdtCode',    filterCdt);
      if (filterClinic) params.set('clinicName', filterClinic);
      if (filterFrom)   params.set('from',       filterFrom);
      if (filterTo)     params.set('to',         filterTo);

      const res = await fetch(`${API_BASE}/api/claims/documents?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDocuments(data.documents || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError('Could not load documents. Make sure the API is reachable.');
    } finally {
      setLoading(false);
    }
  }, [practiceId, filterCdt, filterClinic, filterFrom, filterTo]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleDelete = async (documentId: string) => {
    if (!confirm('Delete this document? This cannot be undone.')) return;
    setDeleting(documentId);
    try {
      await fetch(`${API_BASE}/api/claims/documents/${documentId}`, { method: 'DELETE' });
      setDocuments(prev => prev.filter(d => d.documentId !== documentId));
      setTotal(prev => prev - 1);
    } catch {
      alert('Delete failed. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (doc: ClaimsDocument) => {
    try {
      const res = await fetch(`${API_BASE}/api/claims/documents/${doc.documentId}/download`);
      if (!res.ok) throw new Error('Failed to get download URL');
      const { url } = await res.json();
      window.open(url, '_blank');
    } catch (err) {
      alert('Download failed. Please try again.');
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(filtered.map(d => d.documentId)));
  const clearSelection = () => setSelected(new Set());

  const deleteSelected = async () => {
    if (!selected.size) return;
    if (!confirm(`Delete ${selected.size} selected document${selected.size > 1 ? 's' : ''}? This cannot be undone.`)) return;
    setDeletingAll(true);
    for (const id of Array.from(selected)) {
      try {
        await fetch(`https://api.uishealth.com/api/claims/documents/${id}`, { method: 'DELETE' });
        setDocuments(prev => prev.filter(d => d.documentId !== id));
        setTotal(prev => prev - 1);
      } catch { /* continue */ }
    }
    setSelected(new Set());
    setDeletingAll(false);
  };

  const deleteAll = async () => {
    if (!confirm(`Delete all ${filtered.length} documents? This cannot be undone.`)) return;
    setDeletingAll(true);
    for (const doc of filtered) {
      try {
        await fetch(`https://api.uishealth.com/api/claims/documents/${doc.documentId}`, { method: 'DELETE' });
      } catch { /* continue */ }
    }
    setDocuments([]);
    setTotal(0);
    setSelected(new Set());
    setDeletingAll(false);
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return '—';
    return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
  };

  // Client-side search filter
  const filtered = documents.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.patientName.toLowerCase().includes(q) ||
      d.cdtCode.toLowerCase().includes(q) ||
      (d.clinicName || '').toLowerCase().includes(q) ||
      (d.memberId || '').toLowerCase().includes(q) ||
      (d.denialCode || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-teal-400" />
            Documents Vault
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} saved narrative{total !== 1 ? 's' : ''} — accessible anytime
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button onClick={deleteSelected} disabled={deletingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors disabled:opacity-50">
              🗑 Delete Selected ({selected.size})
            </button>
          )}
          {filtered.length > 0 && (
            <button onClick={deleteAll} disabled={deletingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors disabled:opacity-50">
              🗑 Delete All
            </button>
          )}
          <button onClick={fetchDocuments}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div className="col-span-2 md:col-span-2 relative">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search patient, CDT code, clinic..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-muted-foreground focus:outline-none focus:border-teal-500"
          />
        </div>

        <select
          value={filterCdt}
          onChange={e => setFilterCdt(e.target.value)}
          className="py-2 px-3 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-teal-500"
        >
          <option value="">All CDT Codes</option>
          {['D9222', 'D9223', 'D9230', 'D9239', 'D9243', 'D9248', 'D7140', 'D7210', 'D2750', 'D2930', 'D2931', 'D2932'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <input
          type="date"
          value={filterFrom}
          onChange={e => setFilterFrom(e.target.value)}
          className="py-2 px-3 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-teal-500"
          title="From date"
        />
        <input
          type="date"
          value={filterTo}
          onChange={e => setFilterTo(e.target.value)}
          className="py-2 px-3 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-teal-500"
          title="To date"
        />
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          Loading documents...
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={fetchDocuments} className="mt-3 text-sm text-teal-400 hover:underline">
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <FileText className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">No documents found</p>
          <p className="text-xs mt-1">
            {search || filterCdt || filterFrom
              ? 'Try adjusting your filters'
              : 'Saved narratives will appear here after you click Save & Store on a claim'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 w-8">
                  <input type="checkbox"
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={e => e.target.checked ? selectAll() : clearSelection()}
                    className="rounded border-white/20 bg-white/5"
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Patient</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">CDT Code</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Clinic</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Denial</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Saved</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Size</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((doc) => (
                <tr key={doc.documentId} className="hover:bg-white/5 transition-colors group">
                  <td className="px-4 py-3"><input type="checkbox" checked={selected.has(doc.documentId)} onChange={() => toggleSelect(doc.documentId)} className="rounded border-white/20 bg-white/5" /></td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{doc.patientName}</div>
                    {doc.memberId && (
                      <div className="text-xs text-muted-foreground mt-0.5">ID: {doc.memberId}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      {doc.cdtCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {doc.clinicName || '—'}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {doc.denialCode ? (
                      <span className="text-xs text-amber-400 font-mono">{doc.denialCode}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                    {doc.createdAt}
                    {doc.createdBy && (
                      <div className="text-xs opacity-60 mt-0.5">by {doc.createdBy}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                    {formatBytes(doc.fileSizeBytes)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-1.5 rounded-lg hover:bg-teal-500/10 text-muted-foreground hover:text-teal-400 transition-colors"
                        title="Open & download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.documentId)}
                        disabled={deleting === doc.documentId}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-40"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
