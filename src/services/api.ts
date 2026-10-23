export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

/**
 * Error code signalling that the backend API could not be reached in a
 * meaningful way — e.g. Firebase Hosting answered with the SPA HTML shell
 * (its `** -> /index.html` rewrite) instead of the Express API. Callers use
 * this to fall back to Firebase Authentication instead of failing silently.
 */
export const API_UNAVAILABLE = 'API_UNAVAILABLE';

export const isApiUnavailable = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  return (err as { code?: string }).code === API_UNAVAILABLE || err instanceof TypeError;
};

const apiUnavailableError = (detail: string): Error => {
  const err = new Error(`Backend API unavailable: ${detail}`) as Error & { code: string };
  err.code = API_UNAVAILABLE;
  return err;
};

const getHeaders = (isFormData: boolean = false): HeadersInit => {
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  const token = typeof window !== 'undefined'
    ? (sessionStorage.getItem('nidpik_admin_token') || localStorage.getItem('nidpik_admin_token'))
    : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  expectJson: boolean = false
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...getHeaders(isFormData),
    ...(options.headers as Record<string, string> || {})
  };

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errJson = await response.json();
      errorMsg = errJson.error || errJson.message || errorMsg;
    } catch {
      errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMsg);
  }

  // Handle empty or void responses
  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await response.json();
  }

  // If a text/html or non-JSON response was received from an API endpoint, it means
  // static hosting rewrote the API route to index.html (or an HTML error page was returned).
  // Throw an API_UNAVAILABLE error so the frontend knows the backend API is unreachable
  // instead of silently returning a raw HTML string.
  throw apiUnavailableError(
    `expected JSON from ${endpoint} but received '${contentType || 'unknown'}'. Backend API is unreachable on this host.`
  );
}

