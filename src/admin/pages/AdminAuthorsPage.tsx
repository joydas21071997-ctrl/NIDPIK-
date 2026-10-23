import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  UserCheck,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  CheckCircle
} from 'lucide-react';

export const AdminAuthorsPage: React.FC = () => {
  const { refreshPublicData, authors: appAuthors } = useApp();
  const [authors, setAuthors] = useState<any[]>(Array.isArray(appAuthors) ? appAuthors : []);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<any | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    id: '',
    name: '',
    role: 'Senior Tech & Lifestyle Editor',
    avatar: '',
    bio: ''
  });

  const loadAuthors = async () => {
    try {
      setLoading(true);
      const data = await api.authors.getAll();
      if (Array.isArray(data)) {
        setAuthors(data);
      } else if (Array.isArray(appAuthors) && appAuthors.length > 0) {
        setAuthors(appAuthors);
      }
    } catch (err: any) {
      console.warn('API authors fetch note:', err);
      if (Array.isArray(appAuthors) && appAuthors.length > 0) {
        setAuthors(appAuthors);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuthors();
  }, []);

  const safeAuthors = Array.isArray(authors) && authors.length > 0
    ? authors
    : (Array.isArray(appAuthors) ? appAuthors : []);

  const openCreate = () => {
    setEditingAuthor(null);
    setForm({
      id: '',
      name: '',
      role: 'Product Reviewer & Research Analyst',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
      bio: ''
    });
    setModalOpen(true);
  };

  const openEdit = (a: any) => {
    setEditingAuthor(a);
    setForm({
      id: a.id || '',
      name: a.name || '',
      role: a.role || '',
      avatar: a.avatar || '',
      bio: a.bio || ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        id: form.id || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      };
      if (editingAuthor) {
        await api.authors.update(editingAuthor.id, payload);
        setToastMsg('Author updated');
      } else {
        await api.authors.create(payload);
        setToastMsg('Author added');
      }
      setModalOpen(false);
      await loadAuthors();
      await refreshPublicData();
    } catch (err: any) {
      alert(`Error saving author: ${err.message}`);
    }
  };

  const handleDelete = async (a: any) => {
    if (!window.confirm(`Delete author "${a.name}"?`)) return;
    try {
      await api.authors.delete(a.id);
      setToastMsg('Author removed');
      await loadAuthors();
      await refreshPublicData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <AdminLayout
      title="Editorial Team &amp; Authors"
      subtitle="Manage bylines, author credentials, bios, and reviewer avatars"
      actions={
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Author</span>
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

        {loading && safeAuthors.length === 0 ? (
          <div className="py-24 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            Loading authors...
          </div>
        ) : safeAuthors.length === 0 ? (
          <div className="py-20 text-center space-y-2 bg-white rounded-2xl border border-slate-200">
            <UserCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No authors found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safeAuthors.map((a) => (
              <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                      <img
                        src={a.avatar}
                        alt={a.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as any).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm text-slate-900 truncate">{a.name}</h3>
                      <span className="text-[11px] font-semibold text-blue-600 block truncate">{a.role}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3">
                    {a.bio || 'Independent researcher verifying real world specs and budget utility in India.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="font-mono text-[10px] text-slate-400">ID: {a.id}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(a)}
                      className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(a)}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
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

        {/* MODAL */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-base text-slate-900">
                  {editingAuthor ? 'Edit Author' : 'Add Author'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Author Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm({
                        ...form,
                        name,
                        id: form.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                      });
                    }}
                    placeholder="e.g. Rahul Mehta"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Designation / Role *</label>
                  <input
                    type="text"
                    required
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder="Lead Hardware Analyst"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Avatar Image URL</label>
                  <input
                    type="url"
                    value={form.avatar}
                    onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Author Bio</label>
                  <textarea
                    rows={3}
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Editorial background, areas of testing expertise..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Save Author
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
