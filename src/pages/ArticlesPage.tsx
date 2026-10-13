import React from 'react';
import { useApp } from '../context/AppContext';
import { articles, getArticleBySlug, getAuthorById, getProductBySlug } from '../data';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { DisclosureBox } from '../components/DisclosureBox';
import { ProductCard } from '../components/ProductCard';
import { FileText, ArrowRight, Tag, Calendar } from 'lucide-react';

export const ArticlesPage: React.FC = () => {
  const { navigate } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs items={[{ label: 'Articles & Guides' }]} />

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Consumer Advice &amp; Guides
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl">
          Practical strategies on saving electricity, decluttering compact apartments, and making high-value investments for everyday Indian life.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((art) => (
          <div
            key={art.id}
            onClick={() => navigate(`/articles/${art.slug}`)}
            className="nidpik-card rounded-2xl overflow-hidden cursor-pointer group flex flex-col justify-between"
          >
            <div className="aspect-16/10 w-full overflow-hidden bg-slate-100">
              <img
                src={art.image}
                alt={art.title}
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
              />
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5 font-medium">
                  <span className="text-blue-600 font-semibold">{art.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{art.readingTime}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                  {art.title}
                </h3>
                <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                  {art.excerpt}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                <span>Read Full Article</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ArticleDetailPageProps {
  slug: string;
}

export const ArticleDetailPage: React.FC<ArticleDetailPageProps> = ({ slug }) => {
  const { navigate } = useApp();
  const article = getArticleBySlug(slug);

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Article Not Found</h1>
        <p className="text-slate-600 mb-6 text-sm">We couldn't locate this article.</p>
        <button
          onClick={() => navigate('/articles')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
        >
          View All Articles
        </button>
      </div>
    );
  }

  const author = getAuthorById(article.authorId);
  const recommendedProducts = (article.recommendedProductIds || [])
    .map((id) => getProductBySlug(id))
    .filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-left">
      <Breadcrumbs
        items={[
          { label: 'Articles', href: '/articles' },
          { label: article.category, href: `/category/${article.categorySlug}` },
          { label: article.title }
        ]}
      />

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
          <span>{article.category}</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>{article.readingTime}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {article.title}
        </h1>

        <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
          {article.excerpt}
        </p>

        <div className="flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="font-semibold text-slate-800">{author?.name || 'NIDPIK Editorial'}</span>
          <span aria-hidden="true">·</span>
          <span>Published {article.publishedAt}</span>
          <span aria-hidden="true">·</span>
          <span>Updated {article.updatedAt}</span>
        </div>
      </div>

      {/* HERO IMAGE */}
      <div className="rounded-3xl overflow-hidden shadow-xs border border-slate-200 aspect-16/9 bg-slate-100">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover"
        />
      </div>

      <DisclosureBox compact={true} />

      {/* ARTICLE BODY PROSE */}
      <div className="space-y-5 text-slate-800 text-base leading-relaxed">
        {article.content.map((paragraph, index) => (
          <p key={index} className="text-slate-700 leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      {/* RECOMMENDED PRODUCTS EMBED */}
      {recommendedProducts.length > 0 && (
        <div className="pt-8 border-t border-slate-200 space-y-4">
          <h2 className="text-xl font-bold text-slate-900">
            Recommended Products Mentioned in this Guide
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {recommendedProducts.map((p) => p && (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* TAGS */}
      <div className="pt-6 border-t border-slate-100 flex items-center flex-wrap gap-2 text-xs">
        <span className="font-semibold text-slate-400">Tags:</span>
        {article.tags.map((tag) => (
          <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md">
            #{tag}
          </span>
        ))}
      </div>

      {/* AUTHOR BIO */}
      {author && (
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-4">
          <img
            src={author.avatar}
            alt={author.name}
            className="w-12 h-12 rounded-full object-cover shrink-0"
          />
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Written By</span>
            <h4 className="text-sm font-bold text-slate-900">{author.name} · {author.role}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">{author.bio}</p>
          </div>
        </div>
      )}
    </div>
  );
};
