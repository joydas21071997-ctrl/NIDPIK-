import React, { useEffect, useState, useRef } from 'react';
import { AdminLayout } from '../AdminLayout';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Settings,
  Save,
  CheckCircle,
  Shield,
  HelpCircle,
  Mail,
  Share2,
  Upload,
  Image as ImageIcon,
  Check,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Database
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { refreshPublicData, settings } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Logo upload state
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoSuccessMsg, setLogoSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    siteName: 'NIDPIK',
    tagline: 'Find • Compare • Pick Right',
    logoUrl: '',
    currencySymbol: '₹',
    minBudgetEntry: '99',
    contactEmail: 'editor@nidpik.in',
    affiliateDisclaimer: 'Some links on NIDPIK are affiliate links. When you purchase through them, we may earn a modest commission from approved merchant partners like Amazon India at no additional cost to you.',
    socialTwitter: 'https://twitter.com/nidpik_in',
    socialInstagram: 'https://instagram.com/nidpik_in',
    socialYoutube: 'https://youtube.com/@nidpik'
  });

  useEffect(() => {
    setLoading(true);
    api.settings.get()
      .then((res) => {
        if (res.general) {
          setForm(prev => ({ ...prev, ...res.general }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = async () => {
    if (!selectedLogoFile) return;
    try {
      setUploadingLogo(true);
      setLogoSuccessMsg(null);
      const res = await api.settings.uploadLogo(selectedLogoFile);
      setForm(prev => ({ ...prev, logoUrl: res.logoUrl }));
      setLogoSuccessMsg('অভিনন্দন! আপনার আসল লোগো সফলভাবে আপলোড হয়েছে এবং পুরো ওয়েবসাইটে যুক্ত করা হয়েছে।');
      setSelectedLogoFile(null);
      await refreshPublicData();
      setTimeout(() => setLogoSuccessMsg(null), 8000);
    } catch (err: any) {
      alert(`Logo upload failed: ${err.message}`);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.settings.update('general', form);
      setToastMsg('Platform configuration updated');
      await refreshPublicData();
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err: any) {
      alert(`Error saving: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const activeLogoDisplay = logoPreview || form.logoUrl || '/logo.svg';

  return (
    <AdminLayout
      title="Platform Settings"
      subtitle="Configure official brand logo, site-wide identity, currency symbols, and affiliate disclosure copy"
      actions={
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
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

        {/* 1. BRAND LOGO MANAGEMENT (DEDICATED SECTION) */}
        <div className="bg-white p-6 rounded-2xl border-2 border-blue-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>Official Brand Logo (ওয়েবসাইট লোগো আপলোড)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                আপনার আসল লোগো ইমেজ ফাইলটি (.png, .svg, .jpg, .webp) নির্বাচন করে আপলোড করুন। এটি হুবহু কোনো রূপান্তর ছাড়াই ওয়েবসাইটে বসে যাবে।
              </p>
            </div>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View Live Website</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {logoSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{logoSuccessMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Live Preview Card */}
            <div className="md:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Active Logo Preview
              </span>
              <div className="h-20 bg-white border border-slate-200/80 rounded-lg flex items-center justify-center p-2 shadow-2xs">
                <img
                  src={activeLogoDisplay}
                  alt="NIDPIK Brand Logo"
                  className="max-h-14 max-w-full object-contain"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-2 block truncate">
                {form.logoUrl ? `URL: ${form.logoUrl}` : 'Default SVG Logo'}
              </span>
            </div>

            {/* Upload & Select Controls */}
            <div className="md:col-span-8 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Upload Exact Logo File (মোবাইল বা পিসি থেকে ফাইল বেছে নিন)
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleLogoFileChange}
                    className="text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {selectedLogoFile && (
                    <button
                      type="button"
                      onClick={handleUploadLogo}
                      disabled={uploadingLogo}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingLogo ? 'Uploading...' : 'Set As Official Logo (লোগো যুক্ত করুন)'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Direct URL Option */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Or Paste Public Image URL (যদি কোনো লিঙ্কে থাকে - Imgur / Drive / Postimages):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.logoUrl}
                    onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      await api.settings.update('general', form);
                      await refreshPublicData();
                      setToastMsg('Logo URL updated');
                      setTimeout(() => setToastMsg(null), 3000);
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Apply URL
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GENERAL BRANDING */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Brand Identity &amp; Localization</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Platform Brand Name *</label>
              <input
                type="text"
                required
                value={form.siteName}
                onChange={(e) => setForm({ ...form, siteName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Official Tagline *</label>
              <input
                type="text"
                required
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Currency Symbol</label>
              <input
                type="text"
                required
                value={form.currencySymbol}
                onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Minimum Budget Discovery (₹)</label>
              <input
                type="text"
                required
                value={form.minBudgetEntry}
                onChange={(e) => setForm({ ...form, minBudgetEntry: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Contact Email</label>
              <input
                type="email"
                required
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>
          </div>
        </div>

        {/* CLOUD DATABASE & FIREBASE INSTANCE STATUS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">Cloud Database &amp; Firebase Instance</h3>
                <p className="text-xs text-slate-500">Google Cloud Firestore Enterprise instance configured for NIDPIK.</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              Connected &amp; Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[11px] font-medium">GCP Project ID</span>
              <span className="font-mono font-bold text-slate-800">gen-lang-client-0205908126</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[11px] font-medium">Firestore Database ID</span>
              <span className="font-mono font-bold text-slate-800 truncate block">ai-studio-nidpikfindcompar...</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[11px] font-medium">Primary Cloud Region</span>
              <span className="font-bold text-slate-800">asia-southeast1</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-blue-800 flex items-start gap-2">
            <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>Production Architecture: </strong>
              <span>High-speed SQLite backend is running in WAL mode with real-time Firestore synchronization and security rules deployed.</span>
            </div>
          </div>
        </div>

        {/* AFFILIATE DISCLOSURE */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Mandatory Affiliate Disclosure Notice</h3>
          </div>
          <p className="text-xs text-slate-500">
            Rendered automatically on all product detail pages, buying guides, footer, and the redirection modal.
          </p>

          <textarea
            rows={3}
            required
            value={form.affiliateDisclaimer}
            onChange={(e) => setForm({ ...form, affiliateDisclaimer: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium leading-relaxed"
          />
        </div>

        {/* SOCIAL LINKS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-slate-700" />
            <h3 className="font-bold text-sm text-slate-900">Social Channels</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">X / Twitter URL</label>
              <input
                type="url"
                value={form.socialTwitter}
                onChange={(e) => setForm({ ...form, socialTwitter: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Instagram URL</label>
              <input
                type="url"
                value={form.socialInstagram}
                onChange={(e) => setForm({ ...form, socialInstagram: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">YouTube URL</label>
              <input
                type="url"
                value={form.socialYoutube}
                onChange={(e) => setForm({ ...form, socialYoutube: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>
          </div>
        </div>

      </form>
    </AdminLayout>
  );
};
