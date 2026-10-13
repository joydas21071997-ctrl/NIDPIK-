import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Package,
  Layers,
  FileText,
  BookOpen,
  Scale,
  Star,
  Zap,
  Store,
  MousePointerClick,
  TrendingUp,
  Plus,
  ExternalLink,
  Clock,
  CheckCircle,
  FileEdit,
  Archive,
  ArrowUpRight,
  ShieldCheck,
  Search
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { navigate, refreshPublicData } = useApp();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await api.analytics.getSummary();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const statCards = [
    {
      title: 'Total Products',
      value: summary?.products?.total ?? 0,
      sub: `${summary?.products?.published ?? 0} published • ${summary?.products?.draft ?? 0} drafts`,
      icon: Package,
      color: 'bg-blue-500/10 text-blue-600 border-blue-200',
      action: () => navigate('/admin/products')
    },
    {
      title: 'Affiliate Clicks',
      value: summary?.counts?.clicks ?? 0,
      sub: 'Real tracked merchant outbound clicks',
      icon: MousePointerClick,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
      action: () => navigate('/admin/analytics')
    },
    {
      title: 'Buying Guides',
      value: summary?.counts?.guides ?? 0,
      sub: 'Comprehensive buying playbooks',
      icon: BookOpen,
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
      action: () => navigate('/admin/guides')
    },
    {
      title: 'Editorial Articles',
      value: summary?.counts?.articles ?? 0,
      sub: 'Guides, tips, and insights',
      icon: FileText,
      color: 'bg-amber-500/10 text-amber-600 border-amber-200',
      action: () => navigate('/admin/articles')
    },
    {
      title: 'Head-to-Head Comparisons',
      value: summary?.counts?.comparisons ?? 0,
      sub: 'Feature & spec breakdowns',
      icon: Scale,
      color: 'bg-purple-500/10 text-purple-600 border-purple-200',
      action: () => navigate('/admin/comparisons')
    },
    {
      title: 'In-Depth Reviews',
      value: summary?.counts?.reviews ?? 0,
      sub: 'Hands-on ratings and verdicts',
      icon: Star,
      color: 'bg-rose-500/10 text-rose-600 border-rose-200',
      action: () => navigate('/admin/reviews')
    },
    {
      title: 'Problem Solvers',
      value: summary?.counts?.problems ?? 0,
      sub: 'Problem-first lifestyle picks',
      icon: Zap,
      color: 'bg-cyan-500/10 text-cyan-600 border-cyan-200',
      action: () => navigate('/admin/problems')
    },
    {
      title: 'Active Merchants',
      value: summary?.counts?.merchants ?? 0,
      sub: 'Amazon, Flipkart, Croma, etc.',
      icon: Store,
      color: 'bg-orange-500/10 text-orange-600 border-orange-200',
      action: () => navigate('/admin/merchants')
    }
  ];

  return (
    <AdminLayout
      title="Platform Overview"
      subtitle="Monitor catalog health, content pipeline, and affiliate performance"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/products/new')}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Product</span>
          </button>
          <button
            onClick={() => navigate('/admin/articles/new')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Article</span>
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* STATS TILES GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                onClick={card.action}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl border ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <div>
                  <span className="text-2xl font-black text-slate-900 tracking-tight block">
                    {loading ? '—' : card.value}
                  </span>
                  <span className="text-xs font-bold text-slate-700 block mt-0.5">
                    {card.title}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    {card.sub}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* TWO-COLUMN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* RECENTLY UPDATED PRODUCTS (2 COLS) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Recently Updated Products</h2>
              </div>
              <button
                onClick={() => navigate('/admin/products')}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                View Catalog →
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading catalog...</div>
            ) : !summary?.recentProducts || summary.recentProducts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No products found.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {summary.recentProducts.map((p: any) => (
                  <div
                    key={p.id}
                    className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/60 px-2 rounded-xl transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {p.name}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          p.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'DRAFT'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span className="font-semibold text-slate-700">{p.brand}</span>
                        <span>•</span>
                        <span>{p.category}</span>
                        <span>•</span>
                        <span className="font-mono font-bold text-slate-900">₹{p.price?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => navigate(`/admin/products/${p.id}`)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded-lg text-xs font-semibold"
                        title="Edit product"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={`/product/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg"
                        title="Preview on live site"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TOP PERFORMING AFFILIATE PICKS & QUICK AUDIT */}
          <div className="space-y-6">
            
            {/* AFFILIATE CLICKS */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-900">Top Outbound Clicks</h2>
                </div>
                <button
                  onClick={() => navigate('/admin/analytics')}
                  className="text-xs font-bold text-emerald-600 hover:underline"
                >
                  All Stats →
                </button>
              </div>

              {!summary?.popularClicked || summary.popularClicked.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No clicks recorded yet. As visitors discover products, click events will populate here.
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.popularClicked.map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-800 block truncate">
                          {c.name || `Product #${c.product_id}`}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          ₹{c.price?.toLocaleString('en-IN') || '—'}
                        </span>
                      </div>
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-mono font-bold text-xs shrink-0">
                        {c.clicks} clicks
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AUDIT ACTIVITY MINI-FEED */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-700" />
                  <h2 className="text-sm font-bold text-slate-900">Recent Admin Activity</h2>
                </div>
                <button
                  onClick={() => navigate('/admin/audit-logs')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Full Log →
                </button>
              </div>

              {!summary?.recentAudits || summary.recentAudits.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No audit logs recorded yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {summary.recentAudits.slice(0, 5).map((log: any) => (
                    <div key={log.id} className="text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-800 truncate">
                          {log.user_name || 'System'}: <span className="font-normal text-slate-600">{log.action}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
