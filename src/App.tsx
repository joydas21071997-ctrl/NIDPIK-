import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { CompareTray } from './components/CompareTray';
import { AffiliateModal } from './components/AffiliateModal';
import { AiAdvisorModal } from './components/AiAdvisorModal';

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

const RouterView: React.FC = () => {
  const { currentPath } = useApp();

  // Normalize path (strip query params and trailing slash)
  const path = currentPath.split('?')[0].replace(/\/+$/, '') || '/';

  // ==========================================
  // ADMIN CMS ROUTES
  // ==========================================
  if (path === '/admin/login') {
    return <AdminLoginPage />;
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
  if (path === '/admin/users') return <AdminUsersPage />;
  if (path === '/admin/analytics') return <AdminAnalyticsPage />;
  if (path === '/admin/seo') return <AdminSeoPage />;
  if (path === '/admin/settings') return <AdminSettingsPage />;
  if (path === '/admin/audit-logs') return <AdminAuditLogsPage />;

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

  // 8. Articles
  if (path === '/articles') {
    return <ArticlesPage />;
  }
  if (path.startsWith('/articles/')) {
    const slug = path.replace('/articles/', '');
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

  // Default fallback: 404
  return (
    <div className="max-w-4xl mx-auto py-24 px-4 text-center space-y-4">
      <h1 className="text-3xl font-extrabold text-slate-900">Page Not Found</h1>
      <p className="text-sm text-slate-600">The link you followed might be outdated or invalid.</p>
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault();
          window.history.pushState({}, '', '/');
          window.location.reload();
        }}
        className="inline-block px-5 py-2.5 bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-xs"
      >
        Return to NIDPIK Home
      </a>
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
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      <Header />
      <main className="flex-1">
        <RouterView />
      </main>
      <Footer />
      <CompareTray />
      <SearchModal />
      <AiAdvisorModal />
      <AffiliateModal />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

export default App;
