import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Scale,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Save,
  X,
  CheckCircle,
  Eye,
  Check
} from 'lucide-react';

export const AdminComparisonsPage: React.FC = () => {
  const { refreshPublicData, products, comparisons: appComparisons } = useApp();
  const [comparisons, setComparisons] = useState<any[]>(appComparisons || []);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<any | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    introduction: '',
    product1Id: '',
    product2Id: '',
    winnerId: '',
    verdict: '',
    status: 'PUBLISHED' as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    seoTitle: '',
    seoDescription: ''
  });

  const loadComparisons = async () => {
    try {
      setLoading(true);
      const data = await api.comparisons.getAll();
      if (Array.isArray(data)) {
        setComparisons(data);
      } else if (appComparisons && appComparisons.length > 0) {
        setComparisons(appComparisons);
      }
    } catch (err: any) {
      if (appComparisons && appComparisons.length > 0) {
        setComparisons(appComparisons);
      } else {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComparisons();
  }, []);

  useEffect(() => {
    if (appComparisons && appComparisons.length > 0 && comparisons.length === 0) {
      setComparisons(appComparisons);
    }
  }, [appComparisons]);

  const safeComparisons = Array.isArray(comparisons) ? comparisons : (appComparisons || []);

  const openCreateModal = () => {
    setEditingComp(null);
    setForm({
      title: '',
      slug: '',
      introduction: '',
      product1Id: products[0]?.id || '',
      product2Id: products[1]?.id || '',
      winnerId: products[0]?.id || '',
      verdict: '',
      status: 'PUBLISHED',
      seoTitle: '',
      seoDescription: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (c: any) => {
    setEditingComp(c);
    setForm({
      title: c.title || '',
      slug: c.slug || '',
      introduction: c.introduction || '',
      product1Id: c.product1Id || c.product1?.id || '',
      product2Id: c.product2Id || c.product2?.id || '',
      winnerId: c.winnerId || c.product1Id || '',
      verdict: c.verdict || '',
      status: c.status || 'PUBLISHED',
      seoTitle: c.seoTitle || '',
      seoDescription: c.seoDescription || ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const p1 = products.find(p => p.id === form.product1Id) || products[0];
      const p2 = products.find(p => p.id === form.product2Id) || products[1];

      const payload = {
        ...form,
        product1: p1,
        product2: p2,
        lastUpdated: new Date().toISOString().split('T')[0]
      };

      if (editingComp) {
        await api.comparisons.update(editingComp.id || editingComp.slug, payload);
        setToastMsg('Comparison updated successfully');
      } else {
        await api.comparisons.create(payload);
        setToastMsg('Comparison created successfully');
      }
      setModalOpen(false);
      await loadComparisons();
      await refreshPublicData();
    } catch (err: any) {
      alert(`Error saving comparison: ${err.message}`);
    }
  };

  const handleDelete = async (c: any) => {
    if (!window.confirm(`Delete comparison "${c.title}"?`)) return;
    try {
      await api.comparisons.delete(c.id || c.slug);
      setToastMsg('Comparison deleted');
      await loadComparisons();
      await refreshPublicData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <AdminLayout
      title="Head-to-Head Comparisons"
      subtitle="Publish detailed side-by-side product showdowns with verdicts and feature matrices"
      actions={
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Comparison</span>
        </button>
      }
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
            <div className="py-24 text-center text-xs text-slate-400">Loading comparisons...</div>
          ) : safeComparisons.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <Scale className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No comparisons found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {safeComparisons.map((c) => (
                <div key={c.id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-900 block truncate">{c.title}</span>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span className="font-mono text-slate-400">/compare/{c.slug}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold">Verdict: {c.verdict ? c.verdict.slice(0, 40) + '...' : 'Available'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <a
                      href={`/compare/${c.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                      title="Live view"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDelete(c)}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-base text-slate-900">
                  {editingComp ? 'Edit Comparison' : 'Create Comparison'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Comparison Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setForm({
                        ...form,
                        title,
                        slug: form.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                      });
                    }}
                    placeholder="e.g. boAt Airdopes 141 vs OnePlus Nord Buds 2r"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Slug *</label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="boat-airdopes-141-vs-oneplus-nord-buds-2r"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Product #1 *</label>
                    <select
                      value={form.product1Id}
                      onChange={(e) => setForm({ ...form, product1Id: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Product #2 *</label>
                    <select
                      value={form.product2Id}
                      onChange={(e) => setForm({ ...form, product2Id: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Introduction</label>
                  <textarea
                    rows={2}
                    value={form.introduction}
                    onChange={(e) => setForm({ ...form, introduction: e.target.value })}
                    placeholder="Context for comparing these two contenders..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Final Verdict (Who Should Pick Which)</label>
                  <textarea
                    rows={3}
                    value={form.verdict}
                    onChange={(e) => setForm({ ...form, verdict: e.target.value })}
                    placeholder="Pick Product #1 if you care about battery; pick Product #2 if you need cleaner microphones..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Save Comparison
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
