import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Store,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

export const AdminMerchantsPage: React.FC = () => {
  const { refreshPublicData } = useApp();
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<any | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    id: '',
    name: '',
    logoText: '',
    badgeColor: '#FF9900',
    affiliateBaseUrl: ''
  });

  const loadMerchants = async () => {
    try {
      setLoading(true);
      const data = await api.merchants.getAll();
      setMerchants(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMerchants();
  }, []);

  const openCreate = () => {
    setEditingMerchant(null);
    setForm({
      id: '',
      name: '',
      logoText: '',
      badgeColor: '#FF9900',
      affiliateBaseUrl: ''
    });
    setModalOpen(true);
  };

  const openEdit = (m: any) => {
    setEditingMerchant(m);
    setForm({
      id: m.id || '',
      name: m.name || '',
      logoText: m.logoText || '',
      badgeColor: m.badgeColor || '#FF9900',
      affiliateBaseUrl: m.affiliateBaseUrl || ''
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
      if (editingMerchant) {
        await api.merchants.update(editingMerchant.id, payload);
        setToastMsg('Merchant updated');
      } else {
        await api.merchants.create(payload);
        setToastMsg('Merchant added');
      }
      setModalOpen(false);
      await loadMerchants();
      await refreshPublicData();
    } catch (err: any) {
      alert(`Error saving merchant: ${err.message}`);
    }
  };

  const handleDelete = async (m: any) => {
    if (!window.confirm(`Delete merchant "${m.name}"?`)) return;
    try {
      await api.merchants.delete(m.id);
      setToastMsg('Merchant deleted');
      await loadMerchants();
      await refreshPublicData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <AdminLayout
      title="Merchant Partners"
      subtitle="Configure approved e-commerce stores, affiliate base URLs, and merchant badge styling"
      actions={
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Merchant</span>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {merchants.map((m) => (
            <div key={m.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: m.badgeColor || '#2563EB' }}
                    />
                    <h3 className="font-extrabold text-sm text-slate-900">{m.name}</h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {m.id}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Display:</span> {m.logoText || m.name}
                </div>
                {m.affiliateBaseUrl && (
                  <div className="text-[11px] font-mono text-slate-400 truncate mt-1">
                    {m.affiliateBaseUrl}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => openEdit(m)}
                  className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(m)}
                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* MODAL */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-base text-slate-900">
                  {editingMerchant ? 'Edit Merchant' : 'Add Merchant'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Quick Presets */}
                {!editingMerchant && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Quick Templates (এক ক্লিকে প্রিসেট সেট করুন)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setForm({
                          id: 'meesho',
                          name: 'Meesho',
                          logoText: 'Meesho',
                          badgeColor: '#84226b',
                          affiliateBaseUrl: 'https://www.meesho.com/'
                        })}
                        className="px-2.5 py-1 text-[11px] font-bold bg-[#84226b]/10 text-[#84226b] border border-[#84226b]/30 rounded-lg hover:bg-[#84226b] hover:text-white transition-colors"
                      >
                        + Meesho (মিশো)
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({
                          id: 'amazon',
                          name: 'Amazon India',
                          logoText: 'Amazon',
                          badgeColor: '#FF9900',
                          affiliateBaseUrl: 'https://www.amazon.in/dp/'
                        })}
                        className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 rounded-lg hover:bg-amber-500 hover:text-white transition-colors"
                      >
                        + Amazon India
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({
                          id: 'flipkart',
                          name: 'Flipkart',
                          logoText: 'Flipkart',
                          badgeColor: '#2874F0',
                          affiliateBaseUrl: 'https://www.flipkart.com/p/'
                        })}
                        className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        + Flipkart
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Merchant Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm({
                        ...form,
                        name,
                        id: form.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                        logoText: form.logoText || name
                      });
                    }}
                    placeholder="e.g. Meesho or Amazon India"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">System ID *</label>
                    <input
                      type="text"
                      required
                      value={form.id}
                      onChange={(e) => setForm({ ...form, id: e.target.value })}
                      placeholder="amazon"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Theme Color Hex</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.badgeColor}
                        onChange={(e) => setForm({ ...form, badgeColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                      />
                      <input
                        type="text"
                        value={form.badgeColor}
                        onChange={(e) => setForm({ ...form, badgeColor: e.target.value })}
                        className="flex-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Affiliate Destination Base URL</label>
                  <input
                    type="url"
                    value={form.affiliateBaseUrl}
                    onChange={(e) => setForm({ ...form, affiliateBaseUrl: e.target.value })}
                    placeholder="https://www.amazon.in/dp/"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
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
                    Save Merchant
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
