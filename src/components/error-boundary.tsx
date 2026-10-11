// ============================================
// Error Boundary Component
// Catches JavaScript errors in child components
// ============================================

'use client';

import React from 'react';
import { useT } from '@/lib/i18n';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console (can be extended to error tracking service)
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    reset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError && this.state.error) {
            const Fallback = this.props.fallback;
            if (Fallback) {
                return <Fallback error={this.state.error} reset={this.reset} />;
            }

            // Default fallback UI
            return <DefaultFallback error={this.state.error} reset={this.reset} />;
        }

        return this.props.children;
    }
}

function DefaultFallback({ error, reset }: { error: Error; reset: () => void }) {
    const t = useT();
            return (
                <div className="min-h-[400px] flex items-center justify-center p-6">
                    <div className="text-center max-w-md">
                        <h2 className="text-2xl font-bold mb-2">{t('Something went wrong')}</h2>
                        <p className="text-muted-foreground mb-6">
                            {error.message || t('An unexpected error occurred')}
                        </p>
                        <button
                            onClick={reset}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                            {t('Try Again')}
                        </button>
                    </div>
                </div>
            );
}
