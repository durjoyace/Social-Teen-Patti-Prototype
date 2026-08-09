import { Component, type ErrorInfo, type ReactNode } from 'react';
import { errorTracker } from '../services/errorTracking';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    errorTracker.captureError(error, { extra: { component_stack: errorInfo.componentStack } });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <main className="flex h-full flex-col items-center justify-center bg-[#07110E] p-8 text-[#F6ECD8]">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#B74035]/35 bg-[#2A1714]">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="font-display text-2xl font-bold">The table needs a fresh deal.</h1>
          <p className="mb-6 mt-2 max-w-sm text-center text-sm leading-6 text-[#8E9C94]">
            Refresh to reconnect. If a hand was in progress, we’ll restore the latest server state.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-[#E8B04A] px-6 py-3 font-bold text-[#171006] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFF9ED]"
          >
            Refresh and reconnect
          </button>
          {import.meta.env.DEV && this.state.error && (
            <p className="mt-4 max-w-xs break-all text-center font-mono text-xs text-white/25">
              {this.state.error.message}
            </p>
          )}
        </main>
      );
    }

    return this.props.children;
  }
}
