import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { articles, getArticleBySlug, getAuthorById, getProductBySlug } from '../data';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { DisclosureBox } from '../components/DisclosureBox';
import { ProductCard } from '../components/ProductCard';
import { FileText, ArrowRight, ArrowLeft, Tag, Calendar, Search, Clock, RotateCcw, Share2, Check, Copy, MessageCircle, Twitter, CheckCircle2 } from 'lucide-react';

export const ArticlesPage: React.FC = () => {
  const { navigate, articles: contextArticles } = useApp();
  const allArticles = contextArticles && contextArticles.length > 0 ? contextArticles : articles;

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(6);

  // Dynamic categories from all active articles
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    allArticles.forEach((art) => {
      if (art.category) set.add(art.category);
    });
    return ['All', ...Array.from(set)];
  }, [allArticles]);

  // Filtered articles based on category and search query
  const filteredArticles = useMemo(() => {
    return allArticles.filter((art) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        art.category.toLowerCase() === selectedCategory.toLowerCase() ||
        art.categorySlug === selectedCategory.toLowerCase();
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        art.title.toLowerCase().includes(query) ||
        art.excerpt.toLowerCase().includes(query) ||
        (art.tags && art.tags.some((t) => t.toLowerCase().includes(query)));
      return matchesCategory && matchesSearch;
    });
  }, [allArticles, selectedCategory, searchQuery]);

  const displayedArticles = filteredArticles.slice(0, visibleCount);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-8 overflow-hidden">
      <Breadcrumbs items={[{ label: 'Articles & Guides' }]} />

      {/* Hero / Header banner */}
      <div className="space-y-1.5 sm:space-y-2">
        <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 sm:py-1 rounded-md">
          <FileText className="w-3 h-3 text-blue-600" />
          <span>Consumer Advice &amp; Guides</span>
        </div>
        <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Practical Advice for Indian Consumers
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Tested strategies on saving electricity, decluttering compact apartments, and making high-value investments for everyday Indian life.
        </p>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="space-y-3 bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs">
        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(6);
            }}
            placeholder="Search articles by title, topic, or keyword..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills (horizontal swipe on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 hidden sm:inline mr-1">
            Category:
          </span>
          {availableCategories.map((cat) => {
            const count =
              cat === 'All'
                ? allArticles.length
                : allArticles.filter(
                    (a) =>
                      a.category.toLowerCase() === cat.toLowerCase() ||
                      a.categorySlug === cat.toLowerCase()
                  ).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setVisibleCount(6);
                }}
                className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg transition-colors shrink-0 whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1 py-0.2 rounded-full ${
                    isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Articles Count & Status */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
        <span>
          Showing <strong className="text-slate-800">{displayedArticles.length}</strong> of{' '}
          <strong className="text-slate-800">{filteredArticles.length}</strong> articles
          {selectedCategory !== 'All' && <span> in <em>{selectedCategory}</em></span>}
          {searchQuery && <span> matching "<em>{searchQuery}</em>"</span>}
        </span>
        {(selectedCategory !== 'All' || searchQuery) && (
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* Compact Responsive Articles Grid:
          - Mobile: Compact horizontal card (~90-100px height) fitting 4-5 previews on a mobile screen
          - Tablet: 2-column grid
          - Desktop: 3-column grid
      */}
      {displayedArticles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-5">
          {displayedArticles.map((art) => (
            <div
              key={art.id}
              onClick={() => navigate(`/articles/${art.slug}`)}
              className="nidpik-card rounded-xl sm:rounded-2xl p-2.5 sm:p-4 cursor-pointer group flex flex-row sm:flex-col gap-2.5 sm:gap-3.5 items-center sm:items-stretch justify-between transition-all hover:shadow-md border border-slate-200 hover:border-blue-400 bg-white"
            >
              {/* Thumbnail */}
              <div className="w-20 h-20 min-w-[5rem] xs:w-24 xs:h-24 xs:min-w-[6rem] sm:w-full sm:aspect-16/10 rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                <img
                  src={art.image}
                  alt={art.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Content Body */}
              <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 mb-1 font-medium truncate">
                    <span className="text-blue-600 font-bold uppercase tracking-wider shrink-0">
                      {art.category}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="shrink-0 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 inline" />
                      {art.readingTime}
                    </span>
                    {art.publishedAt && (
                      <>
                        <span aria-hidden="true" className="text-slate-300 hidden xs:inline">·</span>
                        <span className="hidden xs:inline text-slate-400 truncate">
                          {art.publishedAt}
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="text-xs sm:text-sm lg:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug break-words">
                    {art.title}
                  </h3>

                  <p className="text-[11px] sm:text-xs text-slate-500 mt-1 line-clamp-2 hidden sm:block leading-relaxed">
                    {art.excerpt}
                  </p>
                </div>

                <div className="mt-1.5 sm:mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] sm:text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                  <span>Read Article</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 rounded-2xl p-8 sm:p-12 text-center text-slate-500 border border-slate-200 space-y-3">
          <FileText className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm sm:text-base font-bold text-slate-800">
            No articles found matching your criteria
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search terms or select "All" categories to view all published guides.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Load More Button for Pagination */}
      {visibleCount < filteredArticles.length && (
        <div className="pt-2 text-center">
          <button
            onClick={() => setVisibleCount((prev) => prev + 6)}
            className="px-5 py-2.5 bg-white border border-slate-300 hover:border-blue-600 text-slate-800 hover:text-blue-600 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
          >
            Load More Articles ({filteredArticles.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
};

interface ArticleDetailPageProps {
  slug: string;
}

export const ArticleDetailPage: React.FC<ArticleDetailPageProps> = ({ slug }) => {
  const {
    navigate,
    articles: contextArticles,
    products: contextProducts,
    authors: contextAuthors
  } = useApp();

  const [copiedLink, setCopiedLink] = useState(false);

  const allArticles = contextArticles && contextArticles.length > 0 ? contextArticles : articles;
  const article = allArticles.find((a) => a.slug === slug) || getArticleBySlug(slug);

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto text-xl font-bold">
          404
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Article Not Found</h1>
        <p className="text-slate-600 text-xs sm:text-sm max-w-sm mx-auto">
          We couldn't locate this consumer guide. It may have moved or been updated.
        </p>
        <button
          onClick={() => navigate('/articles')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
        >
          View All Consumer Articles
        </button>
      </div>
    );
  }

  const allAuthors = contextAuthors && contextAuthors.length > 0 ? contextAuthors : [];
  const author = allAuthors.find((a) => a.id === article.authorId) || getAuthorById(article.authorId);

  const allProducts = contextProducts && contextProducts.length > 0 ? contextProducts : [];
  const recommendedProducts = (article.recommendedProductIds || [])
    .map((id) => allProducts.find((p) => p.id === id || p.slug === id) || getProductBySlug(id))
    .filter(Boolean);

  const relatedArticles = allArticles
    .filter((a) => a.slug !== article.slug && (a.categorySlug === article.categorySlug || a.category === article.category))
    .slice(0, 3);

  const handleShare = async (platform: 'whatsapp' | 'twitter' | 'native' | 'copy') => {
    const currentUrl = window.location.href;
    const shareText = `${article.title} - Read on NIDPIK`;

    if (platform === 'native' && typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: currentUrl,
        });
        return;
      } catch {
        // Fallback to copy link if user dismisses or native share fails
      }
    }

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ': ' + currentUrl)}`, '_blank');
      return;
    }

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`, '_blank');
      return;
    }

    if (platform === 'copy' || platform === 'native') {
      try {
        await navigator.clipboard.writeText(currentUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } catch {
        // clipboard fallback
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 overflow-hidden text-left">
      {/* BREADCRUMBS */}
      <Breadcrumbs
        items={[
          { label: 'Articles', href: '/articles' },
          { label: article.category, href: `/category/${article.categorySlug}` },
          { label: article.title }
        ]}
      />

      {/* HEADER SECTION */}
      <header className="space-y-3 sm:space-y-4">
        {/* Category Pill & Reading Time */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-semibold">
          <button
            onClick={() => navigate(`/category/${article.categorySlug}`)}
            className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md uppercase tracking-wider transition-colors cursor-pointer"
          >
            {article.category}
          </button>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="text-slate-500 flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3 text-slate-400" />
            {article.readingTime}
          </span>
        </div>

        {/* Article Title */}
        <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug sm:leading-tight break-words">
          {article.title}
        </h1>

        {/* Lead Excerpt */}
        <p className="text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed font-normal">
          {article.excerpt}
        </p>

        {/* Author & Publication Metadata Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 pb-3 border-y border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2.5">
            {author?.avatar ? (
              <img
                src={author.avatar}
                alt={author.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                {author?.name ? author.name.charAt(0) : 'N'}
              </div>
            )}
            <div className="min-w-0">
              <span className="font-semibold text-slate-900 block truncate">
                {author?.name || 'NIDPIK Editorial Team'}
              </span>
              <span className="text-[11px] text-slate-400 block truncate">
                Published {article.publishedAt} · Updated {article.updatedAt}
              </span>
            </div>
          </div>

          {/* Social Share Controls */}
          <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden xs:inline">Share:</span>
            <button
              onClick={() => handleShare('whatsapp')}
              aria-label="Share on WhatsApp"
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Share on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={() => handleShare('twitter')}
              aria-label="Share on X (Twitter)"
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Share on X"
            >
              <Twitter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">X / Post</span>
            </button>
            <button
              onClick={() => handleShare('copy')}
              aria-label="Copy Article Link"
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Copy Link"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* HERO IMAGE */}
      <figure className="space-y-2">
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xs border border-slate-200 aspect-16/9 sm:aspect-16/10 bg-slate-100 relative">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      </figure>

      {/* EDITORIAL DISCLOSURE */}
      <DisclosureBox compact={true} />

      {/* ARTICLE BODY PROSE */}
      <article className="space-y-4 sm:space-y-5 text-slate-800 text-[15px] sm:text-base leading-relaxed sm:leading-7">
        {article.content.map((paragraph, index) => {
          // If paragraph begins with check/tip/step, style as a callout card
          const isCallout =
            paragraph.startsWith('Check #') ||
            paragraph.startsWith('Critical tip:') ||
            paragraph.startsWith('Tip:') ||
            paragraph.startsWith('Pro Tip:');

          if (isCallout) {
            return (
              <div
                key={index}
                className="p-3.5 sm:p-4 bg-blue-50/60 rounded-xl sm:rounded-2xl border border-blue-200/80 text-slate-800 text-xs sm:text-sm leading-relaxed"
              >
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>{paragraph}</div>
                </div>
              </div>
            );
          }

          return (
            <p key={index} className="text-slate-700 leading-relaxed sm:leading-7">
              {paragraph}
            </p>
          );
        })}
      </article>

      {/* RECOMMENDED PRODUCTS EMBED */}
      {recommendedProducts.length > 0 && (
        <section className="pt-6 sm:pt-8 border-t border-slate-200 space-y-3 sm:space-y-4">
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">
              Tested Recommendations
            </div>
            <h2 className="text-base sm:text-xl font-bold text-slate-900">
              Recommended Products Mentioned in this Guide
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Handpicked and tested for Indian households with live INR prices.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
            {recommendedProducts.map((p) => p && (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* TAGS */}
      <div className="pt-5 border-t border-slate-100 flex items-center flex-wrap gap-1.5 text-xs">
        <span className="font-semibold text-slate-400 mr-1 flex items-center gap-1">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          Tags:
        </span>
        {article.tags.map((tag) => (
          <button
            key={tag}
            onClick={() => navigate('/articles')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
          >
            #{tag}
          </button>
        ))}
      </div>

      {/* AUTHOR BIO CARD */}
      {author && (
        <div className="p-4 sm:p-6 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-4">
          <img
            src={author.avatar}
            alt={author.name}
            className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-300"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Written By
              </span>
              <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.2 rounded-md">
                Verified Expert
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">{author.name} · {author.role}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">{author.bio}</p>
          </div>
        </div>
      )}

      {/* RELATED ARTICLES SECTION */}
      {relatedArticles.length > 0 && (
        <section className="pt-6 sm:pt-8 border-t border-slate-200 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>More Guides &amp; Articles You Might Like</span>
            </h3>
            <button
              onClick={() => navigate('/articles')}
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              All Articles →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
            {relatedArticles.map((art) => (
              <div
                key={art.id}
                onClick={() => {
                  navigate(`/articles/${art.slug}`);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="nidpik-card rounded-xl sm:rounded-2xl p-2.5 sm:p-4 cursor-pointer group flex flex-row sm:flex-col gap-2.5 sm:gap-3.5 items-center sm:items-stretch justify-between transition-all hover:shadow-md border border-slate-200 hover:border-blue-400 bg-white"
              >
                <div className="w-20 h-20 min-w-[5rem] xs:w-24 xs:h-24 xs:min-w-[6rem] sm:w-full sm:aspect-16/10 rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                  <img
                    src={art.image}
                    alt={art.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 mb-1 font-medium truncate">
                      <span className="text-blue-600 font-bold uppercase tracking-wider shrink-0">
                        {art.category}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="shrink-0">{art.readingTime}</span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug break-words">
                      {art.title}
                    </h4>
                  </div>

                  <div className="mt-1.5 sm:mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-blue-600 group-hover:text-blue-700">
                    <span>Read Guide</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BOTTOM NAVIGATION: Back to Articles */}
      <div className="pt-4 sm:pt-6 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={() => navigate('/articles')}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Consumer Articles &amp; Guides</span>
        </button>
      </div>
    </div>
  );
};
