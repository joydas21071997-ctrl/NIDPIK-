import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Link2,
  Plus,
  ExternalLink,
  Copy,
  Trash2,
  CheckCircle,
  Sparkles,
  MousePointerClick
} from 'lucide-react';

export const AdminAffiliateLinksPage: React.FC = () => {
  const { merchants, products } = useApp();
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Link Generator state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedMerchantId, setSelectedMerchantId] = useState('amazon');
  const [rawTargetUrl, setRawTargetUrl] = useState('');
  const [affiliateTag, setAffiliateTag] = useState('nidpik-21');
  const [generatedUrl, setGeneratedUrl] = useState('');

  const loadLinks = async () => {
    try {
      setLoading(true);
      const data = await api.affiliateLinks.getAll();
      setLinks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.warn('API links fetch note:', err);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const safeLinks = Array.isArray(links) ? links : [];

  const handleGenerate = () => {
    if (!rawTargetUrl) return;
    let url = rawTargetUrl;
    try {
      const u = new URL(url);
      if (selectedMerchantId === 'amazon') {
        u.searchParams.set('tag', affiliateTag || 'nidpik-21');
      } else if (selectedMerchantId === 'flipkart') {
        u.searchParams.set('affid', affiliateTag || 'nidpik');
      } else if (selectedMerchantId === 'meesho') {
        u.searchParams.set('utm_source', affiliateTag || 'nidpik_affiliate');
        u.searchParams.set('utm_medium', 'affiliate');
        u.searchParams.set('utm_campaign', 'nidpik');
        u.searchParams.set('ref', affiliateTag || 'nidpik');
      } else {
        u.searchParams.set('utm_source', 'nidpik');
        u.searchParams.set('utm_medium', 'affiliate');
      }
      setGeneratedUrl(u.toString());
    } catch {
      setGeneratedUrl(url + `?tag=${affiliateTag}`);
    }
  };

  const handleSaveGenerated = async () => {
    if (!generatedUrl) return;
    try {
      await api.affiliateLinks.create({
        productId: selectedProductId || undefined,
        merchantId: selectedMerchantId,
        targetUrl: generatedUrl,
        affiliateNetwork: selectedMerchantId === 'amazon'
          ? 'Amazon Associates'
          : selectedMerchantId === 'flipkart'
          ? 'Flipkart Affiliate'
          : selectedMerchantId === 'meesho'
          ? 'Meesho Affiliate / Creator'
          : 'Partner Affiliate'
      });
      setGeneratedUrl('');
      setRawTargetUrl('');
      await loadLinks();
    } catch (err: any) {
      alert(`Error saving: ${err.message}`);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <AdminLayout
      title="Affiliate Link Manager"
      subtitle="Generate tracked affiliate redirects, test landing URLs, and monitor real-time outbound clicks"
    >
      <div className="space-y-6">
        
        {/* LINK GENERATOR WIDGET */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="font-extrabold text-sm text-slate-900">Affiliate Link Generator &amp; Tag Injector</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Target Product (Optional)</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="">-- Generic Merchant Link --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Merchant Partner</label>
              <select
                value={selectedMerchantId}
                onChange={(e) => setSelectedMerchantId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                {merchants.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Affiliate Tag ID</label>
              <input
                type="text"
                value={affiliateTag}
                onChange={(e) => setAffiliateTag(e.target.value)}
                placeholder="nidpik-21"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Raw Merchant Product URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={rawTargetUrl}
                onChange={(e) => setRawTargetUrl(e.target.value)}
                placeholder={
                  selectedMerchantId === 'meesho'
                    ? 'https://www.meesho.com/s/p/abc123'
                    : selectedMerchantId === 'flipkart'
                    ? 'https://www.flipkart.com/p/...'
                    : 'https://www.amazon.in/dp/B07S92Q48M'
                }
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
              <button
                type="button"
                onClick={handleGenerate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs shrink-0"
              >
                Generate Tracked Link
              </button>
            </div>
          </div>

          {generatedUrl && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Generated Affiliate Destination URL
              </span>
              <div className="font-mono text-xs text-emerald-950 break-all p-2 bg-white rounded-lg border border-emerald-200">
                {generatedUrl}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveGenerated}
                  className="px-3.5 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-600"
                >
                  Save to Catalog Links
                </button>
                <a
                  href={generatedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 flex items-center gap-1"
                >
                  <span>Test URL</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* REGISTERED AFFILIATE DESTINATIONS TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-900">Configured Product Affiliate Feeds</h3>
            <span className="text-xs font-semibold text-slate-500">{safeLinks.length} links recorded</span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400">Loading links...</div>
          ) : safeLinks.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">No custom affiliate links recorded.</div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {safeLinks.map((link) => (
                <div key={link.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                  <div className="min-w-0 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{link.merchantId?.toUpperCase()}</span>
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">
                        {link.affiliateNetwork || 'Direct'}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-500 truncate mt-1">
                      {link.targetUrl}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-1 font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <MousePointerClick className="w-3 h-3" />
                      <span className="font-bold">{link.clicks || 0}</span>
                      <span className="text-[10px]">clicks</span>
                    </div>

                    <button
                      onClick={() => copyToClipboard(link.targetUrl, link.id)}
                      className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg"
                      title="Copy link"
                    >
                      {copiedId === link.id ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <a
                      href={link.targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg"
                      title="Test URL"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
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
