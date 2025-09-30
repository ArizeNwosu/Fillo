import React, { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-[var(--background)] text-[var(--text-primary)] p-4">
                    <div className="max-w-md w-full text-center">
                        <div className="mb-6">
                            <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                        <p className="text-[var(--text-secondary)] mb-6">
                            An unexpected error occurred. Please try refreshing the page.
                        </p>
                        {this.state.error && (
                            <details className="mb-6 text-left bg-[var(--surface-1)] p-4 rounded-lg">
                                <summary className="cursor-pointer font-semibold mb-2">Error Details</summary>
                                <pre className="text-xs overflow-auto text-red-400">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}
                        <button
                            onClick={this.handleReset}
                            className="px-6 py-2 bg-[var(--accent)] text-white rounded-md hover:opacity-90 transition-opacity"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}