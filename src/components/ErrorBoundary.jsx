import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0c] text-white font-sans">
          <div className="max-w-md w-full bg-red-900/10 border border-red-500/20 p-8 rounded-2xl text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h1>
            <p className="text-white/60 mb-6 text-sm">
              The application encountered an unexpected error. This might be due to a firebase connection issue or a temporary failure.
            </p>
            <pre className="p-4 bg-black/40 rounded-xl text-left text-[10px] text-red-300/80 overflow-auto mb-6 max-h-40">
              {this.state.error?.message || "Unknown error"}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-bold transition-all"
            >
              Try Reloading
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
