import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import Button from './ui/Button';

/**
 * Global and route-level ErrorBoundary class component.
 * Catches JavaScript errors anywhere in their child component tree,
 * logs those errors, and displays a graceful fallback UI instead of a pure black screen.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Keep error logging for diagnostics
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    if (typeof this.props.onError === 'function') {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    if (typeof this.props.onReset === 'function') {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({
              error: this.state.error,
              reset: this.handleReset,
              reload: this.handleReload,
            })
          : this.props.fallback;
      }

      const errorMessage =
        this.state.error?.message ||
        (typeof this.state.error === 'string'
          ? this.state.error
          : 'An unexpected runtime error occurred.');

      const componentName = this.props.name ? ` in ${this.props.name}` : '';

      return (
        <div
          role="alert"
          className="min-h-[380px] w-full flex items-center justify-center p-6 bg-zinc-950 text-zinc-50"
        >
          <div className="max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in fade-in duration-200">
            {/* Friendly Warning Icon */}
            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="h-7 w-7" />
            </div>

            {/* User-friendly message */}
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-zinc-100">
                Something went wrong{componentName}.
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                An error occurred while displaying this section. Your data is safe.
              </p>
            </div>

            {/* Error message in small mono text */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-left overflow-x-auto max-h-36">
              <p className="text-xs font-mono text-red-400/90 break-words whitespace-pre-wrap select-all">
                {errorMessage}
              </p>
            </div>

            {/* Action Buttons: [Try Again] and [Reload Page] */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={this.handleReset}
                className="w-full sm:w-auto gap-2 text-xs font-medium"
              >
                <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
                Try Again
              </Button>

              <Button
                size="sm"
                onClick={this.handleReload}
                className="w-full sm:w-auto gap-2 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
