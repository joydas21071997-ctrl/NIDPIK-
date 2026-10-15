import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Package,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  ExternalLink,
  Archive,
  CheckCircle,
  Eye,
  ArrowUpDown,
  RefreshCw,
  Check,
  AlertCircle
} from 'lucide-react';
import { deleteProductFromFirestore } from '../../services/firebaseSync';

export const AdminProductsPage: React.FC = () => {
  const { navigate, refreshPublicData } = useApp();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'updated_at' | 'price_asc' | 'price_desc' | 'name'>('updated_at');

  // Bulk actions selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.products.getAll();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Filter & Sort logic
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase()) ||
      p.slug?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === 'ALL' ||
      p.categorySlug === categoryFilter ||
      p.category === categoryFilter;

    const matchesStatus =
      statusFilter === 'ALL' || p.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
    if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    return new Date(b.updatedAt || b.lastUpdated || 0).getTime() - new Date(a.updatedAt || a.lastUpdated || 0).getTime();
  });

  // Unique categories for filter dropdown
  const categoriesList = Array.from(new Set(products.map(p => p.categorySlug || p.category))).filter(Boolean);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleStatusChange = async (id: string, status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') => {
    try {
      await api.products.updateStatus(id, status);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      showToast(`Product status updated to ${status}`);
      refreshPublicData();
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      setActionLoading(true);
      const duplicated = await api.products.duplicate(id);
      await loadProducts();
      showToast('Product duplicated successfully');
      refreshPublicData();
      if (duplicated && duplicated.id) {
        navigate(`/admin/products/${duplicated.id}`);
      }
    } catch (err: any) {
      alert(`Error duplicating: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) {
      return;
    }
    try {
      await deleteProductFromFirestore(id).catch(console.warn);
      await api.products.delete(id).catch(console.warn);
      setProducts(prev => prev.filter(p => p.id !== id));
      setSelectedIds(prev => prev.filter(x => x !== id));
      showToast('Product permanently deleted from Cloud Firestore');
      refreshPublicData();
    } catch (err: any) {
      alert(`Error deleting product: ${err.message}`);
    }
  };

  const handleBulkAction = async (action: 'publish' | 'unpublish' | 'archive' | 'delete') => {
    if (selectedIds.length === 0) return;
    if (action === 'delete' && !window.confirm(`Are you sure you want to delete ${selectedIds.length} selected products?`)) {
      return;
    }
    try {
      setActionLoading(true);
      await api.products.bulk(selectedIds, action);
      await loadProducts();
      setSelectedIds([]);
      showToast(`Bulk action "${action}" completed for ${selectedIds.length} products`);
      refreshPublicData();
    } catch (err: any) {
      alert(`Bulk action error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Product Catalog"
      subtitle={`Manage all ${products.length} products, budgets, pricing, and affiliate destinations`}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadProducts()}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/admin/products/new')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        
        {/* TOAST FEEDBACK */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-bounce">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex-1 flex flex-wrap items-center gap-3">
            {/* SEARCH */}
            <div className="relative min-w-[240px] flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, brand, or slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* CATEGORY FILTER */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Categories</option>
                {categoriesList.map((cat: any) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* STATUS FILTER */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          {/* SORT SELECT */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="updated_at">Recently Updated</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Product Name</option>
            </select>
          </div>
        </div>

        {/* BULK ACTIONS TOOLBAR (if any items selected) */}
        {selectedIds.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex items-center justify-between gap-3 text-xs text-blue-900">
            <span className="font-bold">
              {selectedIds.length} product(s) selected
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={actionLoading}
                onClick={() => handleBulkAction('publish')}
                className="px-2.5 py-1.5 bg-white border border-blue-200 hover:bg-blue-100 rounded-lg font-semibold text-emerald-700 transition-colors"
              >
                Publish All
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleBulkAction('unpublish')}
                className="px-2.5 py-1.5 bg-white border border-blue-200 hover:bg-blue-100 rounded-lg font-semibold text-amber-700 transition-colors"
              >
                Set to Draft
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleBulkAction('archive')}
                className="px-2.5 py-1.5 bg-white border border-blue-200 hover:bg-blue-100 rounded-lg font-semibold text-slate-700 transition-colors"
              >
                Archive All
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleBulkAction('delete')}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold transition-colors"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* PRODUCTS TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="py-24 text-center text-xs text-slate-400">Loading catalog...</div>
          ) : error ? (
            <div className="p-8 text-center text-rose-600 text-xs">{error}</div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <Package className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No products found matching filters</p>
              <button
                onClick={() => { setSearch(''); setCategoryFilter('ALL'); setStatusFilter('ALL'); }}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-blue-600"
                      />
                    </th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Merchant</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredProducts.map((p) => {
                    const isSelected = selectedIds.includes(p.id);
                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isSelected ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        {/* CHECKBOX */}
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(p.id)}
                            className="rounded border-slate-300 text-blue-600"
                          />
                        </td>

                        {/* PRODUCT DETAILS */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center p-1">
                              {p.image ? (
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="w-full h-full object-contain mix-blend-multiply"
                                  onError={(e) => {
                                    (e.target as any).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80';
                                  }}
                                />
                              ) : (
                                <Package className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0 max-w-xs md:max-w-md">
                              <span className="font-bold text-slate-900 block truncate hover:text-blue-600 cursor-pointer" onClick={() => navigate(`/admin/products/${p.id}`)}>
                                {p.name}
                              </span>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                <span className="font-semibold text-slate-700">{p.brand}</span>
                                <span>•</span>
                                <span className="font-mono text-[10px] text-slate-400 truncate">/{p.slug}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* CATEGORY */}
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-700 block">
                            {p.category}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {p.subcategory || 'General'}
                          </span>
                        </td>

                        {/* PRICE */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-900 block">
                            ₹{p.price?.toLocaleString('en-IN')}
                          </span>
                          {p.oldPrice && p.oldPrice > p.price && (
                            <span className="text-[10px] line-through text-slate-400 font-mono block">
                              ₹{p.oldPrice?.toLocaleString('en-IN')}
                            </span>
                          )}
                        </td>

                        {/* MERCHANT */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {p.merchant?.name || 'Amazon'}
                          </span>
                        </td>

                        {/* STATUS */}
                        <td className="py-3 px-4">
                          <select
                            value={p.status || 'PUBLISHED'}
                            onChange={(e) => handleStatusChange(p.id, e.target.value as any)}
                            className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                              p.status === 'PUBLISHED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : p.status === 'DRAFT'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            <option value="PUBLISHED">PUBLISHED</option>
                            <option value="DRAFT">DRAFT</option>
                            <option value="ARCHIVED">ARCHIVED</option>
                          </select>
                        </td>

                        {/* ACTIONS */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/admin/products/${p.id}`)}
                              className="p-1.5 hover:bg-blue-50 hover:text-blue-600 text-slate-500 rounded-lg transition-colors"
                              title="Edit product"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicate(p.id)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                              title="Duplicate product"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={`/product/${p.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                              title="View on site"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
};
