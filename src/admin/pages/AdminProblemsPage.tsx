import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Zap,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Save,
  X,
  CheckCircle,
  Eye
} from 'lucide-react';

export const AdminProblemsPage: React.FC = () => {
  const { refreshPublicData, products } = useApp();
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<any | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    tagline: '',
    problemStatement: '',
    iconName: 'Zap',
    featuredProductIds: [] as string[],
    seoTitle: '',
    seoDescription: ''
  });

  const loadProblems = async () => {
    try {
      setLoading(true);
      const data = await api.problems.getAll();
      setProblems(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProblems();
  }, []);

  const openCreateModal = () => {
    setEditingProblem(null);
    setForm({
      title: '',
      slug: '',
      tagline: '',
      problemStatement: '',
      iconName: 'Zap',
      featuredProductIds: [products[0]?.id || '', products[1]?.id || ''],
      seoTitle: '',
      seoDescription: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingProblem(p);
    setForm({
      title: p.title || '',
      slug: p.slug || '',
      tagline: p.tagline || '',
      problemStatement: p.problemStatement || '',
      iconName: p.iconName || 'Zap',
      featuredProductIds: p.featuredProductIds || [],
      seoTitle: p.seoTitle || '',
      seoDescription: p.seoDescription || ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProblem) {
        await api.problems.update(editingProblem.id || editingProblem.slug, form);
        setToastMsg('Problem solver updated');
      } else {
        await api.problems.create(form);
        setToastMsg('Problem solver created');
      }
      setModalOpen(false);
      await loadProblems();
      await refreshPublicData();
    } catch (err: any) {
      alert(`Error saving: ${err.message}`);
    }
  };

  const handleDelete = async (p: any) => {
    if (!window.confirm(`Delete problem collection "${p.title}"?`)) return;
    try {
      await api.problems.delete(p.id || p.slug);
      setToastMsg('Problem collection deleted');
      await loadProblems();
      await refreshPublicData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <AdminLayout
      title="Problem-Based Discovery"
      subtitle="Curate targeted lifestyle solutions for everyday Indian household and productivity bottlenecks"
      actions={
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Problem Collection</span>
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
            <div className="py-24 text-center text-xs text-slate-400">Loading problem collections...</div>
          ) : problems.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <Zap className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No problem collections found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {problems.map((p) => (
                <div key={p.id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-900 block truncate">{p.title}</span>
                    <span className="text-xs text-slate-600 block line-clamp-1 mt-0.5">{p.tagline}</span>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                      <span>/problems/{p.slug}</span>
                      <span>•</span>
                      <span>{p.featuredProductIds?.length || 0} recommended picks</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <a
                      href={`/problems/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                      title="Live view"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDelete(p)}
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
                  {editingProblem ? 'Edit Problem Collection' : 'Create Problem Collection'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Collection Title *</label>
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
                    placeholder="e.g. Useful Products for Small Kitchens"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Slug *</label>
                    <input
                      type="text"
                      required
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      placeholder="useful-products-for-small-kitchens"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Tagline</label>
                    <input
                      type="text"
                      value={form.tagline}
                      onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                      placeholder="e.g. Maximize tiny counter space"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Problem Statement</label>
                  <textarea
                    rows={3}
                    value={form.problemStatement}
                    onChange={(e) => setForm({ ...form, problemStatement: e.target.value })}
                    placeholder="Describe the exact frustration or space limitation this collection addresses..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Recommend Products</label>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1.5 bg-slate-50">
                    {products.map(p => {
                      const isSel = form.featuredProductIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setForm({
                              ...form,
                              featuredProductIds: isSel
                                ? form.featuredProductIds.filter(id => id !== p.id)
                                : [...form.featuredProductIds, p.id]
                            });
                          }}
                          className={`p-2 rounded-lg cursor-pointer text-xs flex items-center justify-between transition-colors ${
                            isSel ? 'bg-blue-600 text-white font-bold' : 'bg-white hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          <span className="truncate">{p.name}</span>
                          <span className="font-mono shrink-0 ml-2">₹{p.price}</span>
                        </div>
                      );
                    })}
                  </div>
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
                    Save Collection
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
