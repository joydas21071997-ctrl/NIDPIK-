import React, { useState } from 'react';
import { X, User, Mail, Lock, CheckCircle2, ShieldCheck, LogOut } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('nidpik_user_email');
  });

  if (!isOpen) return null;

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    localStorage.setItem('nidpik_user_email', email);
    setCurrentUser(email);
  };

  const handleLogout = () => {
    localStorage.removeItem('nidpik_user_email');
    setCurrentUser(null);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white text-left relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {currentUser ? 'My NIDPIK Account' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            {currentUser
              ? 'Manage your saved products & personalized recommendations'
              : 'Save favorite products, track price drops & access buying guides'}
          </p>
        </div>

        {/* Body */}
        <div className="p-5 text-left">
          {currentUser ? (
            <div className="space-y-4 py-2">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                  {currentUser.charAt(0).toUpperCase()}
                </div>
                <div className="truncate flex-1">
                  <span className="text-[10px] uppercase font-bold text-blue-600 block">Signed In</span>
                  <span className="text-xs font-semibold text-slate-800 truncate block">{currentUser}</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 space-y-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Sync wishlist across your devices</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Instant alerts on ₹ price drops</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2 px-3 border border-slate-300 hover:bg-slate-50 text-rose-600 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Demo quick sign-in */}
              <button
                type="button"
                onClick={() => {
                  setEmail('joyfulfilms21@gmail.com');
                  setPassword('demo1234');
                }}
                className="text-[11px] text-blue-600 hover:underline font-semibold block"
              >
                Use Quick Fill (joyfulfilms21@gmail.com)
              </button>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
              >
                {mode === 'login' ? 'Sign In' : 'Create Free Account'}
              </button>

              <div className="text-center pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                {mode === 'login' ? (
                  <>
                    New to NIDPIK?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Create account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
