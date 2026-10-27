import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { ErrorBoundary } from './components/ErrorBoundary';

import { HomePage } from './pages/HomePage';
import { CategoryPage, CategoriesIndexPage } from './pages/CategoryPage';
import { ProductListingPage } from './pages/ProductListingPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { BudgetListingPage } from './pages/BudgetListingPage';
import { BuyingGuidesPage, BuyingGuideDetailPage } from './pages/BuyingGuidesPage';
import { ComparisonsPage, ComparisonDetailPage } from './pages/ComparisonsPage';
import { ReviewsPage, ReviewDetailPage } from './pages/ReviewsPage';
import { ArticlesPage, ArticleDetailPage } from './pages/ArticlesPage';
import { ProblemsPage, ProblemDetailPage } from './pages/ProblemsPage';
import { SearchResultsPage, SavedPicksPage } from './pages/SearchResultsPage';
import {
  AboutPage,
  EditorialPolicyPage,
  AffiliateDisclosurePage,
  HowWeChoosePage,
  ContactPage,
  PrivacyPolicyPage,
  TermsPage
} from './pages/LegalPages';

// Admin CMS Pages
import { AdminLoginPage } from './admin/pages/AdminLoginPage';
import { AdminDashboardPage } from './admin/pages/AdminDashboardPage';
import { AdminProductsPage } from './admin/pages/AdminProductsPage';
import { AdminProductEditPage } from './admin/pages/AdminProductEditPage';
import { AdminCategoriesPage } from './admin/pages/AdminCategoriesPage';
import { AdminArticlesPage } from './admin/pages/AdminArticlesPage';
import { AdminArticleEditPage } from './admin/pages/AdminArticleEditPage';
import { AdminGuidesPage } from './admin/pages/AdminGuidesPage';
import { AdminComparisonsPage } from './admin/pages/AdminComparisonsPage';
import { AdminReviewsPage } from './admin/pages/AdminReviewsPage';
import { AdminProblemsPage } from './admin/pages/AdminProblemsPage';
import { AdminBudgetsPage } from './admin/pages/AdminBudgetsPage';
import { AdminMerchantsPage } from './admin/pages/AdminMerchantsPage';
import { AdminAffiliateLinksPage } from './admin/pages/AdminAffiliateLinksPage';
import { AdminMediaPage } from './admin/pages/AdminMediaPage';
import { AdminAuthorsPage } from './admin/pages/AdminAuthorsPage';
import { AdminUsersPage } from './admin/pages/AdminUsersPage';
import { AdminAnalyticsPage } from './admin/pages/AdminAnalyticsPage';
import { AdminSeoPage } from './admin/pages/AdminSeoPage';
import { AdminSettingsPage } from './admin/pages/AdminSettingsPage';
import { AdminAuditLogsPage } from './admin/pages/AdminAuditLogsPage';
import { AdminSubscribersPage } from './admin/pages/AdminSubscribersPage';

