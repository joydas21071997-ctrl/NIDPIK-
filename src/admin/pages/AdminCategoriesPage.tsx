import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Save,
  X,
  Star,
  Sparkles,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const AdminCategoriesPage: React.FC = () => {
  const { refreshPublicData, categories: appCategories } = useApp();
  const [categories, setCategories] = useState<any[]>(appCategories || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    iconName: 'Package',
    image: '',
    isFeatured: true,
    subcategories: ['General'] as string[],
    seoTitle: '',
    seoDescription: ''
  });

  const [newSubcat, setNewSubcat] = useState('');

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.categories.getAll();
      if (Array.isArray(data)) {
        setCategories(data);
      } else if (appCategories && appCategories.length > 0) {
        setCategories(appCategories);
      }
    } catch (err: any) {
      if (appCategories && appCategories.length > 0) {
        setCategories(appCategories);
      } else {
        setError(err.message || 'Failed to load categories');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (appCategories && appCategories.length > 0 && categories.length === 0) {
      setCategories(appCategories);
    }
  }, [appCategories]);

  const safeCategories = Array.isArray(categories) ? categories : (appCategories || []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setForm({
      name: '',
      slug: '',
      description: '',
      iconName: 'Package',
      image: '',
      isFeatured: true,
      subcategories: [],
      seoTitle: '',
      seoDescription: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      iconName: cat.iconName || 'Package',
      image: cat.image || '',
      isFeatured: Boolean(cat.isFeatured),
      subcategories: cat.subcategories || [],
      seoTitle: cat.seoTitle || '',
      seoDescription: cat.seoDescription || ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.categories.update(editingCategory.id || editingCategory.slug, form);
        setToastMsg('Category updated successfully');
      } else {
        await api.categories.create(form);
        setToastMsg('Category created successfully');
      }
      setModalOpen(false);
      await loadCategories();
      await refreshPublicData();
    } catch (err: any) {
      alert(`Error saving category: ${err.message}`);
    }
  };

  const handleDelete = async (cat: any) => {
    if (!window.confirm(`Delete category "${cat.name}"? Products inside may become uncategorized.`)) {
      return;
    }
    try {
      await api.categories.delete(cat.id || cat.slug);
      setToastMsg('Category deleted');
      await loadCategories();
      await refreshPublicData();
    } catch (err: any) {
      alert(`Error deleting: ${err.message}`);
    }
  };

  return (
    <AdminLayout
      title="Category Management"
      subtitle="Organize catalog taxonomy, browse icons, and configure category landing pages"
      actions={
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      }
    >
      <div className="space-y-4">
        
        {/* TOAST */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* CATEGORIES GRID */}
        {loading ? (
          <div className="py-24 text-center text-xs text-slate-400">Loading categories...</div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safeCategories.map((cat) => (
              <div
                key={cat.id || cat.slug}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm text-slate-900">{cat.name}</h3>
                        {cat.isFeatured && (
                          <span className="p-0.5 text-amber-500" title="Featured category">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">/category/{cat.slug}</span>
                    </div>

                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                      Icon: {cat.iconName || 'Package'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {cat.description}
                  </p>

                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {cat.subcategories.slice(0, 4).map((sub: string, i: number) => (
                        <span key={i} className="text-[10px] bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded">
                          {sub}
                        </span>
                      ))}
                      {cat.subcategories.length > 4 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{cat.subcategories.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                  <a
                    href={`/category/${cat.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>View Public</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                      title="Edit Category"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-base text-slate-900">
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm({
                        ...form,
                        name,
                        slug: form.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                      });
                    }}
                    placeholder="e.g. Home & Kitchen"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
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
                      placeholder="home-kitchen"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Lucide Icon Name</label>
                    <input
                      type="text"
                      value={form.iconName}
                      onChange={(e) => setForm({ ...form, iconName: e.target.value })}
                      placeholder="CookingPot, Smartphone, Sparkles..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description for category landing page and SEO..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Banner Image URL</label>
                  <input
                    type="url"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                {/* SUBCATEGORIES CHIPS */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Subcategories</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newSubcat}
                      onChange={(e) => setNewSubcat(e.target.value)}
                      placeholder="Add subcategory (e.g. Earphones)..."
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newSubcat.trim()) {
                          setForm({ ...form, subcategories: [...form.subcategories, newSubcat.trim()] });
                          setNewSubcat('');
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {form.subcategories.map((sub, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">
                        <span>{sub}</span>
                        <button
                          type="button"
                          onClick={() => setForm({
                            ...form,
                            subcategories: form.subcategories.filter((_, idx) => idx !== i)
                          })}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <label htmlFor="isFeatured" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Show as Featured in Navbar &amp; Homepage Pills
                  </label>
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
                    Save Category
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
