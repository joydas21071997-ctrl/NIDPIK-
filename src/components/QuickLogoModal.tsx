import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Upload,
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';

interface QuickLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickLogoModal: React.FC<QuickLogoModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateLogoState, refreshPublicData } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentLogo = settings?.general?.logoUrl || '/logo.svg';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setErrorMessage(null);
      setSuccessMessage(null);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyFile = async () => {
    if (!selectedFile) {
      setErrorMessage('দয়া করে প্রথমে একটি ইমেজ ফাইল সিলেক্ট করুন।');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await api.public.updateLogo(formData);
      if (res?.logoUrl) {
        updateLogoState(res.logoUrl);
        await refreshPublicData();
        setSuccessMessage('আপনার লোগো সফলভাবে পুরো ওয়েবসাইটে সেট করা হয়েছে!');
        setSelectedFile(null);
        setPreviewUrl(null);
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'লোগো আপডেট করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyUrl = async () => {
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setErrorMessage('দয়া করে একটি সঠিক ইমেজ লিঙ্ক (URL) দিন।');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const res = await api.public.updateLogo({ logoUrl: trimmed });
      if (res?.logoUrl) {
        updateLogoState(res.logoUrl);
        await refreshPublicData();
        setSuccessMessage('লিঙ্ক থেকে লোগো সফলভাবে সেট করা হয়েছে!');
        setInputUrl('');
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'লিঙ্ক থেকে লোগো আপডেট করা সম্ভব হয়নি।');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDefault = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await api.public.updateLogo({ resetDefault: true });
      if (res?.logoUrl) {
        updateLogoState(res.logoUrl);
        await refreshPublicData();
        setSuccessMessage('ডিফল্ট লোগো পুনরুদ্ধার করা হয়েছে।');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage('ডিফল্ট লোগো রিস্টোর করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">লোগো পরিবর্তন করুন</h3>
              <p className="text-xs text-blue-100">Quick Brand Logo Uploader (১-ক্লিক আপডেট)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status Messages */}
          {successMessage && (
            <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium animate-in fade-in">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm font-medium animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Current Logo Preview */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>বর্তমানে ওয়েবসাইটে সক্রিয় লোগো:</span>
              <span className="text-[11px] text-blue-600 font-mono font-normal truncate max-w-[150px]">
                {currentLogo}
              </span>
            </div>
            <div className="h-14 bg-white rounded-lg border border-slate-200/80 flex items-center justify-center p-2 overflow-hidden shadow-2xs">
              <img
                src={currentLogo}
                alt="Active Logo"
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.svg';
                }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => {
                setActiveTab('upload');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                activeTab === 'upload'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload className="w-4 h-4" />
              ফাইল আপলোড করুন (ছবি)
            </button>
            <button
              onClick={() => {
                setActiveTab('url');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                activeTab === 'url'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              ইমেজ লিঙ্ক (URL) পেস্ট করুন
            </button>
          </div>

          {/* Tab 1: Upload File */}
          {activeTab === 'upload' && (
            <div className="space-y-3 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  selectedFile
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50'
                }`}
              >
                {previewUrl ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-600">সিলেক্ট করা ইমেজ প্রিভিউ:</p>
                    <div className="h-16 bg-white rounded-lg border border-blue-200 flex items-center justify-center p-2 shadow-2xs">
                      <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                    <p className="text-xs text-blue-700 font-medium truncate">{selectedFile?.name}</p>
                    <p className="text-[11px] text-slate-500">অন্য ছবি নিতে ক্লিক করুন</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        এখানে ক্লিক করে আপনার লোগো ফাইলটি সিলেক্ট করুন
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        সাপোর্টেড ফরম্যাট: PNG, JPG, SVG, WebP (সর্বোচ্চ ২৫ MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                disabled={!selectedFile || loading}
                onClick={handleApplyFile}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-sm transition-all ${
                  !selectedFile || loading
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-98'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    আপলোড ও সেভ হচ্ছে...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    এই ছবিটি লোগো হিসেবে সেভ করুন
                  </>
                )}
              </button>
            </div>
          )}

          {/* Tab 2: Image URL */}
          {activeTab === 'url' && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ইমেজ লিঙ্ক / URL (Direct Image Link):
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Imgur, Google Drive, বা যেকোনো ওয়েবসাইটের ছবির ডিরেক্ট লিঙ্ক এখানে পেস্ট করতে পারেন।
                </p>
              </div>

              {inputUrl && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">লিঙ্ক প্রিভিউ:</span>
                  <div className="h-14 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-1">
                    <img
                      src={inputUrl}
                      alt="URL Preview"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).alt = 'ইমেজ লোড করা যায়নি';
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                disabled={!inputUrl.trim() || loading}
                onClick={handleApplyUrl}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-sm transition-all ${
                  !inputUrl.trim() || loading
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-98'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    সেভ হচ্ছে...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    লিঙ্ক থেকে লোগো সেট করুন
                  </>
                )}
              </button>
            </div>
          )}

          {/* Reset button */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={handleResetDefault}
              disabled={loading}
              className="text-slate-500 hover:text-slate-800 underline font-medium transition-colors"
            >
              ডিফল্ট লোগোতে রিসেট করুন
            </button>
            <span className="text-slate-400">NIDPIK Official Brand</span>
          </div>
        </div>
      </div>
    </div>
  );
};
