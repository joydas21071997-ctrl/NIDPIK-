import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Save,
  X,
  CheckCircle,
  Eye,
  Layers,
  Sparkles
} from 'lucide-react';

export const AdminGuidesPage: React.FC = () => {
  const { refreshPublicData, products, authors, buyingGuides: appGuides } = useApp();
  const [guides, setGuides] = useState<any[]>(appGuides || []);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<any | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    category: 'Electronics',
    categorySlug: 'electronics',
    coverImage: '',
    readTime: '8 min read',
    status: 'PUBLISHED' as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    topPickId: '',
    budgetPickId: '',
    runnerUpId: '',
    seoTitle: '',
    seoDescription: ''
  });

  const loadGuides = async () => {
    try {
      setLoading(true);
      const data = await api.guides.getAll();
      if (Array.isArray(data)) {
        setGuides(data);
      } else if (appGuides && appGuides.length > 0) {
        setGuides(appGuides);
      }
    } catch (err: any) {
      if (appGuides && appGuides.length > 0) {
        setGuides(appGuides);
      } else {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuides();
  }, []);

  useEffect(() => {
    if (appGuides && appGuides.length > 0 && guides.length === 0) {
      setGuides(appGuides);
    }
  }, [appGuides]);

  const safeGuides = Array.isArray(guides) ? guides : (appGuides || []);

  const openCreateModal = () => {
    setEditingGuide(null);
    setForm({
      title: '',
      slug: '',
      description: '',
      category: 'Electronics',
      categorySlug: 'electronics',
      coverImage: '',
      readTime: '8 min read',
      status: 'PUBLISHED',
      topPickId: products[0]?.id || '',
      budgetPickId: products[1]?.id || '',
      runnerUpId: products[2]?.id || '',
      seoTitle: '',
      seoDescription: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (g: any) => {
    setEditingGuide(g);
    setForm({
      title: g.title || '',
      slug: g.slug || '',
      description: g.description || '',
      category: g.category || 'Electronics',
      categorySlug: g.categorySlug || 'electronics',
      coverImage: g.coverImage || '',
      readTime: g.readTime || '8 min read',
      status: g.status || 'PUBLISHED',
      topPickId: g.topPickId || g.picks?.[0]?.productId || '',
      budgetPickId: g.budgetPickId || g.picks?.[1]?.productId || '',
      runnerUpId: g.runnerUpId || g.picks?.[2]?.productId || '',
      seoTitle: g.seoTitle || '',
      seoDescription: g.seoDescription || ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const picks = [
        form.topPickId ? { badge: 'Best Overall', productId: form.topPickId, reason: 'Unmatched performance in this budget tier.' } : null,
        form.budgetPickId ? { badge: 'Best Budget', productId: form.budgetPickId, reason: 'Superb balance of price and durability.' } : null,
        form.runnerUpId ? { badge: 'Runner Up', productId: form.runnerUpId, reason: 'Great alternative with extra features.' } : null
      ].filter(Boolean);

      const payload = {
        ...form,
        picks,
        lastUpdated: new Date().toISOString().split('T')[0]
      };

      if (editingGuide) {
        await api.guides.update(editingGuide.id || editingGuide.slug, payload);
        setToastMsg('Guide updated successfully');
      } else {
        await api.guides.create(payload);
        setToastMsg('Guide created successfully');
      }
      setModalOpen(false);
      await loadGuides();
      await refreshPublicData();
    } catch (err: any) {
      alert(`Error saving guide: ${err.message}`);
    }
  };

  const handleDelete = async (g: any) => {
    if (!window.confirm(`Delete buying guide "${g.title}"?`)) return;
    try {
      await api.guides.delete(g.id || g.slug);
      setToastMsg('Guide deleted');
      await loadGuides();
      await refreshPublicData();
    } catch (err: any) {
      alert(`Error deleting: ${err.message}`);
    }
  };

  return (
    <AdminLayout
      title="Buying Guides"
      subtitle="Curate comprehensive buying playbooks with Best Overall, Budget, and Runner-Up picks"
      actions={
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Buying Guide</span>
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
            <div className="py-24 text-center text-xs text-slate-400">Loading guides...</div>
          ) : safeGuides.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No buying guides found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {safeGuides.map((g) => (
                <div key={g.id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 truncate">{g.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {g.status || 'PUBLISHED'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span className="font-semibold text-slate-700">{g.category}</span>
                      <span>•</span>
                      <span>{g.readTime || '6 min read'}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-400">/buying-guides/{g.slug}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditModal(g)}
                      className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <a
                      href={`/buying-guides/${g.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                      title="Live view"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDelete(g)}
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
                  {editingGuide ? 'Edit Buying Guide' : 'Create Buying Guide'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Guide Title *</label>
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
                    placeholder="e.g. Best Wireless Earbuds Under ₹2,000 in India"
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
                      placeholder="best-wireless-earbuds-under-2000"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                    <input
                      type="text"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="Electronics, Home, Fitness..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Description / Introduction</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Executive summary of our testing criteria and top recommendations..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Designated Product Picks</h4>
                  
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Top Overall Pick</label>
                    <select
                      value={form.topPickId}
                      onChange={(e) => setForm({ ...form, topPickId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="">-- None Selected --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Best Budget Pick</label>
                    <select
                      value={form.budgetPickId}
                      onChange={(e) => setForm({ ...form, budgetPickId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="">-- None Selected --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Runner-Up Pick</label>
                    <select
                      value={form.runnerUpId}
                      onChange={(e) => setForm({ ...form, runnerUpId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="">-- None Selected --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                      ))}
                    </select>
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
                    Save Guide
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
