import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { api } from '../../services/api';
import { db } from '../../firebase/config';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import {
  Mail,
  Download,
  Trash2,
  CheckCircle,
  Clock,
  Search,
  Users,
  Database
} from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  source: string;
  status: string;
  createdAt: string;
}

export const AdminSubscribersPage: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [active, setActive] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchSubscribers = async () => {
    setLoading(true);
    const combinedMap = new Map<string, Subscriber>();

    // 1. Fetch from backend API
    try {
      const data = await api.subscribers.getAll();
      for (const s of data.subscribers || []) {
        combinedMap.set(s.email.toLowerCase(), s);
      }
    } catch (err) {
      console.warn('Backend subscribers fetch note:', err);
    }

    // 2. Fetch directly from Firestore (for Firebase Hosting / real-time synchronization)
    try {
      const snapshot = await getDocs(collection(db, 'newsletter_subscribers'));
      snapshot.forEach((d) => {
        const item = d.data();
        if (item.email) {
          const emailLower = String(item.email).toLowerCase();
          if (!combinedMap.has(emailLower)) {
            combinedMap.set(emailLower, {
              id: d.id,
              email: item.email,
              source: item.source || 'firestore',
              status: item.status || 'active',
              createdAt: item.createdAt || new Date().toISOString()
            });
          }
        }
      });
    } catch (err) {
      console.warn('Firestore subscribers fetch note:', err);
    }

    // 3. Fallback to localStorage cache
    try {
      const cached = JSON.parse(localStorage.getItem('nidpik_subscribers') || '[]');
      for (const c of cached) {
        if (c.email) {
          const emailLower = String(c.email).toLowerCase();
          if (!combinedMap.has(emailLower)) {
            combinedMap.set(emailLower, {
              id: 'cache_' + Math.random().toString(36).slice(2, 7),
              email: c.email,
              source: c.source || 'client_cache',
              status: 'active',
              createdAt: c.date || new Date().toISOString()
            });
          }
        }
      }
    } catch {
      // ignore
    }

    const list = Array.from(combinedMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setSubscribers(list);
    setTotal(list.length);
    setActive(list.filter((s) => s.status === 'active').length);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleDelete = async (id: string, email: string) => {
    if (!window.confirm(`Are you sure you want to remove ${email}?`)) return;
    try {
      await api.subscribers.delete(id).catch(() => {});
      try {
        await deleteDoc(doc(db, 'newsletter_subscribers', id));
      } catch {
        // ignore
      }
      setToastMsg(`Removed ${email}`);
      setTimeout(() => setToastMsg(null), 3000);
      fetchSubscribers();
    } catch (err: any) {
      alert(err.message || 'Failed to remove subscriber');
    }
  };

  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      alert('No subscribers to export.');
      return;
    }
    const headers = ['Email', 'Source', 'Status', 'Subscribed At'];
    const rows = subscribers.map((s) => [
      `"${s.email}"`,
      `"${s.source}"`,
      `"${s.status}"`,
      `"${s.createdAt}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nidpik-subscribers-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = subscribers.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.source.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Subscribers" subtitle="Manage and export email newsletter subscribers">
      <div className="space-y-6 text-left">
        {/* Toast */}
        {toastMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Mail className="w-6 h-6 text-blue-600" />
              Newsletter Subscribers
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Readers who subscribed to weekly product picks and budget recommendations.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Subscribers</span>
              <span className="text-xl font-black text-slate-900">{total}</span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Audience</span>
              <span className="text-xl font-black text-emerald-600">{active}</span>
            </div>
          </div>
        </div>

        {/* Filter Search */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Search subscriber email or source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading subscriber list...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Mail className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">No subscribers found</p>
              <p className="text-[11px] text-slate-400">
                When readers enter their email on the homepage or footer, they will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold text-[11px]">
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Subscribed At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filtered.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{sub.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono">
                          {sub.source}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] font-mono">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(sub.id, sub.email)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete subscriber"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
