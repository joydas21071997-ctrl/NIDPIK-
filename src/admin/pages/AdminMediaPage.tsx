import React, { useEffect, useState, useRef } from 'react';
import { AdminLayout } from '../AdminLayout';
import { api } from '../../services/api';
import {
  Image as ImageIcon,
  Upload,
  Copy,
  Trash2,
  CheckCircle,
  Search,
  ExternalLink,
  Edit,
  Save,
  X
} from 'lucide-react';

export const AdminMediaPage: React.FC = () => {
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const data = await api.media.getAll(search);
      setMediaList(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [search]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploading(true);
      for (let i = 0; i < files.length; i++) {
        await api.media.upload(files[i]);
      }
      await loadMedia();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const copyUrl = (url: string, id: string) => {
    const full = url.startsWith('http') ? url : window.location.origin + url;
    navigator.clipboard.writeText(full);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this image permanently from disk?')) return;
    try {
      await api.media.delete(id);
      setMediaList(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      await api.media.update(editingItem.id, {
        altText: editingItem.altText,
        title: editingItem.title
      });
      setMediaList(prev => prev.map(m => m.id === editingItem.id ? editingItem : m));
      setEditingItem(null);
    } catch (err: any) {
      alert(`Error updating: ${err.message}`);
    }
  };

  return (
    <AdminLayout
      title="Media Asset Library"
      subtitle="Upload, optimize, and organize product photography, editorial hero graphics, and category icons"
      actions={
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Upload Media'}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        
        {/* SEARCH BAR */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search media by filename, alt text, or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">{mediaList.length} files</span>
        </div>

        {/* MEDIA GRID */}
        {loading ? (
          <div className="py-24 text-center text-xs text-slate-400">Loading media library...</div>
        ) : mediaList.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
            <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No media assets found</p>
            <p className="text-xs text-slate-500">Upload your product photos, logos, or review screenshots here.</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
            >
              Choose Files
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mediaList.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs group flex flex-col justify-between"
              >
                <div className="h-32 bg-slate-100 flex items-center justify-center p-2 relative overflow-hidden">
                  <img
                    src={m.url}
                    alt={m.altText || m.filename}
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as any).src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&q=80';
                    }}
                  />
                  {copiedId === m.id && (
                    <div className="absolute inset-0 bg-slate-900/80 text-white flex items-center justify-center text-[11px] font-bold">
                      URL Copied!
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-1">
                  <span className="text-[11px] font-bold text-slate-900 block truncate" title={m.filename}>
                    {m.filename}
                  </span>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{m.width && m.height ? `${m.width}x${m.height}` : 'Image'}</span>
                    <span>{(m.size / 1024).toFixed(0)} KB</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => copyUrl(m.url, m.id)}
                      className="p-1 text-slate-500 hover:text-blue-600"
                      title="Copy URL"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingItem({ ...m })}
                      className="p-1 text-slate-500 hover:text-blue-600"
                      title="Edit metadata"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 text-slate-400 hover:text-slate-700"
                      title="View original"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* METADATA EDIT MODAL */}
        {editingItem && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-base text-slate-900">Edit Image Metadata</h3>
                <button onClick={() => setEditingItem(null)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveMeta} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Alt Text (Accessibility &amp; SEO)</label>
                  <input
                    type="text"
                    value={editingItem.altText || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, altText: e.target.value })}
                    placeholder="Describe image for search engines..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Title Attribute</label>
                  <input
                    type="text"
                    value={editingItem.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Save Metadata
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
