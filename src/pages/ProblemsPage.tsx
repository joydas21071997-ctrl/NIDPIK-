import React from 'react';
import { useApp } from '../context/AppContext';
import { problemCollections, getProblemBySlug, getProductBySlug } from '../data';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { DisclosureBox } from '../components/DisclosureBox';
import { ProductCard } from '../components/ProductCard';
import { Zap, ArrowRight, CheckCircle2, User, Sparkles } from 'lucide-react';

export const ProblemsPage: React.FC = () => {
  const { navigate } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs items={[{ label: 'Problem-Based Discovery' }]} />

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
          <Zap className="w-3.5 h-3.5" />
          Need → Discover → Compare → Pick Right
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Problem-First Product Discovery
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl">
          NIDPIK is designed around what you actually need to solve: whether that's fitting daily cooking into a tiny studio kitchen, curing WFH neck fatigue, or saving on airline baggage penalties.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {problemCollections.map((problem) => (
          <div
            key={problem.id}
            onClick={() => navigate(`/problems/${problem.slug}`)}
            className="nidpik-card rounded-2xl overflow-hidden cursor-pointer group flex flex-col justify-between"
          >
            <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100">
              <img
                src={problem.image}
                alt={problem.title}
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <span className="text-[10px] uppercase font-bold text-blue-300 tracking-wider">
                  Target Need
                </span>
                <h3 className="text-base font-bold text-white leading-snug">
                  {problem.title}
                </h3>
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {problem.tagline}
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                <span>View Solutions ({problem.productIds.length} picks)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ProblemDetailPageProps {
  slug: string;
}

export const ProblemDetailPage: React.FC<ProblemDetailPageProps> = ({ slug }) => {
  const { navigate } = useApp();
  const problem = getProblemBySlug(slug);

  if (!problem) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Collection Not Found</h1>
        <p className="text-slate-600 mb-6 text-sm">We couldn't locate this problem collection.</p>
        <button
          onClick={() => navigate('/problems')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
        >
          View All Problem Collections
        </button>
      </div>
    );
  }

  const solutionProducts = problem.productIds
    .map((id) => getProductBySlug(id))
    .filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-left">
      <Breadcrumbs
        items={[
          { label: 'Problem Discovery', href: '/problems' },
          { label: problem.title }
        ]}
      />

      {/* HERO BANNER */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
          <Zap className="w-3.5 h-3.5" />
          Need Solution Guide
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {problem.title}
        </h1>

        <p className="text-slate-600 text-base max-w-3xl leading-relaxed">
          {problem.description}
        </p>

        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong className="text-slate-900">Best for:</strong> {problem.targetUser}
          </span>
        </div>
      </div>

      <DisclosureBox compact={true} />

      {/* KEY ADVICE STRIP */}
      {problem.adviceTips && problem.adviceTips.length > 0 && (
        <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Core Strategy &amp; Principles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700">
            {problem.adviceTips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-white p-3 rounded-xl border border-blue-100/60 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECOMMENDED PRODUCTS */}
      <div>
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Verified Problem Solvers
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tested gear to resolve this need
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {solutionProducts.map((p) => p && (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
};
