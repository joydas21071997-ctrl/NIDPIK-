import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { formatPrice as formatPriceUtil } from '../utils/currency';
import {
  Product,
  Category,
  BuyingGuide,
  Comparison,
  Review,
  Article,
  ProblemCollection,
  BudgetTier,
  Merchant,
  Author
} from '../types';
import { api } from '../services/api';
import { isApiUnavailable } from '../services/api';
import {
  firebaseAdminLogin,
  firebaseAdminLogout,
  isFirebaseSessionActive
} from '../services/adminAuth';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

// Initial fallback datasets for zero-latency initial paint
import { products as initialProducts } from '../data/products';
import { categories as initialCategories } from '../data/categories';
import { buyingGuides as initialGuides } from '../data/buyingGuides';
import { comparisons as initialComparisons } from '../data/comparisons';
import { reviews as initialReviews } from '../data/reviews';
import { articles as initialArticles } from '../data/articles';
import { problemCollections as initialProblems } from '../data/problemCollections';
import { budgetTiers as initialBudgets } from '../data/budgetTiers';
import { merchants as initialMerchants } from '../data/merchants';
import { authors as initialAuthors } from '../data/authors';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'ADMIN' | 'EDITOR';
  status: 'active' | 'disabled';
  lastLogin?: string;
}

