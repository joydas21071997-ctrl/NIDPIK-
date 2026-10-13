import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Tag,
  Edit,
  ExternalLink,
  Save,
  CheckCircle,
  X
} from 'lucide-react';

export const AdminBudgetsPage: React.FC = () => {
  const { refreshPublicData } = useApp();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTier, setEditingTier] = useState<any | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    headline: '',
    description: '',
    seoTitle: '',
    seoDescription: ''
  });

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const data = await api.budgets.getAll();
      setBudgets(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const openEdit = (tier: any) => {
    setEditingTier(tier);
    setForm({
      title: tier.title || '',
      slug: tier.slug || '',
      headline: tier.headline || '',
      description: tier.description || '',
      seoTitle: tier.seoTitle || '',
      seoDescription: tier.seoDescription || ''
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTier) return;
    try {
      await api.budgets.update(editingTier.amount, form);
      setToastMsg(`Budget tier ₹${editingTier.amount} updated`);
      setEditingTier(null);
      await loadBudgets();
      await refreshPublicData();
    } catch (err: any) {
      alert(`Error updating budget tier: ${err.message}`);
    }
  };

  return (
    <AdminLayout
      title="Budget Tiers"
      subtitle="Configure minimum ₹99 entry price points and progressive price discovery tiers"
    >
      <div className="space-y-4">
        
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="py-24 text-center text-xs text-slate-400">Loading budget tiers...</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {budgets.map((b) => (
                <div key={b.amount} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-black font-mono text-sm shrink-0">
                      ₹{b.amount}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{b.title}</span>
                        <span className="font-mono text-[10px] text-slate-400">/{b.slug}</span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{b.headline}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(b)}
                      className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <a
                      href={`/${b.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                      title="View public tier"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* EDIT MODAL */}
        {editingTier && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-base text-slate-900">
                  Edit Budget Tier: Under ₹{editingTier.amount}
                </h3>
                <button onClick={() => setEditingTier(null)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Headline</label>
                  <input
                    type="text"
                    required
                    value={form.headline}
                    onChange={(e) => setForm({ ...form, headline: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingTier(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
