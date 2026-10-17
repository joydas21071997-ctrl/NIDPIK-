import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[NIDPIK ErrorBoundary] Caught render error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Preview Recovery
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                NIDPIK encountered a temporary rendering issue. Click below to reload and restore normal preview.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950/60 p-3 rounded-xl text-left border border-slate-800">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block mb-1">
                  Diagnostics
                </span>
                <p className="text-xs font-mono text-rose-300 break-words line-clamp-3">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
