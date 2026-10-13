import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Star,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Save,
  X,
  CheckCircle,
  Eye
} from 'lucide-react';

export const AdminReviewsPage: React.FC = () => {
  const { refreshPublicData, products, authors } = useApp();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    productId: '',
    rating: 4.5,
    summary: '',
    verdict: '',
    body: '',
    authorId: 'rahul-mehta',
    status: 'PUBLISHED' as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    seoTitle: '',
    seoDescription: ''
  });

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await api.reviews.getAll();
      setReviews(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const openCreateModal = () => {
    setEditingReview(null);
    setForm({
      title: '',
      slug: '',
      productId: products[0]?.id || '',
      rating: 4.5,
      summary: '',
      verdict: '',
      body: '',
      authorId: authors[0]?.id || 'rahul-mehta',
      status: 'PUBLISHED',
      seoTitle: '',
      seoDescription: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (r: any) => {
    setEditingReview(r);
    setForm({
      title: r.title || '',
      slug: r.slug || '',
      productId: r.productId || r.product?.id || '',
      rating: r.rating || 4.5,
      summary: r.summary || '',
      verdict: r.verdict || '',
      body: r.body || r.content || '',
      authorId: r.authorId || r.author?.id || authors[0]?.id || 'rahul-mehta',
      status: r.status || 'PUBLISHED',
      seoTitle: r.seoTitle || '',
      seoDescription: r.seoDescription || ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const prod = products.find(p => p.id === form.productId) || products[0];
      const author = authors.find(a => a.id === form.authorId) || authors[0];

      const payload = {
        ...form,
        product: prod,
        author: author,
        coverImage: prod?.image || '',
        publishedAt: new Date().toISOString().split('T')[0]
      };

      if (editingReview) {
        await api.reviews.update(editingReview.id || editingReview.slug, payload);
        setToastMsg('Review updated');
      } else {
        await api.reviews.create(payload);
        setToastMsg('Review created');
      }
      setModalOpen(false);
      await loadReviews();
      await refreshPublicData();
    } catch (err: any) {
      alert(`Error saving review: ${err.message}`);
    }
  };

  const handleDelete = async (r: any) => {
    if (!window.confirm(`Delete review "${r.title}"?`)) return;
    try {
      await api.reviews.delete(r.id || r.slug);
      setToastMsg('Review deleted');
      await loadReviews();
      await refreshPublicData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <AdminLayout
      title="In-Depth Reviews"
      subtitle="Editorial testing verdicts, hands-on ratings, and honest buy/pass recommendations"
      actions={
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Review</span>
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
            <div className="py-24 text-center text-xs text-slate-400">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <Star className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No reviews found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {reviews.map((r) => (
                <div key={r.id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 truncate">{r.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        ★ {r.rating || 4.5}/5
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span className="font-mono text-slate-400">/reviews/{r.slug}</span>
                      <span>•</span>
                      <span className="text-slate-600 truncate max-w-sm">{r.verdict || r.summary}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditModal(r)}
                      className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <a
                      href={`/reviews/${r.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                      title="Live view"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDelete(r)}
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
                  {editingReview ? 'Edit Review' : 'Create Review'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Target Product *</label>
                  <select
                    value={form.productId}
                    onChange={(e) => {
                      const pid = e.target.value;
                      const prod = products.find(p => p.id === pid);
                      setForm({
                        ...form,
                        productId: pid,
                        title: form.title || `${prod?.name || 'Product'} In-Depth Review`,
                        slug: form.slug || `${prod?.slug || 'product'}-review`
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Review Headline *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. boAt Airdopes 141 In-Depth Review: 42 Hours of Bass for ₹1,299"
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
                      placeholder="boat-airdopes-141-review"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Rating (out of 5)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={form.rating}
                      onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Summary / Lead</label>
                  <textarea
                    rows={2}
                    value={form.summary}
                    onChange={(e) => setForm({ ...form, summary: e.target.value })}
                    placeholder="Quick executive takeaway for buyers..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Review Text (Markdown)</label>
                  <textarea
                    rows={8}
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    placeholder="In-depth analysis of battery life, build quality, sound signature, real world ergonomics..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Final Verdict</label>
                  <input
                    type="text"
                    value={form.verdict}
                    onChange={(e) => setForm({ ...form, verdict: e.target.value })}
                    placeholder="Should you buy it? Absolutely yes for bass lovers."
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
                    Save Review
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
