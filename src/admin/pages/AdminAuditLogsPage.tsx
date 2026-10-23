import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { api } from '../../services/api';
import {
  ClipboardList,
  Search,
  Clock,
  ShieldCheck,
  User,
  Filter
} from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.auditLogs.getAll();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.warn('API audit logs fetch note:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const safeLogs = Array.isArray(logs) ? logs : [];

  const filtered = safeLogs.filter((l) => {
    if (!l) return false;
    if (!search) return true;
    const term = search.toLowerCase();
    const user = (l.userEmail || l.user_name || l.userName || '').toLowerCase();
    const action = (l.action || '').toLowerCase();
    const entityType = (l.entityType || l.entity_type || '').toLowerCase();
    const entityId = (l.entityId || l.entity_id || '').toLowerCase();
    return user.includes(term) || action.includes(term) || entityType.includes(term) || entityId.includes(term);
  });

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Recent';
    try {
      const d = new Date(isoString);
      return isNaN(d.getTime()) ? 'Recent' : d.toLocaleString();
    } catch {
      return 'Recent';
    }
  };

  return (
    <AdminLayout
      title="Platform Audit Trail"
      subtitle="Immutable event logging of administrative logins, content edits, and system changes"
    >
      <div className="space-y-4">
        
        {/* SEARCH */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by user, action, entity ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">{filtered.length} log records</span>
        </div>

        {/* LOGS TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="py-24 text-center text-xs text-slate-400">Loading audit records...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">No audit events found.</div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Timestamp</th>
                  <th className="py-3 px-5">Administrator</th>
                  <th className="py-3 px-5">Action</th>
                  <th className="py-3 px-5">Entity</th>
                  <th className="py-3 px-5">IP / Client</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 font-mono">
                    <td className="py-3 px-5 text-[11px] text-slate-500">
                      {formatDate(l.createdAt || l.created_at)}
                    </td>
                    <td className="py-3 px-5 font-bold text-slate-900 font-sans">
                      {l.userEmail || l.user_name || l.userName || 'System'}
                    </td>
                    <td className="py-3 px-5 font-sans">
                      <span className="font-semibold text-slate-800">{l.action}</span>
                    </td>
                    <td className="py-3 px-5 text-[11px] text-slate-600">
                      <span className="uppercase text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold mr-1.5 font-sans">
                        {l.entityType || l.entity_type || 'SYSTEM'}
                      </span>
                      {l.entityId || l.entity_id || '—'}
                    </td>
                    <td className="py-3 px-5 text-[11px] text-slate-400">
                      {l.ip_address || l.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </AdminLayout>
  );
};
