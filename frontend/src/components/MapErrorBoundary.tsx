import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[MAP_ERROR_BOUNDARY] Caught error in Map component:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="relative w-full h-full min-h-[500px] flex-1 bg-slate-950 flex flex-col items-center justify-center p-6 text-center border border-red-900/40">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">Map Unavailable</h3>
          <p className="text-xs text-red-400 font-mono mb-2">Map initialization failed</p>
          <p className="text-xs text-slate-400 max-w-md mb-4 leading-relaxed">
            {this.state.error?.message || 'An unexpected error occurred while rendering the geospatial canvas.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition shadow-lg cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Map Initialization</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
