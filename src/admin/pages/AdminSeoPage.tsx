import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { api } from '../../services/api';
import {
  Globe,
  Save,
  CheckCircle,
  ExternalLink,
  Code2,
  FileCode,
  Sparkles
} from 'lucide-react';

export const AdminSeoPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    defaultTitle: 'NIDPIK | Find, Compare & Pick Right',
    defaultDescription: 'India-focused product discovery, buying guides, comparisons, and smart budget picks starting from ₹99. Find the right product for your actual need.',
    defaultOgImage: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1200&q=80',
    titleSeparator: '|',
    twitterHandle: '@nidpik_in',
    googleSiteVerification: 'google-site-verification-token-nidpik'
  });

  useEffect(() => {
    setLoading(true);
    api.settings.get()
      .then((res) => {
        setSettings(res || {});
        if (res && res.seo) {
          setForm(prev => ({ ...prev, ...res.seo }));
        }
      })
      .catch((err) => {
        console.warn('API settings fetch note:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.settings.update('seo', form);
      setToastMsg('SEO configuration saved');
    } catch (err: any) {
      alert(`Error saving: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Search Engine Optimization (SEO)"
      subtitle="Configure global OpenGraph cards, title syntax, canonical domains, sitemaps, and robots directives"
      actions={
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      }
    >
      <form onSubmit={handleSave} className="space-y-6">
        
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* CORE METADATA */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Default Global Metadata</h3>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Default Site Title</label>
            <input
              type="text"
              required
              value={form.defaultTitle}
              onChange={(e) => setForm({ ...form, defaultTitle: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Global Meta Description</label>
            <textarea
              rows={3}
              required
              value={form.defaultDescription}
              onChange={(e) => setForm({ ...form, defaultDescription: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Default Social OG Image</label>
              <input
                type="url"
                value={form.defaultOgImage}
                onChange={(e) => setForm({ ...form, defaultOgImage: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Google Site Verification Token</label>
              <input
                type="text"
                value={form.googleSiteVerification}
                onChange={(e) => setForm({ ...form, googleSiteVerification: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* SEARCH BOT ROBOTS & SITEMAP */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Search Engine Directives</h3>
              <p className="text-xs text-slate-500">Auto-generated XML sitemaps and indexing crawlers configuration</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800">XML Sitemap</span>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                >
                  <span>Open Feed</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-500">
                Dynamically crawls all published products, categories, guides, comparisons, reviews, and budget pages with clean priority scores.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800">Robots.txt Directives</span>
                <a
                  href="/robots.txt"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                >
                  <span>Open File</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-500">
                Explicitly disallows <code className="bg-slate-200 px-1 rounded text-[11px]">/admin/</code> and internal query parameters, while allowing full crawler access to editorial content.
              </p>
            </div>
          </div>
        </div>

        {/* SERP PREVIEW BOX */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900">Search Engine Result Simulator</h3>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-xs text-emerald-800 font-mono">https://nidpik.in</span>
            <div className="text-base font-bold text-blue-700 hover:underline cursor-pointer">
              {form.defaultTitle}
            </div>
            <div className="text-xs text-slate-600 leading-relaxed">
              {form.defaultDescription}
            </div>
          </div>
        </div>

      </form>
    </AdminLayout>
  );
};
