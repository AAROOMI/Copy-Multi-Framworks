import React from 'react';

export const ErrorBoundary: any = class extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    const state = (this as any).state;
    const props = (this as any).props;
    if (state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-800 rounded-md">
          <h2 className="text-lg font-normal">Something went wrong.</h2>
          <p>{state.error?.message || 'Unknown error'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md"
          >
            Reload
          </button>
        </div>
      );
    }

    return props.children;
  }
}
