import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../../components/Logo';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { loginAdmin, navigate, isAdminAuthenticated } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to /admin
  if (isAdminAuthenticated) {
    navigate('/admin');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginAdmin({ email, password });
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 space-y-6 border border-slate-200">
        
        {/* LOGO & HEADING */}
        <div className="text-center space-y-2">
          <div className="inline-block p-1">
            <Logo size="md" showTagline={false} />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            NIDPIK Admin CMS
          </h1>
          <p className="text-xs text-slate-500">
            Sign in with administrative privileges to manage products, buying guides, and affiliate feeds.
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@nidpik.in"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign in to Admin Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* DEMO / QUICK FILL CREDENTIALS HINT */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Pre-Configured Demo Accounts:</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => fillCredentials('admin@nidpik.in', 'admin')}
              className="p-1.5 bg-white border border-slate-200 hover:border-blue-400 rounded-lg text-left transition-colors"
            >
              <span className="block font-bold text-slate-900 text-[11px]">Owner</span>
              <span className="block font-mono text-[9px] text-slate-500 truncate">admin@nidpik.in</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('manager@nidpik.in', 'manager')}
              className="p-1.5 bg-white border border-slate-200 hover:border-blue-400 rounded-lg text-left transition-colors"
            >
              <span className="block font-bold text-slate-900 text-[11px]">Admin</span>
              <span className="block font-mono text-[9px] text-slate-500 truncate">manager@nidpik.in</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('editor@nidpik.in', 'editor')}
              className="p-1.5 bg-white border border-slate-200 hover:border-blue-400 rounded-lg text-left transition-colors"
            >
              <span className="block font-bold text-slate-900 text-[11px]">Editor</span>
              <span className="block font-mono text-[9px] text-slate-500 truncate">editor@nidpik.in</span>
            </button>
          </div>
        </div>

        {/* BACK TO SITE LINK */}
        <div className="text-center pt-2 border-t border-slate-100">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            className="text-xs text-slate-500 hover:text-blue-600 transition-colors"
          >
            ← Back to Public Website
          </a>
        </div>
      </div>
    </div>
  );
};