export const api = {
  // Public Data & Search
  public: {
    getBootstrap: () => request<any>('/api/public/bootstrap'),
    search: (q: string) => request<any>(`/api/public/search?q=${encodeURIComponent(q)}`),
    updateLogo: (data: FormData | { dataUrl?: string; logoUrl?: string; resetDefault?: boolean }) => {
      if (data instanceof FormData) {
        return request<any>('/api/public/update-logo', {
          method: 'POST',
          body: data
        });
      }
      return request<any>('/api/public/update-logo', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  },

  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ token: string; user: any }>(
        '/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(credentials)
        },
        true
      ),
    logout: () =>
      request<any>('/api/auth/logout', { method: 'POST' }),
    me: () => request<{ user: any }>('/api/auth/me', {}, true),
    updateProfile: (data: { name?: string; password?: string }) =>
      request<{ user: any; message: string }>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      request<{ success: boolean; message: string }>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },

  // Products
  products: {
    getAll: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any[]>(`/api/products${query}`);
    },
    getOne: (idOrSlug: string) =>
      request<any>(`/api/products/${idOrSlug}`),
    create: (data: any) =>
      request<any>('/api/products', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: any) =>
      request<any>(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    updateStatus: (id: string, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') =>
      request<any>(`/api/products/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }),
    duplicate: (id: string) =>
      request<any>(`/api/products/${id}/duplicate`, {
        method: 'POST'
      }),
    delete: (id: string) =>
      request<any>(`/api/products/${id}`, {
        method: 'DELETE'
      }),
    bulk: (ids: string[], action: 'publish' | 'unpublish' | 'archive' | 'delete') =>
      request<any>('/api/products/bulk', {
        method: 'POST',
        body: JSON.stringify({ ids, action })
      }),
    setPriceAlert: (id: string, data: { email: string; targetPrice?: number }) =>
      request<{ success: boolean; message: string; alertId: string; targetPrice: number }>(`/api/products/${id}/price-alert`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getPriceHistory: (id: string) =>
      request<{
        productId: string;
        currentPrice: number;
        lowestRecorded: number;
        highestRecorded: number;
        averagePrice: number;
        history: Array<{ month: string; price: number }>;
      }>(`/api/products/${id}/price-history`),
    getUserReviews: (id: string) =>
      request<{ reviews: any[]; totalCount: number; averageRating: number }>(`/api/products/${id}/user-reviews`),
    submitUserReview: (id: string, data: { authorName: string; authorEmail?: string; rating: number; headline?: string; comment: string }) =>
      request<{ success: boolean; message: string; reviewId: string }>(`/api/products/${id}/user-reviews`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },

  // Categories
  categories: {
    getAll: () => request<any[]>('/api/categories'),
    getOne: (idOrSlug: string) => request<any>(`/api/categories/${idOrSlug}`),
    create: (data: any) =>
      request<any>('/api/categories', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: any) =>
      request<any>(`/api/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id: string) =>
      request<any>(`/api/categories/${id}`, {
        method: 'DELETE'
      })
  },

  // Articles
  articles: {
    getAll: (status?: string) =>
      request<any[]>(`/api/articles${status ? `?status=${status}` : ''}`),
    getOne: (idOrSlug: string) => request<any>(`/api/articles/${idOrSlug}`),
    create: (data: any) =>
      request<any>('/api/articles', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: any) =>
      request<any>(`/api/articles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id: string) =>
      request<any>(`/api/articles/${id}`, {
        method: 'DELETE'
      })
  },

  // Buying Guides
  guides: {
    getAll: () => request<any[]>('/api/guides'),
    getOne: (idOrSlug: string) => request<any>(`/api/guides/${idOrSlug}`),
    create: (data: any) =>
      request<any>('/api/guides', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: any) =>
      request<any>(`/api/guides/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id: string) =>
      request<any>(`/api/guides/${id}`, {
        method: 'DELETE'
      })
  },

  // Comparisons
  comparisons: {
    getAll: () => request<any[]>('/api/comparisons'),
    getOne: (idOrSlug: string) => request<any>(`/api/comparisons/${idOrSlug}`),
    create: (data: any) =>
      request<any>('/api/comparisons', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: any) =>
      request<any>(`/api/comparisons/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id: string) =>
      request<any>(`/api/comparisons/${id}`, {
        method: 'DELETE'
      })
  },

  // Reviews
  reviews: {
    getAll: () => request<any[]>('/api/reviews'),
    getOne: (idOrSlug: string) => request<any>(`/api/reviews/${idOrSlug}`),
    create: (data: any) =>
      request<any>('/api/reviews', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: any) =>
      request<any>(`/api/reviews/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id: string) =>
      request<any>(`/api/reviews/${id}`, {
        method: 'DELETE'
      })
  },

  // Problem Collections
  problems: {
    getAll: () => request<any[]>('/api/problems'),
    getOne: (idOrSlug: string) => request<any>(`/api/problems/${idOrSlug}`),
    create: (data: any) =>
      request<any>('/api/problems', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: any) =>
      request<any>(`/api/problems/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id: string) =>
      request<any>(`/api/problems/${id}`, {
        method: 'DELETE'
      })
  },

  // Budget Tiers
  budgets: {
    getAll: () => request<any[]>('/api/budgets'),
    update: (amount: number, data: any) =>
      request<any>(`/api/budgets/${amount}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
  },

  // Merchants & Affiliate Links
  merchants: {
    getAll: () => request<any[]>('/api/merchants'),
    getOne: (id: string) => request<any>(`/api/merchants/${id}`),
    create: (data: any) =>
      request<any>('/api/merchants', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: any) =>
      request<any>(`/api/merchants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id: string) =>
      request<any>(`/api/merchants/${id}`, {
        method: 'DELETE'
      })
  },

  affiliateLinks: {
    getAll: () => request<any[]>('/api/affiliate-links'),
    create: (data: any) =>
      request<any>('/api/affiliate-links', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: any) =>
      request<any>(`/api/affiliate-links/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id: string) =>
      request<any>(`/api/affiliate-links/${id}`, {
        method: 'DELETE'
      })
  },

  // Media
  media: {
    getAll: (search?: string) =>
      request<any[]>(`/api/media${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    upload: (file: File, altText?: string, title?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      if (altText) formData.append('altText', altText);
      if (title) formData.append('title', title);
      return request<any>('/api/media', {
        method: 'POST',
        body: formData
      });
    },
    update: (id: string, data: { altText?: string; title?: string }) =>
      request<any>(`/api/media/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id: string) =>
      request<any>(`/api/media/${id}`, {
        method: 'DELETE'
      })
  },

  // Authors
  authors: {
    getAll: () => request<any[]>('/api/admin/authors'),
    create: (data: any) =>
      request<any>('/api/admin/authors', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: any) =>
      request<any>(`/api/admin/authors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id: string) =>
      request<any>(`/api/admin/authors/${id}`, {
        method: 'DELETE'
      })
  },

  // Users
  users: {
    getAll: () => request<any[]>('/api/admin/users'),
    create: (data: any) =>
      request<any>('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateRole: (id: string, role: string) =>
      request<any>(`/api/admin/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
      }),
    updateStatus: (id: string, status: 'active' | 'disabled') =>
      request<any>(`/api/admin/users/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      }),
    delete: (id: string) =>
      request<any>(`/api/admin/users/${id}`, {
        method: 'DELETE'
      })
  },

  // Settings
  settings: {
    get: () => request<Record<string, any>>('/api/admin/settings'),
    update: (key: string, value: any) =>
      request<any>(`/api/admin/settings/${key}`, {
        method: 'PUT',
        body: JSON.stringify(value)
      }),
    uploadLogo: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const token = typeof window !== 'undefined'
        ? (sessionStorage.getItem('nidpik_admin_token') || localStorage.getItem('nidpik_admin_token'))
        : null;
      const res = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to upload logo');
      }
      return res.json();
    },
    uploadLogoUrl: (data: { logoUrl?: string; dataUrl?: string }) =>
      request<any>('/api/admin/upload-logo', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },

  // Audit Logs & Analytics
  auditLogs: {
    getAll: () => request<any[]>('/api/admin/audit-logs')
  },

  analytics: {
    getSummary: () => request<any>('/api/admin/summary'),
    getClicks: () => request<any>('/api/analytics/clicks'),
    trackClick: (data: { productId: string; merchantId?: string; sourcePage?: string; ctaType?: string }) =>
      fetch('/api/analytics/clicks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true
      }).catch(() => {})
  },

  // AI Product Buying Advisor
  ai: {
    getPresets: () => request<{ presets: Array<{ id: string; label: string; query: string; icon: string }> }>('/api/ai/presets'),
    recommend: (body: { query: string; budgetMax?: number; category?: string }) =>
      request<{
        advice: string;
        products: any[];
        reasons: Record<string, string>;
        isAiPowered?: boolean;
      }>('/api/ai/recommend', {
        method: 'POST',
        body: JSON.stringify(body)
      })
  },

  // Newsletter Subscribers
  subscribers: {
    subscribe: (email: string, source: string = 'website') =>
      request<{ success: boolean; message: string }>('/api/public/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email, source })
      }),
    getAll: () =>
      request<{ total: number; active: number; subscribers: Array<{ id: string; email: string; source: string; status: string; createdAt: string }> }>('/api/admin/subscribers'),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/admin/subscribers/${id}`, {
        method: 'DELETE'
      })
  }
};