const RouterView: React.FC = () => {
  const { currentPath, navigate, setSearchModalOpen, isAdminAuthenticated } = useApp();

  // Normalize path (strip query params and trailing slash)
  const path = currentPath.split('?')[0].replace(/\/+$/, '') || '/';

  // ==========================================
  // ADMIN CMS ROUTES (Strict Security Guard)
  // ==========================================
  if (path.startsWith('/admin')) {
    // If not authenticated or accessing login directly, render AdminLoginPage
    if (!isAdminAuthenticated) {
      return <AdminLoginPage />;
    }
    if (path === '/admin/login') {
      return <AdminDashboardPage />;
    }

    if (path === '/admin') {
      return <AdminDashboardPage />;
    }

  // Admin Products
  if (path === '/admin/products/new') {
    return <AdminProductEditPage />;
  }
  if (path.startsWith('/admin/products/')) {
    const id = path.replace('/admin/products/', '');
    return <AdminProductEditPage productId={id} />;
  }
  if (path === '/admin/products') {
    return <AdminProductsPage />;
  }

  // Admin Categories
  if (path === '/admin/categories') {
    return <AdminCategoriesPage />;
  }

  // Admin Articles
  if (path === '/admin/articles/new') {
    return <AdminArticleEditPage />;
  }
  if (path.startsWith('/admin/articles/')) {
    const id = path.replace('/admin/articles/', '');
    return <AdminArticleEditPage articleId={id} />;
  }
  if (path === '/admin/articles') {
    return <AdminArticlesPage />;
  }

  // Admin Other Content Types
  if (path === '/admin/guides') return <AdminGuidesPage />;
  if (path === '/admin/comparisons') return <AdminComparisonsPage />;
  if (path === '/admin/reviews') return <AdminReviewsPage />;
  if (path === '/admin/problems') return <AdminProblemsPage />;
  if (path === '/admin/budgets') return <AdminBudgetsPage />;
  if (path === '/admin/merchants') return <AdminMerchantsPage />;
  if (path === '/admin/affiliate-links') return <AdminAffiliateLinksPage />;
  if (path === '/admin/media') return <AdminMediaPage />;
  if (path === '/admin/authors') return <AdminAuthorsPage />;
  if (path === '/admin/subscribers') return <AdminSubscribersPage />;
  if (path === '/admin/users') return <AdminUsersPage />;
  if (path === '/admin/analytics') return <AdminAnalyticsPage />;
  if (path === '/admin/seo') return <AdminSeoPage />;
  if (path === '/admin/settings') return <AdminSettingsPage />;
  if (path === '/admin/audit-logs') return <AdminAuditLogsPage />;

    return <AdminDashboardPage />;
  }

  // ==========================================
  // PUBLIC WEBSITE ROUTES
  // ==========================================

  // 1. Home
  if (path === '/') {
    return <HomePage />;
  }

  // 2. Categories
  if (path === '/categories') {
    return <CategoriesIndexPage />;
  }
  if (path.startsWith('/category/')) {
    const slug = path.replace('/category/', '');
    return <CategoryPage slug={slug} />;
  }

  // 3. Products
  if (path === '/products') {
    return <ProductListingPage />;
  }
  if (path.startsWith('/product/')) {
    const slug = path.replace('/product/', '');
    return <ProductDetailPage slug={slug} />;
  }

  // 4. Budget Pages starting from ₹99
  if (path.startsWith('/best-under-')) {
    const slug = path.replace('/', '');
    return <BudgetListingPage slug={slug} />;
  }

  // 5. Buying Guides
  if (path === '/buying-guides') {
    return <BuyingGuidesPage />;
  }
  if (path.startsWith('/buying-guides/')) {
    const slug = path.replace('/buying-guides/', '');
    return <BuyingGuideDetailPage slug={slug} />;
  }

  // 6. Comparisons
  if (path === '/compare') {
    return <ComparisonsPage />;
  }
  if (path.startsWith('/compare/')) {
    const slug = path.replace('/compare/', '');
    return <ComparisonDetailPage slug={slug} />;
  }

  // 7. Reviews
  if (path === '/reviews') {
    return <ReviewsPage />;
  }
  if (path.startsWith('/reviews/')) {
    const slug = path.replace('/reviews/', '');
    return <ReviewDetailPage slug={slug} />;
  }

  // 8. Articles & Blog
  if (path === '/articles' || path === '/blog') {
    return <ArticlesPage />;
  }
  if (path.startsWith('/articles/')) {
    const slug = path.replace('/articles/', '');
    return <ArticleDetailPage slug={slug} />;
  }
  if (path.startsWith('/blog/')) {
    const slug = path.replace('/blog/', '');
    return <ArticleDetailPage slug={slug} />;
  }

  // 9. Problem-Based Discovery
  if (path === '/problems') {
    return <ProblemsPage />;
  }
  if (path.startsWith('/problems/')) {
    const slug = path.replace('/problems/', '');
    return <ProblemDetailPage slug={slug} />;
  }

  // 10. Search & Wishlist
  if (path === '/search') {
    return <SearchResultsPage />;
  }
  if (path === '/saved') {
    return <SavedPicksPage />;
  }

  // 11. Legal & Trust Pages
  if (path === '/about') return <AboutPage />;
  if (path === '/editorial-policy') return <EditorialPolicyPage />;
  if (path === '/affiliate-disclosure') return <AffiliateDisclosurePage />;
  if (path === '/how-we-choose') return <HowWeChoosePage />;
  if (path === '/contact') return <ContactPage />;
  if (path === '/privacy') return <PrivacyPolicyPage />;
  if (path === '/terms') return <TermsPage />;

  // Default fallback: 404 Page Not Found
  return (
    <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto text-2xl font-black">
        404
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
        Page Not Found
      </h1>
      <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
        The link you followed may have been updated, or the product has moved to another budget collection.
      </p>
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Return to NIDPIK Home
        </button>
        <button
          onClick={() => setSearchModalOpen(true)}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
        >
          Search Products
        </button>
      </div>
    </div>
  );
};

const AppShell: React.FC = () => {
  const { currentPath } = useApp();
  const isAdminRoute = currentPath.startsWith('/admin');

  // If in admin console, render pure admin layout without public headers/footers
  if (isAdminRoute) {
    return <RouterView />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden w-full max-w-full">
      <Header />
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        <RouterView />
      </main>
      <Footer />
      <SearchModal />
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
