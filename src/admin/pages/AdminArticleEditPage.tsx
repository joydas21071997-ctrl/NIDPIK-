import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Save,
  ArrowLeft,
  ExternalLink,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Eye,
  Plus,
  Trash2
} from 'lucide-react';

interface Props {
  articleId?: string;
}

export const AdminArticleEditPage: React.FC<Props> = ({ articleId }) => {
  const { navigate, refreshPublicData, products, authors, categories } = useApp();
  const isNew = !articleId || articleId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'metadata' | 'embeds' | 'preview'>('content');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    category: 'Guides',
    authorId: 'rahul-mehta',
    readTime: '5 min read',
    tags: ['buying-advice', 'india'] as string[],
    status: 'PUBLISHED' as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    relatedProductIds: [] as string[],
    seoTitle: '',
    seoDescription: '',
    canonicalUrl: '',
    ogImage: ''
  });

  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (!isNew && articleId) {
      setLoading(true);
      api.articles.getOne(articleId)
        .then((art) => {
          if (art) {
            setFormData({
              title: art.title || '',
              slug: art.slug || '',
              excerpt: art.excerpt || '',
              content: art.content || '',
              coverImage: art.coverImage || '',
              category: art.category || 'Guides',
              authorId: art.authorId || art.author?.id || 'rahul-mehta',
              readTime: art.readTime || '5 min read',
              tags: art.tags || [],
              status: art.status || 'PUBLISHED',
              relatedProductIds: art.relatedProductIds || [],
              seoTitle: art.seoTitle || '',
              seoDescription: art.seoDescription || '',
              canonicalUrl: art.canonicalUrl || '',
              ogImage: art.ogImage || ''
            });
          }
        })
        .catch((err) => {
          setError(err.message || 'Article not found');
        })
        .finally(() => setLoading(false));
    }
  }, [articleId, isNew]);

  const generateSlug = () => {
    if (!formData.title) return;
    const s = formData.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setFormData(prev => ({ ...prev, slug: s }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const selectedAuthor = authors.find(a => a.id === formData.authorId) || authors[0];
      const payload = {
        ...formData,
        author: selectedAuthor,
        publishedAt: new Date().toISOString().split('T')[0]
      };

      let res;
      if (isNew) {
        res = await api.articles.create(payload);
        setSuccessMsg('Article published successfully!');
      } else {
        res = await api.articles.update(articleId!, payload);
        setSuccessMsg('Article saved successfully!');
      }

      await refreshPublicData();

      if (isNew && res && res.id) {
        setTimeout(() => navigate(`/admin/articles/${res.id}`), 800);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Loading Article..." subtitle="Please wait">
        <div className="py-24 text-center text-xs text-slate-400">Loading editor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={isNew ? 'Create New Article' : `Edit: ${formData.title}`}
      subtitle={isNew ? 'Draft an in-depth editorial article' : `Slug: /articles/${formData.slug}`}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/articles')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          {!isNew && (
            <a
              href={`/articles/${formData.slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Article'}</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* MESSAGES */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TABS */}
        <div className="flex items-center gap-1 border-b border-slate-200 pb-px">
          {[
            { id: 'content', label: 'Article Content' },
            { id: 'metadata', label: 'Author & Metadata' },
            { id: 'embeds', label: 'Embedded Products' },
            { id: 'preview', label: 'Live Preview' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors ${
                activeTab === tab.id
                  ? 'bg-white border-t border-x border-slate-200 text-blue-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: CONTENT */}
        {activeTab === 'content' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Article Headline *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. 5 Hidden Electricity Wasters in Indian Homes (And How to Fix Them)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">URL Slug *</label>
                  <button
                    type="button"
                    onClick={generateSlug}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Auto from title
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="5-hidden-electricity-wasters"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Cover Image URL *</label>
                <input
                  type="url"
                  required
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Summary / Excerpt (Lead Paragraph)</label>
              <textarea
                rows={2}
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="A compelling 2-sentence summary hook..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Article Body Content (Markdown supported)</label>
                <span className="text-[10px] text-slate-400 font-mono">Use ## for headers, **bold**, and lists</span>
              </div>
              <textarea
                rows={16}
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write or paste your article content here in Markdown format..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono leading-relaxed focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* TAB 2: METADATA */}
        {activeTab === 'metadata' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  <option value="Guides">Guides</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Home & Kitchen">Home & Kitchen</option>
                  <option value="Lifehacks">Lifehacks</option>
                  <option value="Smart Shopping">Smart Shopping</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Author *</label>
                <select
                  value={formData.authorId}
                  onChange={(e) => setFormData({ ...formData, authorId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Read Time</label>
                <input
                  type="text"
                  value={formData.readTime}
                  onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                  placeholder="e.g. 6 min read"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            {/* TAGS */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a topic tag..."
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newTag.trim()) {
                      setFormData({ ...formData, tags: [...formData.tags, newTag.trim().toLowerCase()] });
                      setNewTag('');
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-bold"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {formData.tags.map((t, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== idx) })}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Publication Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full sm:w-64 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                <option value="PUBLISHED">PUBLISHED (Live)</option>
                <option value="DRAFT">DRAFT (Unpublished)</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>

            {/* SEO */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Search Engine Optimization</h4>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">SEO Title</label>
                <input
                  type="text"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                  placeholder={`${formData.title || 'Article'} | NIDPIK`}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Meta Description</label>
                <textarea
                  rows={2}
                  value={formData.seoDescription}
                  onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                  placeholder="Short compelling description for Google search snippet..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: EMBEDS */}
        {activeTab === 'embeds' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Embed Products in Article</h3>
              <p className="text-xs text-slate-500">
                Select products from your catalog that are referenced in this article. Readers can buy them directly from the affiliate links.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {products.map((p) => {
                const isSelected = formData.relatedProductIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setFormData({
                        ...formData,
                        relatedProductIds: isSelected
                          ? formData.relatedProductIds.filter(id => id !== p.id)
                          : [...formData.relatedProductIds, p.id]
                      });
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'bg-blue-50/60 border-blue-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-1">
                      <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1 text-xs">
                      <span className="font-bold text-slate-900 block truncate">{p.name}</span>
                      <span className="text-[11px] font-mono text-slate-500">₹{p.price?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: PREVIEW */}
        {activeTab === 'preview' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-6 max-w-3xl mx-auto">
            <div className="space-y-3">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{formData.category}</span>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">{formData.title || 'Article Title'}</h1>
              <p className="text-sm text-slate-600 italic">{formData.excerpt}</p>
            </div>
            {formData.coverImage && (
              <div className="w-full h-64 rounded-2xl overflow-hidden bg-slate-100">
                <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="prose text-xs text-slate-700 whitespace-pre-line leading-relaxed font-sans border-t border-slate-100 pt-6">
              {formData.content || 'Article content will appear here...'}
            </div>
          </div>
        )}

      </form>
    </AdminLayout>
  );
};