export const COUNTRIES = [
  { code: 'IN', name: 'India', currencySymbol: '₹', currencyCode: 'INR', flag: '🇮🇳' },
  { code: 'US', name: 'United States', currencySymbol: '$', currencyCode: 'USD', flag: '🇺🇸' },
  { code: 'UK', name: 'United Kingdom', currencySymbol: '£', currencyCode: 'GBP', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', currencySymbol: 'C$', currencyCode: 'CAD', flag: '🇨🇦' },
];

interface AppContextType {
  // Navigation & Router
  currentPath: string;
  navigate: (path: string, options?: { replace?: boolean; scroll?: boolean }) => void;

  // Market / Country Selector
  selectedCountry: 'IN' | 'US' | 'UK' | 'CA';
  setSelectedCountry: (country: 'IN' | 'US' | 'UK' | 'CA') => void;

  // Search Modal
  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;

  // AI Buying Advisor Modal
  aiAdvisorOpen: boolean;
  setAiAdvisorOpen: (open: boolean) => void;
  initialAiPrompt: string;
  openAiAdvisorWithPrompt: (prompt?: string) => void;

  // Saved Wishlist
  savedProductIds: string[];
  toggleSaveProduct: (productId: string) => void;
  isProductSaved: (productId: string) => boolean;

  // Compare Tray
  compareProductIds: string[];
  addToCompare: (productId: string) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isProductInCompare: (productId: string) => boolean;

  // Affiliate Modal & Tracking
  affiliateRedirect: {
    isOpen: boolean;
    productName: string;
    merchantName: string;
    url: string;
  } | null;
  triggerAffiliateClick: (product: Product, sourcePage?: string, ctaType?: string) => void;
  closeAffiliateModal: () => void;

  // Live Database Content
  products: Product[];
  categories: Category[];
  buyingGuides: BuyingGuide[];
  comparisons: Comparison[];
  reviews: Review[];
  articles: Article[];
  problemCollections: ProblemCollection[];
  budgetTiers: BudgetTier[];
  merchants: Merchant[];
  authors: Author[];
  settings: Record<string, any>;
  isLoadingData: boolean;
  refreshPublicData: () => Promise<void>;
  updateLogoState: (logoUrl: string) => void;

  // Content Lookups
  getProductBySlug: (slug: string) => Product | undefined;
  getCategoryBySlug: (slug: string) => Category | undefined;
  getGuideBySlug: (slug: string) => BuyingGuide | undefined;
  getComparisonBySlug: (slug: string) => Comparison | undefined;
  getReviewBySlug: (slug: string) => Review | undefined;
  getArticleBySlug: (slug: string) => Article | undefined;
  getProblemBySlug: (slug: string) => ProblemCollection | undefined;
  getBudgetTierByAmount: (amount: number) => BudgetTier | undefined;
  getBudgetTierBySlug: (slug: string) => BudgetTier | undefined;
  getAuthorById: (id: string) => Author | undefined;

  // Currency & Localization
  formatPrice: (price: number) => string;
  getAffiliateUrl: (product: Product) => string;

  // Admin Auth & RBAC
  adminUser: AdminUser | null;
  adminToken: string | null;
  isAdminAuthenticated: boolean;
  loginAdmin: (credentials: { email: string; password: string }) => Promise<void>;
  logoutAdmin: () => Promise<void>;
  hasRole: (allowedRoles: Array<'OWNER' | 'ADMIN' | 'EDITOR'>) => boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState<'IN' | 'US' | 'UK' | 'CA'>(() => {
    try {
      const stored = localStorage.getItem('nidpik_selected_country');
      if (stored === 'IN' || stored === 'US' || stored === 'UK' || stored === 'CA') {
        return stored;
      }
    } catch {}
    return 'IN';
  });



// ... (in AppProvider)

  const formatPrice = (price: number) => {
    return formatPriceUtil(price, selectedCountry);
  };



  const getAffiliateUrl = (product: Product) => {
    // Basic logic: if affiliate URL contains 'amazon.in', replace with appropriate market if supported
    // Real-world: This should be product-specific per market
    if (product.affiliateUrl.includes('amazon.in')) {
      if (selectedCountry === 'US') return product.affiliateUrl.replace('amazon.in', 'amazon.com');
      if (selectedCountry === 'UK') return product.affiliateUrl.replace('amazon.in', 'amazon.co.uk');
      if (selectedCountry === 'CA') return product.affiliateUrl.replace('amazon.in', 'amazon.ca');
    }
    return product.affiliateUrl;
  };




  useEffect(() => {
    try {
      localStorage.setItem('nidpik_selected_country', selectedCountry);
    } catch {}
  }, [selectedCountry]);
  const [aiAdvisorOpen, setAiAdvisorOpen] = useState(false);
  const [initialAiPrompt, setInitialAiPrompt] = useState('');

  const openAiAdvisorWithPrompt = useCallback((prompt?: string) => {
    if (prompt) {
      setInitialAiPrompt(prompt);
    }
    setAiAdvisorOpen(true);
  }, []);
  const [savedProductIds, setSavedProductIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('nidpik_saved_products');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [compareProductIds, setCompareProductIds] = useState<string[]>([]);
  const [affiliateRedirect, setAffiliateRedirect] = useState<{
    isOpen: boolean;
    productName: string;
    merchantName: string;
    url: string;
  } | null>(null);

  // Live Database Content States (with initial seed fallbacks)
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [buyingGuides, setBuyingGuides] = useState<BuyingGuide[]>(initialGuides);
  const [comparisons, setComparisons] = useState<Comparison[]>(initialComparisons);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [problemCollections, setProblemCollections] = useState<ProblemCollection[]>(initialProblems);
  const [budgetTiers, setBudgetTiers] = useState<BudgetTier[]>(initialBudgets);
  const [merchants, setMerchants] = useState<Merchant[]>(initialMerchants);
  const [authors, setAuthors] = useState<Author[]>(initialAuthors);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Admin Authentication State
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('nidpik_admin_token') || null;
  });
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    try {
      const stored = localStorage.getItem('nidpik_admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Fetch live bootstrap data from backend database & Cloud Firestore
  const refreshPublicData = useCallback(async () => {
    try {
      const data = await api.public.getBootstrap().catch(() => null);
      if (data) {
        if (data.products?.length) setProducts(data.products);
        if (data.categories?.length) setCategories(data.categories);
        if (data.buyingGuides?.length) setBuyingGuides(data.buyingGuides);
        if (data.comparisons?.length) setComparisons(data.comparisons);
        if (data.reviews?.length) setReviews(data.reviews);
        if (data.articles?.length) setArticles(data.articles);
        if (data.problemCollections?.length) setProblemCollections(data.problemCollections);
        if (data.budgetTiers?.length) setBudgetTiers(data.budgetTiers);
        if (data.merchants?.length) setMerchants(data.merchants);
        if (data.authors?.length) setAuthors(data.authors);
        if (data.settings) setSettings(data.settings);
      }

      // Synchronize with Cloud Firestore live collections
      try {
        // 1. Live Firestore Products
        const prodSnap = await getDocs(collection(db, 'products'));
        if (!prodSnap.empty) {
          const cloudProds: Product[] = [];
          prodSnap.forEach((d) => {
            cloudProds.push({ id: d.id, ...d.data() } as Product);
          });
          setProducts((prev) => {
            const map = new Map<string, Product>();
            prev.forEach((p) => map.set(p.id, p));
            cloudProds.forEach((p) => map.set(p.id, p));
            return Array.from(map.values());
          });
        }

        // 2. Live Firestore Articles
        const artSnap = await getDocs(collection(db, 'articles'));
        if (!artSnap.empty) {
          const cloudArticles: Article[] = [];
          artSnap.forEach((d) => {
            cloudArticles.push({ id: d.id, ...d.data() } as Article);
          });
          setArticles((prev) => {
            const map = new Map<string, Article>();
            prev.forEach((a) => map.set(a.id, a));
            cloudArticles.forEach((a) => map.set(a.id, a));
            return Array.from(map.values());
          });
        }

        // 3. Live Firestore Categories
        const catSnap = await getDocs(collection(db, 'categories'));
        if (!catSnap.empty) {
          const cloudCats: Category[] = [];
          catSnap.forEach((d) => {
            cloudCats.push({ id: d.id, ...d.data() } as Category);
          });
          setCategories((prev) => {
            const map = new Map<string, Category>();
            prev.forEach((c) => map.set(c.id, c));
            cloudCats.forEach((c) => map.set(c.id, c));
            return Array.from(map.values());
          });
        }

        // 4. Live Firestore Buying Guides
        const guideSnap = await getDocs(collection(db, 'buying_guides'));
        if (!guideSnap.empty) {
          const cloudGuides: BuyingGuide[] = [];
          guideSnap.forEach((d) => {
            cloudGuides.push({ id: d.id, ...d.data() } as BuyingGuide);
          });
          setBuyingGuides((prev) => {
            const map = new Map<string, BuyingGuide>();
            prev.forEach((g) => map.set(g.id, g));
            cloudGuides.forEach((g) => map.set(g.id, g));
            return Array.from(map.values());
          });
        }
      } catch (fErr) {
        console.warn('[NIDPIK] Firestore real-time sync note:', fErr);
      }
    } catch (err) {
      console.warn('[NIDPIK] Backend bootstrap loaded fallback:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    refreshPublicData();
  }, [refreshPublicData]);

  // Verify Admin Session on Mount
  useEffect(() => {
    if (!adminToken) {
      return;
    }
    let cancelled = false;

    const clearSession = () => {
      if (cancelled) return;
      setAdminToken(null);
      setAdminUser(null);
      localStorage.removeItem('nidpik_admin_token');
      localStorage.removeItem('nidpik_admin_user');
    };

    api.auth.me()
      .then((res) => {
        if (!cancelled && res.user) {
          setAdminUser(res.user);
          localStorage.setItem('nidpik_admin_user', JSON.stringify(res.user));
        }
      })
      .catch(async (err) => {
        // Real API rejection (expired/invalid session): drop the session.
        if (!isApiUnavailable(err)) {
          clearSession();
          return;
        }
        // Backend unreachable (static hosting): keep the session only while
        // Firebase Authentication still reports an active sign-in.
        const stillSignedIn = await isFirebaseSessionActive();
        if (!stillSignedIn) {
          clearSession();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [adminToken]);

  // Sync route with browser history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Save wishlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nidpik_saved_products', JSON.stringify(savedProductIds));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }, [savedProductIds]);

  // Global keyboard shortcut: Cmd+K / Ctrl+K opens search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setSearchModalOpen(false);
        setAffiliateRedirect(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigate = (path: string, options: { replace?: boolean; scroll?: boolean } = { scroll: true }) => {
    if (options.replace) {
      window.history.replaceState({}, '', path);
    } else {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    if (options.scroll !== false) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleSaveProduct = (productId: string) => {
    setSavedProductIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const isProductSaved = (productId: string) => savedProductIds.includes(productId);

  const addToCompare = (productId: string) => {
    setCompareProductIds(prev => {
      if (prev.includes(productId)) return prev;
      if (prev.length >= 3) {
        return [...prev.slice(1), productId];
      }
      return [...prev, productId];
    });
  };

  const removeFromCompare = (productId: string) => {
    setCompareProductIds(prev => prev.filter(id => id !== productId));
  };

  const clearCompare = () => setCompareProductIds([]);

  const isProductInCompare = (productId: string) => compareProductIds.includes(productId);

  const triggerAffiliateClick = (product: Product, sourcePage?: string, ctaType?: string) => {
    // 1. Record analytics click beacon to backend
    api.analytics.trackClick({
      productId: product.id,
      merchantId: product.merchant.id,
      sourcePage: sourcePage || currentPath,
      ctaType: ctaType || 'check_price'
    });

    // 2. Open affiliate modal
    setAffiliateRedirect({
      isOpen: true,
      productName: product.name,
      merchantName: product.merchant.name,
      url: product.affiliateUrl
    });
  };

  const closeAffiliateModal = () => {
    setAffiliateRedirect(null);
  };

  // Content Lookups
  const getProductBySlug = useCallback((slug: string) => {
    return products.find(p => p.slug === slug || p.id === slug);
  }, [products]);

  const getCategoryBySlug = useCallback((slug: string) => {
    return categories.find(c => c.slug === slug || c.id === slug);
  }, [categories]);

  const getGuideBySlug = useCallback((slug: string) => {
    return buyingGuides.find(g => g.slug === slug || g.id === slug);
  }, [buyingGuides]);

  const getComparisonBySlug = useCallback((slug: string) => {
    return comparisons.find(c => c.slug === slug || c.id === slug);
  }, [comparisons]);

  const getReviewBySlug = useCallback((slug: string) => {
    return reviews.find(r => r.slug === slug || r.id === slug || r.productId === slug);
  }, [reviews]);

  const getArticleBySlug = useCallback((slug: string) => {
    return articles.find(a => a.slug === slug || a.id === slug);
  }, [articles]);

  const getProblemBySlug = useCallback((slug: string) => {
    return problemCollections.find(p => p.slug === slug || p.id === slug);
  }, [problemCollections]);

  const getBudgetTierByAmount = useCallback((amount: number) => {
    return budgetTiers.find(b => b.amount === amount);
  }, [budgetTiers]);

  const getBudgetTierBySlug = useCallback((slug: string) => {
    return budgetTiers.find(b => b.slug === slug);
  }, [budgetTiers]);

  const getAuthorById = useCallback((id: string) => {
    return authors.find(a => a.id === id);
  }, [authors]);

  // Admin Auth Handlers
  const applyAdminSession = (token: string, user: AdminUser) => {
    setAdminToken(token);
    setAdminUser(user);
    localStorage.setItem('nidpik_admin_token', token);
    localStorage.setItem('nidpik_admin_user', JSON.stringify(user));
  };

  const loginAdmin = async (credentials: { email: string; password: string }) => {
    // 1) Express backend session (dev / AI Studio, or hosting with an API wired).
    try {
      const res = await api.auth.login(credentials);
      if (res && typeof res.token === 'string' && res.token && res.user) {
        applyAdminSession(res.token, res.user);
        return;
      }
      // JSON arrived but no usable session — treat as backend unavailable.
      const malformed = new Error('Malformed login response from backend') as Error & {
        code: string;
      };
      malformed.code = 'API_UNAVAILABLE';
      throw malformed;
    } catch (err) {
      // A definitive API rejection (wrong password against a healthy API) is
      // surfaced as-is; only an unreachable/misrouted API falls through.
      if (!isApiUnavailable(err)) {
        throw err;
      }
    }

    // 2) Firebase Authentication fallback — the production path on static
    //    Firebase Hosting, where /api/* resolves to the SPA shell.
    const { token, user } = await firebaseAdminLogin(credentials.email, credentials.password);
    applyAdminSession(token, user as AdminUser);
  };

  const logoutAdmin = async () => {
    await firebaseAdminLogout();
    try {
      await api.auth.logout();
    } catch {
      // Continue client cleanup even if network fails
    }
    setAdminToken(null);
    setAdminUser(null);
    localStorage.removeItem('nidpik_admin_token');
    localStorage.removeItem('nidpik_admin_user');
    navigate('/admin/login');
  };

  const hasRole = useCallback((allowedRoles: Array<'OWNER' | 'ADMIN' | 'EDITOR'>) => {
    if (!adminUser) return false;
    return allowedRoles.includes(adminUser.role);
  }, [adminUser]);

  const updateLogoState = useCallback((newLogoUrl: string) => {
    setSettings(prev => ({
      ...prev,
      general: {
        ...(prev.general || {}),
        logoUrl: newLogoUrl
      }
    }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentPath,
        navigate,
        selectedCountry,
        setSelectedCountry,
        searchModalOpen,
        setSearchModalOpen,
        aiAdvisorOpen,
        setAiAdvisorOpen,
        initialAiPrompt,
        openAiAdvisorWithPrompt,
        savedProductIds,
        toggleSaveProduct,
        isProductSaved,
        compareProductIds,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isProductInCompare,
        affiliateRedirect,
        triggerAffiliateClick,
        closeAffiliateModal,

        // Live Database Content
        products,
        categories,
        buyingGuides,
        comparisons,
        reviews,
        articles,
        problemCollections,
        budgetTiers,
        merchants,
        authors,
        settings,
        isLoadingData,
        refreshPublicData,
        updateLogoState,

        // Lookups
        getProductBySlug,
        getCategoryBySlug,
        getGuideBySlug,
        getComparisonBySlug,
        getReviewBySlug,
        getArticleBySlug,
        getProblemBySlug,
        getBudgetTierByAmount,
        getBudgetTierBySlug,
        getAuthorById,

        // Currency & Localization
        formatPrice,
        getAffiliateUrl,

        // Admin Auth & RBAC
        adminUser,
        adminToken,
        isAdminAuthenticated: Boolean(adminToken && adminUser),
        loginAdmin,
        logoutAdmin,
        hasRole
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
