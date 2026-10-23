import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { api } from '../../services/api';
import {
  BarChart3,
  MousePointerClick,
  TrendingUp,
  Store,
  ExternalLink,
  Calendar,
  Clock,
  Package
} from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.analytics.getClicks()
      .then((res) => {
        if (res && typeof res === 'object') {
          setData(res);
        } else {
          setData({ totalClicks: 0, recentClicks: [], topProducts: [], byMerchant: [] });
        }
      })
      .catch((err) => {
        console.warn('API analytics fetch note:', err);
        setData({ totalClicks: 0, recentClicks: [], topProducts: [], byMerchant: [] });
      })
      .finally(() => setLoading(false));
  }, []);

  const safeData = data || {
    totalClicks: 0,
    recentClicks: [],
    topProducts: [],
    byMerchant: []
  };

  const topProducts = Array.isArray(safeData.topProducts) ? safeData.topProducts : [];
  const byMerchant = Array.isArray(safeData.byMerchant)
    ? safeData.byMerchant
    : (Array.isArray(safeData.topMerchants) ? safeData.topMerchants : []);
  const recentClicks = Array.isArray(safeData.recentClicks) ? safeData.recentClicks : [];

  const maxClicks = Math.max(
    1,
    Number(topProducts[0]?.clicks || topProducts[0]?.click_count || 1)
  );

  const topMerchantLabel = byMerchant[0]?.merchant_id
    ? String(byMerchant[0].merchant_id).toUpperCase()
    : (byMerchant[0]?.name || 'Amazon India');

  const formatClickTime = (raw?: string) => {
    if (!raw) return 'Recent';
    try {
      const d = new Date(raw);
      return isNaN(d.getTime()) ? 'Recent' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <AdminLayout
      title="Outbound Affiliate &amp; Click Analytics"
      subtitle="Real-time telemetry on reader discovery, merchant outbound clicks, and conversion intent"
    >
      <div className="space-y-6">
        
        {/* TOP STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Outbound Clicks</span>
              <MousePointerClick className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono">
              {loading ? '—' : safeData?.totalClicks || 0}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Live redirect beacon events</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Products Clicked</span>
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono">
              {loading ? '—' : topProducts.length}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Catalog items generating interest</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top Merchant Destination</span>
              <Store className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 truncate">
              {loading ? '—' : topMerchantLabel}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Highest volume of conversions</span>
          </div>
        </div>

        {/* TWO COLUMN BREAKDOWN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* TOP CLICKED PRODUCTS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Most Clicked Products</h3>
              </div>
              <span className="text-xs font-bold text-slate-400">Total Clicks</span>
            </div>

            {topProducts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No click telemetry recorded yet. Clicks will track live as users test affiliate CTAs.
              </div>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p: any, i: number) => {
                  const clickCount = Number(p.clicks ?? p.click_count ?? 0);
                  const name = p.name || p.product_name || `Product #${p.productId || p.product_id || i + 1}`;
                  return (
                    <div key={i} className="flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-800 block truncate">{name}</span>
                        <span className="text-[11px] font-mono text-slate-400">₹{p.price?.toLocaleString('en-IN') || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, (clickCount / maxClicks) * 100)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-emerald-700 w-10 text-right">{clickCount}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* MERCHANT DISTRIBUTION */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Outbound Volume by Merchant</h3>
              </div>
              <span className="text-xs font-bold text-slate-400">Share</span>
            </div>

            {byMerchant.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No merchant clicks recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {byMerchant.map((m: any, i: number) => (
                  <div key={i} className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-bold text-slate-800 uppercase">{m.merchant_id || m.name || 'Direct'}</span>
                    <span className="font-mono font-bold text-blue-600">{m.count || m.clicks || 0} clicks</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RECENT OUTBOUND LOG */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-900">Recent Outbound Click Stream</h3>
            <span className="text-xs font-semibold text-slate-500">Last {recentClicks.length} events</span>
          </div>

          {recentClicks.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">No recent clicks recorded.</div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Product</th>
                  <th className="py-2.5 px-4">Merchant</th>
                  <th className="py-2.5 px-4">Source Page</th>
                  <th className="py-2.5 px-4">CTA Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentClicks.map((c: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">
                      {formatClickTime(c.created_at || c.createdAt)}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-800 truncate max-w-xs">
                      {c.product_name || c.name || c.product_id || c.productId}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-700 uppercase text-[11px]">
                      {c.merchant_id || c.merchantId || 'DIRECT'}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 truncate max-w-[200px]">
                      {c.source_page || c.sourcePage || '/'}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                        {c.cta_type || c.ctaType || 'check_price'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </AdminLayout>
  );
};
