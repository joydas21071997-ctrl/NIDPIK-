import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle,
  Eye
} from 'lucide-react';

export const AdminArticlesPage: React.FC = () => {
  const { navigate, refreshPublicData } = useApp();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await api.articles.getAll();
      setArticles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete article "${title}"?`)) return;
    try {
      await api.articles.delete(id);
      setArticles(prev => prev.filter(a => a.id !== id));
      refreshPublicData();
    } catch (err: any) {
      alert(`Error deleting: ${err.message}`);
    }
  };

  const filtered = articles.filter(a =>
    !search ||
    a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout
      title="Editorial Articles"
      subtitle="Publish long-form buying advice, problem analysis, and lifestyle guides"
      actions={
        <button
          onClick={() => navigate('/admin/articles/new')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Article</span>
        </button>
      }
    >
      <div className="space-y-4">
        
        {/* SEARCH */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search articles by title or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {filtered.length} articles
          </span>
        </div>

        {/* ARTICLES LIST */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="py-24 text-center text-xs text-slate-400">Loading articles...</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No articles found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((art) => (
                <div
                  key={art.id}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-16 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                      {art.coverImage ? (
                        <img src={art.coverImage} alt={art.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 hover:text-blue-600 cursor-pointer truncate" onClick={() => navigate(`/admin/articles/${art.id}`)}>
                          {art.title}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          art.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {art.status || 'PUBLISHED'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span className="font-semibold text-slate-700">{art.category || 'General'}</span>
                        <span>•</span>
                        <span>{art.readTime || '4 min read'}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">/{art.slug}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => navigate(`/admin/articles/${art.id}`)}
                      className="p-1.5 hover:bg-blue-50 hover:text-blue-600 text-slate-500 rounded-lg transition-colors"
                      title="Edit article"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <a
                      href={`/articles/${art.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                      title="Live preview"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDelete(art.id, art.title)}
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

      </div>
    </AdminLayout>
  );
};
