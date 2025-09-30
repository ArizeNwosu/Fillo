import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    resetKeys?: Array<string | number>;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo
        });

        // Call optional error handler
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // In production, you would send this to an error reporting service
        // e.g., Sentry.captureException(error, { extra: errorInfo });
    }

    componentDidUpdate(prevProps: Props) {
        // Reset error boundary when reset keys change
        if (this.props.resetKeys && this.props.resetKeys !== prevProps.resetKeys) {
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null
            });
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)]">
                    <div className="max-w-md w-full bg-[var(--surface-1)] border border-[var(--surface-border)] rounded-lg p-6">
                        <h1 className="text-2xl font-serif font-bold text-[var(--text-primary)] mb-4">
                            Something went wrong
                        </h1>
                        <p className="text-[var(--text-secondary)] mb-4">
                            We're sorry, but something unexpected happened. This error has been logged and we'll look into it.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mb-4 p-3 bg-[var(--surface-2)] rounded border border-[var(--surface-border)]">
                                <summary className="cursor-pointer text-sm font-semibold text-[var(--text-primary)] mb-2">
                                    Error Details (Dev Only)
                                </summary>
                                <pre className="text-xs text-[var(--text-secondary)] overflow-auto whitespace-pre-wrap">
                                    {this.state.error.toString()}
                                    {'\n\n'}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 px-4 py-2 bg-[var(--accent)] text-[var(--accent-text)] rounded-md hover:opacity-90 transition-opacity font-semibold"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 px-4 py-2 bg-[var(--surface-2)] text-[var(--text-primary)] rounded-md hover:bg-[var(--surface-border)] transition-colors font-semibold"
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Specialized error boundaries for specific features

export const FileProcessingErrorBoundary: React.FC<{ children: ReactNode; onReset?: () => void }> = ({ children, onReset }) => (
    <ErrorBoundary
        fallback={
            <div className="p-4 bg-[var(--surface-1)] border border-[var(--danger)] rounded-lg">
                <h3 className="font-semibold text-[var(--danger)] mb-2">File Processing Error</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-3">
                    Failed to process the file. This might be due to an unsupported format or corrupted file.
                </p>
                {onReset && (
                    <button
                        onClick={onReset}
                        className="text-sm font-semibold text-[var(--accent)] hover:underline"
                    >
                        Remove File
                    </button>
                )}
            </div>
        }
    >
        {children}
    </ErrorBoundary>
);

export const AIErrorBoundary: React.FC<{ children: ReactNode; onRetry?: () => void }> = ({ children, onRetry }) => (
    <ErrorBoundary
        fallback={
            <div className="p-4 bg-[var(--surface-1)] border border-[var(--danger)] rounded-lg">
                <h3 className="font-semibold text-[var(--danger)] mb-2">AI Response Error</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-3">
                    Failed to generate or display the AI response. Please try again.
                </p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="px-3 py-1.5 bg-[var(--accent)] text-[var(--accent-text)] rounded-md text-sm font-semibold hover:opacity-90"
                    >
                        Retry
                    </button>
                )}
            </div>
        }
    >
        {children}
    </ErrorBoundary>
);