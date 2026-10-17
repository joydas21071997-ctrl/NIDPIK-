import React, { useState } from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ShieldCheck, CheckCircle2, Mail, Send, Award, HeartHandshake, Eye } from 'lucide-react';
import { authors } from '../data/authors';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-left">
      <Breadcrumbs items={[{ label: 'About NIDPIK' }]} />

      <div className="space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
          Brand Story &amp; Purpose
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          About NIDPIK
        </h1>
        <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
          NIDPIK comes from two simple words: <strong className="text-slate-900">NEED + PICK</strong>. Our mission is simple: help shoppers worldwide cut through online marketing hype and discover the right product for their actual daily need.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-xl font-bold text-slate-900">Why NIDPIK Exists</h2>
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            Online shopping has exploded globally, but so has consumer confusion. E-commerce platforms are flooded with hundreds of unverified white-label products, fake ratings, sponsored search rankings, and superficial specifications that don't reveal how a product actually behaves in real life.
          </p>
          <p>
            An electric kettle or gadget that works great in one climate might fail in another. A pair of wireless earbuds might sound decent in a quiet studio but fail completely in a noisy commute.
          </p>
          <p>
            NIDPIK was founded to solve this problem from a <strong className="text-slate-900">global perspective</strong>: testing for real-world durability, component quality, voltage/power standards, and practical budget value starting right from basic entry thresholds.
          </p>
        </div>
      </div>

      {/* CORE PHILOSOPHY */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-3xl p-6 sm:p-8 border border-blue-100 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">The NIDPIK Philosophy</h2>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left py-4">
          <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-2xs flex-1">
            <span className="text-xs font-bold text-blue-600 block">STEP 1</span>
            <span className="text-base font-extrabold text-slate-900">NEED</span>
            <p className="text-xs text-slate-500 mt-1">Identify the real problem</p>
          </div>
          <span className="text-blue-400 font-bold hidden sm:inline">→</span>
          <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-2xs flex-1">
            <span className="text-xs font-bold text-blue-600 block">STEP 2</span>
            <span className="text-base font-extrabold text-slate-900">DISCOVER</span>
            <p className="text-xs text-slate-500 mt-1">Filter verified candidates</p>
          </div>
          <span className="text-blue-400 font-bold hidden sm:inline">→</span>
          <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-2xs flex-1">
            <span className="text-xs font-bold text-blue-600 block">STEP 3</span>
            <span className="text-base font-extrabold text-slate-900">COMPARE</span>
            <p className="text-xs text-slate-500 mt-1">Inspect trade-offs</p>
          </div>
          <span className="text-blue-400 font-bold hidden sm:inline">→</span>
          <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-2xs flex-1">
            <span className="text-xs font-bold text-blue-600 block">STEP 4</span>
            <span className="text-base font-extrabold text-slate-900">PICK RIGHT</span>
            <p className="text-xs text-slate-500 mt-1">Buy with confidence</p>
          </div>
        </div>
      </div>

      {/* EDITORIAL TEAM */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Meet Our Editorial Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {authors.map((author) => (
            <div key={author.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-start gap-4">
              <img
                src={author.avatar}
                alt={author.name}
                className="w-14 h-14 rounded-full object-cover shrink-0"
              />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">{author.name}</h3>
                <span className="text-xs font-semibold text-blue-600 block">{author.role}</span>
                <p className="text-xs text-slate-600 leading-relaxed">{author.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const EditorialPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-left">
      <Breadcrumbs items={[{ label: 'Editorial Policy' }]} />

      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          NIDPIK Editorial Policy
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Our standards of independence, research rigor, and consumer trust worldwide.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 text-sm text-slate-700 leading-relaxed">
        <div className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            1. Total Editorial Independence
          </h2>
          <p>
            Our writers, editors, and testing researchers operate strictly independently of affiliate marketing or business relationships. Brands cannot pay for positive reviews, top-spot rankings, or inclusion in our buying guides.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            2. Zero Fabricated Claims or Reviews
          </h2>
          <p>
            We strictly prohibit fake customer quotes, invented review counts, artificial rating badges, and deceptive countdown timers. When sample or demo data is utilized in our prototype environment, it is clearly distinguished from factual verifications.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            3. Price Accuracy &amp; Transparency
          </h2>
          <p>
            Because third-party merchant prices fluctuate frequently during promotional festival sales across regional Amazon and partner stores, we prominently display "Last Checked" timestamps. We urge consumers to verify the final price on the checkout page before completing their order.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            4. Corrections &amp; Updates
          </h2>
          <p>
            Product specifications change when manufacturers silently refresh internal hardware components. If you notice any factual discrepancy in our guides, our editorial team promptly audits and updates the article within 48 hours of verification.
          </p>
        </div>
      </div>
    </div>
  );
};

export const AffiliateDisclosurePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-left">
      <Breadcrumbs items={[{ label: 'Affiliate Disclosure' }]} />

      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Affiliate Disclosure
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Complete transparency about how NIDPIK sustains its global research and operations.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 text-sm text-slate-700 leading-relaxed">
        <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-800 leading-relaxed">
            <strong className="block text-sm mb-1 text-blue-900 font-bold">The Core Rule:</strong>
            You never pay a single extra amount when purchasing through a NIDPIK link. The retail price you pay on regional Amazon, Walmart, or partner stores is identical whether you visit directly or click through our guide.
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900">How It Works</h2>
          <p>
            NIDPIK is a participant in affiliate marketing programs, including the Amazon Associates Program and global partner affiliate networks. These programs provide a means for independent publishers to earn advertising fees by linking to official merchant websites.
          </p>
          <p className="bg-slate-50 border-l-4 border-amber-500 p-3 rounded-r-xl text-xs text-slate-800">
            <strong>Affiliate Statement:</strong> As an Amazon Associate, NIDPIK earns from qualifying purchases. Product prices, discounts, and availability are accurate as of the date/time indicated and are subject to change by regional merchants.
          </p>
          <p>
            When you click a "Check Price" or "View on Store" button on NIDPIK and make a purchase on that merchant site within a specified cookie window, the merchant pays NIDPIK a small referral commission at zero additional cost to you.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900">Why This Model Protects You</h2>
          <p>
            If a reader buys a product recommended by NIDPIK and subsequently returns it because it was shoddy or misdescribed, the merchant clawbacks the referral commission. This incentive structure ensures our financial success is strictly aligned with recommending products you actually love and keep.
          </p>
        </div>
      </div>
    </div>
  );
};

export const HowWeChoosePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-left">
      <Breadcrumbs items={[{ label: 'How We Choose' }]} />

      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How We Choose &amp; Test Products
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Our rigorous multi-stage research and verification methodology for global shoppers.
        </p>
      </div>

      <div className="space-y-6">
        {[
          {
            step: '01',
            title: 'Identify the Real Consumer Need',
            desc: 'We start with problems, not marketing catalogs. We survey urban households, students, and remote professionals to define what actually breaks down or causes daily friction.'
          },
          {
            step: '02',
            title: 'Technical Specifications Audit',
            desc: 'We verify manufacturer claims against real component sheets: build materials, battery capacity in milliamp-hours, driver diaphragm coatings, and power draw.'
          },
          {
            step: '03',
            title: 'Real-World Environmental Testing',
            desc: 'We assess how gear survives rigorous daily use, temperature variations, climate humidity, and long-term mechanical stress.'
          },
          {
            step: '04',
            title: 'Price-to-Utility Ratio',
            desc: 'We calculate value per dollar/currency spent. A durable budget pick that lasts years scores higher than an expensive delicate branded item.'
          },
          {
            step: '05',
            title: 'Merchant & Warranty Support Check',
            desc: 'We ensure recommended brands have functional warranty service centers or reliable return policies across supported global regions.'
          }
        ].map((item) => (
          <div key={item.step} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex items-start gap-4">
            <span className="text-xl font-mono font-extrabold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl shrink-0">
              {item.step}
            </span>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-left">
      <Breadcrumbs items={[{ label: 'Contact Us' }]} />

      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Contact NIDPIK
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Have a product correction, partnership inquiry, or suggestions for our next buying guide?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          {submitted ? (
            <div className="p-6 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold">Message Received</h3>
              <p className="text-xs text-slate-600">
                Thank you, {name}. Our editorial team will review your note within 1–2 business days.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Message or Suggestion</label>
                <textarea
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you'd like to share or suggest..."
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Send Message</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        <div className="md:col-span-5 space-y-6">
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-3 text-xs text-slate-600">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              Direct Editorial Inquiries
            </h3>
            <p>
              For urgent factual corrections on product guides:
            </p>
            <div className="font-mono text-xs text-blue-700 font-semibold bg-white p-2 rounded-lg border border-slate-200">
              hello@nidpik.com
            </div>
            <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
              Please include the specific article or product URL in your message.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left">
      <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />
      <h1 className="text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <p>
          Last updated: October 2026. NIDPIK respects your privacy. We do not sell or rent personal information to third parties.
        </p>
        <h2 className="text-base font-bold text-slate-900">Information We Collect</h2>
        <p>
          We only collect email addresses when you voluntarily subscribe to our newsletter. We use anonymous session analytics to determine which product guides and budget tiers are most helpful to readers worldwide.
        </p>
        <h2 className="text-base font-bold text-slate-900">Cookies &amp; Affiliate Tracking</h2>
        <p>
          When you click a merchant affiliate link (such as Amazon or partner stores), the merchant places a cookie on your device to attribute any qualifying purchase. These cookies are governed by the merchant's respective privacy policies.
        </p>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left">
      <Breadcrumbs items={[{ label: 'Terms & Conditions' }]} />
      <h1 className="text-3xl font-extrabold text-slate-900">Terms &amp; Conditions</h1>
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <p>
          Welcome to NIDPIK. By accessing this platform, you agree to these terms and conditions.
        </p>
        <h2 className="text-base font-bold text-slate-900">Not a Retailer</h2>
        <p>
          NIDPIK is an informational discovery and review media platform. We do not manufacture, package, warranty, or ship products. All purchases occur directly on third-party merchant platforms subject to their respective terms.
        </p>
        <h2 className="text-base font-bold text-slate-900">Accuracy of Information</h2>
        <p>
          While we strive for extreme diligence in all specifications, prices and product availability are controlled exclusively by merchants and are subject to immediate changes across supported global markets.
        </p>
      </div>
    </div>
  );
};
