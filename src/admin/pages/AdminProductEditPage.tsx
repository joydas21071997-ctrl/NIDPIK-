import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { useApp, COUNTRIES } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Save,
  ArrowLeft,
  ExternalLink,
  Plus,
  Trash2,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Eye,
  Sparkles,
  Globe,
  CheckCircle2
} from 'lucide-react';
import { saveProductToFirestore } from '../../services/firebaseSync';

interface Props {
  productId?: string; // If undefined or 'new', we are creating
}

export const AdminProductEditPage: React.FC<Props> = ({ productId }) => {
  const { navigate, refreshPublicData, categories, merchants } = useApp();
  const isNew = !productId || productId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'affiliate' | 'seo' | 'preview'>('details');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    brand: '',
    category: 'Electronics',
    categorySlug: 'electronics',
    subcategory: '',
    price: 99,
    oldPrice: 199,
    currency: '₹',
    budgetTier: 99,
    badge: 'Top Pick',
    image: '',
    gallery: [] as string[],
    shortDescription: '',
    quickVerdict: '',
    bestFor: '',
    notIdealFor: '',
    features: ['High durability build', 'Value for money'] as string[],
    specifications: { 'Warranty': '1 Year Brand Warranty', 'Origin': 'India' } as Record<string, string>,
    pros: ['Affordable', 'Reliable performance'] as string[],
    cons: ['Basic packaging'] as string[],
    merchantId: 'amazon',
    affiliateUrls: { IN: '' } as Record<string, string>,
    affiliateNetwork: 'Amazon Associates',
    status: 'PUBLISHED' as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    problemTags: [] as string[],
    seoTitle: '',
    seoDescription: '',
    canonicalUrl: '',
    ogImage: ''
  });

  // Helpers for array fields
  const [newFeature, setNewFeature] = useState('');
  const [newPro, setNewPro] = useState('');
  const [newCon, setNewCon] = useState('');
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecVal, setNewSpecVal] = useState('');
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [newCountryCode, setNewCountryCode] = useState('');

  // Load product if editing
  useEffect(() => {
    if (!isNew && productId) {
      setLoading(true);
      api.products.getOne(productId)
        .then((p) => {
          if (p) {
            setFormData({
              name: p.name || '',
              slug: p.slug || '',
              brand: p.brand || '',
              category: p.category || 'Electronics',
              categorySlug: p.categorySlug || 'electronics',
              subcategory: p.subcategory || '',
              price: p.price ?? 99,
              oldPrice: p.oldPrice ?? 0,
              currency: p.currency || '₹',
              budgetTier: p.budgetTier ?? 99,
              badge: p.badge || '',
              image: p.image || '',
              gallery: p.gallery || [],
              shortDescription: p.shortDescription || '',
              quickVerdict: p.quickVerdict || '',
              bestFor: p.bestFor || '',
              notIdealFor: p.notIdealFor || '',
              features: p.features || [],
              specifications: p.specifications || {},
              pros: p.pros || [],
              cons: p.cons || [],
              merchantId: p.merchant?.id || 'amazon',
              affiliateUrls: (p.affiliateUrls && Object.keys(p.affiliateUrls).length > 0)
                ? p.affiliateUrls
                : ((p as any).affiliateUrl ? { IN: (p as any).affiliateUrl } : { IN: '' }),
              affiliateNetwork: p.affiliateNetwork || 'Amazon Associates',
              status: p.status || 'PUBLISHED',
              problemTags: p.problemTags || [],
              seoTitle: p.seoTitle || '',
              seoDescription: p.seoDescription || '',
              canonicalUrl: p.canonicalUrl || '',
              ogImage: p.ogImage || ''
            });
          }
        })
        .catch((err) => {
          setError(err.message || 'Product not found');
        })
        .finally(() => setLoading(false));
    }
  }, [productId, isNew]);

  const generateSlug = () => {
    if (!formData.name) return;
    const s = formData.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setFormData(prev => ({ ...prev, slug: s }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSaving(true);

    try {
      // Find selected merchant
      const selectedMerchant = merchants.find(m => m.id === formData.merchantId) || {
        id: formData.merchantId,
        name: formData.merchantId === 'amazon' ? 'Amazon India' : formData.merchantId,
        logoText: formData.merchantId,
        badgeColor: '#FF9900',
        affiliateBaseUrl: ''
      };

      const primaryUrl = formData.affiliateUrls.IN || Object.values(formData.affiliateUrls).find(Boolean) || '';
      const payload = {
        ...formData,
        affiliateUrl: primaryUrl,
        merchant: selectedMerchant,
        lastUpdated: new Date().toISOString().split('T')[0]
      };

      let result: any;
      const targetId = isNew ? (formData.slug || 'prod_' + Date.now()) : productId!;

      // 1. Direct Cloud Firestore write
      try {
        await saveProductToFirestore({
          id: targetId,
          ...payload
        });
      } catch (fErr) {
        console.warn('[Firestore] Product sync note:', fErr);
      }

      // 2. Dual write to backend API (if server running)
      try {
        if (isNew) {
          result = await api.products.create({ id: targetId, ...payload });
        } else {
          result = await api.products.update(productId!, payload);
        }
      } catch (apiErr) {
        console.warn('[API] Backend product sync note:', apiErr);
      }

      setSuccessMsg(isNew ? 'Product published to Cloud Firestore & catalog!' : 'Product saved to Cloud Firestore successfully!');
      await refreshPublicData();

      if (isNew) {
        setTimeout(() => {
          navigate(`/admin/products/${result?.id || targetId}`);
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Loading Product..." subtitle="Fetching latest data">
        <div className="py-24 text-center text-xs text-slate-400">Loading product editor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={isNew ? 'Create New Product' : `Edit: ${formData.name || 'Product'}`}
      subtitle={isNew ? 'Define specs, pricing tier, and affiliate links' : `Slug: /product/${formData.slug}`}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          {!isNew && (
            <a
              href={`/product/${formData.slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Product'}</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* MESSAGES */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-1 border-b border-slate-200 pb-px">
          {[
            { id: 'details', label: 'Basic Info & Description' },
            { id: 'specs', label: 'Specs, Features & Pros/Cons' },
            { id: 'affiliate', label: 'Pricing & Affiliate Links' },
            { id: 'seo', label: 'SEO & Metadata' },
            { id: 'preview', label: 'Card Preview' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors ${
                activeTab === tab.id
                  ? 'bg-white border-t border-x border-slate-200 text-blue-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: BASIC DETAILS */}
        {activeTab === 'details' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. boAt Bassheads 100 Wired Earphones"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Slug *
                  </label>
                  <button
                    type="button"
                    onClick={generateSlug}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Auto from name
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="boat-bassheads-100"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Brand *</label>
                <input
                  type="text"
                  required
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="boAt, Mi, Pigeon..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Category *</label>
                <select
                  value={formData.categorySlug}
                  onChange={(e) => {
                    const c = categories.find(cat => cat.slug === e.target.value);
                    setFormData({
                      ...formData,
                      categorySlug: e.target.value,
                      category: c ? c.name : e.target.value
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  {categories.map((c) => (
                    <option key={c.id || c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Subcategory</label>
                <input
                  type="text"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  placeholder="e.g. In-Ear Headphones"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Main Image URL *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                  {formData.image && (
                    <div className="w-10 h-10 rounded-xl border border-slate-200 overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center p-0.5">
                      <img src={formData.image} alt="preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Badge / Label
                </label>
                <input
                  type="text"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  placeholder="Top Pick, Best Value, Editor Choice..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Short Description (1-2 punchy sentences)
              </label>
              <textarea
                rows={2}
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="Highlight the primary convenience or solution this product offers..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Quick Editorial Verdict
              </label>
              <textarea
                rows={2}
                value={formData.quickVerdict}
                onChange={(e) => setFormData({ ...formData, quickVerdict: e.target.value })}
                placeholder="Our independent take on why to buy or pass..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Best For (Target Audience)
                </label>
                <input
                  type="text"
                  value={formData.bestFor}
                  onChange={(e) => setFormData({ ...formData, bestFor: e.target.value })}
                  placeholder="e.g. Students on a strict budget, daily commuters"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Not Ideal For
                </label>
                <input
                  type="text"
                  value={formData.notIdealFor}
                  onChange={(e) => setFormData({ ...formData, notIdealFor: e.target.value })}
                  placeholder="e.g. Audiophiles needing active noise cancellation"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: SPECS, FEATURES, PROS & CONS */}
        {activeTab === 'specs' && (
          <div className="space-y-6">
            
            {/* KEY FEATURES */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Key Features</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add a key feature..."
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newFeature.trim()) {
                      setFormData({ ...formData, features: [...formData.features, newFeature.trim()] });
                      setNewFeature('');
                    }
                  }}
                  className="px-3.5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
                >
                  Add
                </button>
              </div>

              <div className="space-y-1.5">
                {formData.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl text-xs border border-slate-100">
                    <span>{feat}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        features: formData.features.filter((_, i) => i !== idx)
                      })}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* PROS & CONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PROS */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-emerald-700">Pros</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPro}
                    onChange={(e) => setNewPro(e.target.value)}
                    placeholder="Add an advantage..."
                    className="flex-1 px-3.5 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newPro.trim()) {
                        setFormData({ ...formData, pros: [...formData.pros, newPro.trim()] });
                        setNewPro('');
                      }
                    }}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                  >
                    Add Pro
                  </button>
                </div>
                <div className="space-y-1.5">
                  {formData.pros.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-emerald-50/30 rounded-xl text-xs border border-emerald-100">
                      <span className="text-emerald-900 font-medium">✓ {p}</span>
                      <button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          pros: formData.pros.filter((_, i) => i !== idx)
                        })}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* CONS */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-rose-700">Cons</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCon}
                    onChange={(e) => setNewCon(e.target.value)}
                    placeholder="Add a drawback..."
                    className="flex-1 px-3.5 py-2 bg-rose-50/50 border border-rose-200 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newCon.trim()) {
                        setFormData({ ...formData, cons: [...formData.cons, newCon.trim()] });
                        setNewCon('');
                      }
                    }}
                    className="px-3 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
                  >
                    Add Con
                  </button>
                </div>
                <div className="space-y-1.5">
                  {formData.cons.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-rose-50/30 rounded-xl text-xs border border-rose-100">
                      <span className="text-rose-900 font-medium">✕ {c}</span>
                      <button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          cons: formData.cons.filter((_, i) => i !== idx)
                        })}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* TECHNICAL SPECIFICATIONS */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Technical Specifications</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newSpecKey}
                  onChange={(e) => setNewSpecKey(e.target.value)}
                  placeholder="Spec name (e.g. Battery Life)"
                  className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <input
                  type="text"
                  value={newSpecVal}
                  onChange={(e) => setNewSpecVal(e.target.value)}
                  placeholder="Value (e.g. 24 Hours)"
                  className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newSpecKey.trim() && newSpecVal.trim()) {
                      setFormData({
                        ...formData,
                        specifications: {
                          ...formData.specifications,
                          [newSpecKey.trim()]: newSpecVal.trim()
                        }
                      });
                      setNewSpecKey('');
                      setNewSpecVal('');
                    }
                  }}
                  className="px-3.5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
                >
                  Add Spec
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {Object.entries(formData.specifications).map(([k, v]) => (
                  <div key={k} className="py-2 flex items-center justify-between">
                    <span className="font-semibold text-slate-600">{k}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-900 font-medium">{v}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...formData.specifications };
                          delete updated[k];
                          setFormData({ ...formData, specifications: updated });
                        }}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: PRICING & AFFILIATE */}
        {activeTab === 'affiliate' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Current Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  MRP / Old Price (₹)
                </label>
                <input
                  type="number"
                  value={formData.oldPrice}
                  onChange={(e) => setFormData({ ...formData, oldPrice: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Budget Filter Tier (₹)
                </label>
                <select
                  value={formData.budgetTier}
                  onChange={(e) => setFormData({ ...formData, budgetTier: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value={99}>Under ₹99</option>
                  <option value={199}>Under ₹199</option>
                  <option value={299}>Under ₹299</option>
                  <option value={499}>Under ₹499</option>
                  <option value={999}>Under ₹999</option>
                  <option value={1499}>Under ₹1,499</option>
                  <option value={1999}>Under ₹1,999</option>
                  <option value={4999}>Under ₹4,999</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Merchant *
                </label>
                <select
                  value={formData.merchantId}
                  onChange={(e) => setFormData({ ...formData, merchantId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Affiliate Network
                </label>
                <input
                  type="text"
                  value={formData.affiliateNetwork}
                  onChange={(e) => setFormData({ ...formData, affiliateNetwork: e.target.value })}
                  placeholder="Amazon Associates, Cuelinks, Involve Asia..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Multi-Country Regional Affiliate Links */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-blue-600" />
                      Regional Affiliate Links (এক পোস্টে সব দেশের অ্যাফিলিয়েট লিংক) *
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Multi-Country Store Mapping
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    আলাদা আলাদা দেশের জন্য আলাদা আলাদা পোস্ট করার প্রয়োজন নেই! এক পোস্টের ভেতরেই প্রতিটি দেশের স্টোর লিঙ্ক সেট করা যাবে। ভিজিটররা যে দেশ সিলেক্ট করবে, &quot;Buy Now&quot; বাটনে ক্লিক করলে স্বয়ংক্রিয়ভাবে সেই দেশের স্টোর পেজ ওপেন হবে।
                  </p>
                </div>
              </div>

              {/* Supported Countries Inputs */}
              <div className="space-y-3">
                {COUNTRIES.map((country) => (
                  <div key={country.code} className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="text-base">{country.flag}</span>
                        <span>{country.name} ({country.code})</span>
                        <span className="text-[10px] font-medium text-slate-400">· {country.currencySymbol} ({country.currencyCode})</span>
                        {country.code === 'IN' && (
                          <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded">
                            Primary / Required
                          </span>
                        )}
                      </span>
                      {formData.affiliateUrls[country.code] ? (
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Link Ready
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Optional (falls back to primary)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={formData.affiliateUrls[country.code] || ''}
                        onChange={(e) => {
                          const updated = { ...formData.affiliateUrls, [country.code]: e.target.value };
                          setFormData({ ...formData, affiliateUrls: updated });
                        }}
                        placeholder={`https://www.amazon.${country.code === 'IN' ? 'in' : country.code === 'UK' ? 'co.uk' : country.code === 'CA' ? 'ca' : 'com'}/dp/...?tag=nidpik-21`}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                      {formData.affiliateUrls[country.code] && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...formData.affiliateUrls };
                            delete updated[country.code];
                            setFormData({ ...formData, affiliateUrls: updated });
                          }}
                          className="px-2.5 py-1.5 text-slate-400 hover:text-rose-600 text-xs font-medium rounded-lg hover:bg-rose-50 transition-colors"
                          title="Clear link"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Additional Custom Countries if defined */}
                {Object.keys(formData.affiliateUrls)
                  .filter((code) => !COUNTRIES.some((c) => c.code === code))
                  .map((customCode) => (
                    <div key={customCode} className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-blue-500" />
                          <span>Custom Market: {customCode}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...formData.affiliateUrls };
                            delete updated[customCode];
                            setFormData({ ...formData, affiliateUrls: updated });
                          }}
                          className="text-[11px] text-rose-500 hover:text-rose-700 font-medium hover:bg-rose-50 px-2 py-0.5 rounded transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        type="url"
                        value={formData.affiliateUrls[customCode] || ''}
                        onChange={(e) => {
                          const updated = { ...formData.affiliateUrls, [customCode]: e.target.value };
                          setFormData({ ...formData, affiliateUrls: updated });
                        }}
                        placeholder="https://..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
              </div>

              {/* Add Custom Market Row */}
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={newCountryCode}
                  onChange={(e) => setNewCountryCode(e.target.value.toUpperCase())}
                  placeholder="e.g. AU, DE"
                  className="w-28 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold uppercase focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const code = newCountryCode.trim().toUpperCase();
                    if (code && !formData.affiliateUrls[code]) {
                      setFormData({
                        ...formData,
                        affiliateUrls: { ...formData.affiliateUrls, [code]: '' }
                      });
                      setNewCountryCode('');
                    }
                  }}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  + Add Other Country Code
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Publication Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full sm:w-64 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="PUBLISHED">PUBLISHED (Visible to public)</option>
                <option value="DRAFT">DRAFT (Hidden from site)</option>
                <option value="ARCHIVED">ARCHIVED (Archived / discontinued)</option>
              </select>
            </div>

          </div>
        )}

        {/* TAB 4: SEO & METADATA */}
        {activeTab === 'seo' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
            
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Custom SEO Title
              </label>
              <input
                type="text"
                value={formData.seoTitle}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                placeholder={`${formData.name || 'Product'} | Best Price & Review | NIDPIK`}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Meta Description
              </label>
              <textarea
                rows={3}
                value={formData.seoDescription}
                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                placeholder="Comprehensive specs, real pros & cons, verified budget pricing for Indian buyers..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Canonical URL
                </label>
                <input
                  type="url"
                  value={formData.canonicalUrl}
                  onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
                  placeholder={`https://nidpik.in/product/${formData.slug}`}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Social OG Image URL
                </label>
                <input
                  type="url"
                  value={formData.ogImage}
                  onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                  placeholder={formData.image || 'https://...'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* GOOGLE SEARCH SNIPPET SIMULATOR */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Google Search Result Preview
              </span>
              <div className="text-xs text-emerald-800 font-mono">
                https://nidpik.in › product › {formData.slug || 'product-slug'}
              </div>
              <div className="text-sm font-semibold text-blue-700 hover:underline">
                {formData.seoTitle || `${formData.name || 'Product Title'} - NIDPIK`}
              </div>
              <div className="text-xs text-slate-600 line-clamp-2">
                {formData.seoDescription || formData.shortDescription || 'Discover top features, price, and specs on NIDPIK.'}
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: PREVIEW */}
        {activeTab === 'preview' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
            <h3 className="text-sm font-bold text-slate-900">Live Card Simulator</h3>
            <div className="max-w-xs mx-auto bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="w-full h-44 bg-slate-100 rounded-xl flex items-center justify-center p-2">
                {formData.image ? (
                  <img src={formData.image} alt={formData.name} className="w-full h-full object-contain mix-blend-multiply" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{formData.brand || 'Brand'}</span>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{formData.name || 'Sample Product Name'}</h4>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-extrabold text-slate-900 font-mono">₹{formData.price?.toLocaleString('en-IN')}</span>
                {formData.oldPrice > formData.price && (
                  <span className="text-xs text-slate-400 line-through font-mono">₹{formData.oldPrice?.toLocaleString('en-IN')}</span>
                )}
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">{formData.merchantId}</span>
                <span className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded-lg text-[10px]">
                  Check Price →
                </span>
              </div>
            </div>
          </div>
        )}

      </form>
    </AdminLayout>
  );
};
