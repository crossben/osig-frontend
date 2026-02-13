// ============================================
// Error Fallback UI Component
// Professional error display with actions
// ============================================

'use client';

import { ExclamationTriangleIcon, HomeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface ErrorFallbackProps {
    error: Error;
    reset: () => void;
}

export function ErrorFallback({ error, reset }: ErrorFallbackProps) {
    return (
        <div className="min-h-[500px] flex items-center justify-center p-6">
            <div className="text-center max-w-lg">
                <div className="rounded-full bg-destructive/10 p-6 inline-flex mb-6">
                    <ExclamationTriangleIcon className="h-16 w-16 text-destructive" />
                </div>

                <h2 className="text-2xl font-bold mb-3">Oops! Something went wrong</h2>

                <p className="text-muted-foreground mb-2">
                    We encountered an unexpected error. Don't worry, your data is safe.
                </p>

                {error.message && (
                    <div className="bg-muted rounded-lg p-4 my-6 text-left">
                        <p className="text-sm font-mono text-muted-foreground break-all">
                            {error.message}
                        </p>
                    </div>
                )}

                <div className="flex items-center justify-center gap-3 mt-6">
                    <Button onClick={reset} variant="default">
                        <ArrowPathIcon className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                    <Button onClick={() => window.location.href = '/'} variant="outline">
                        <HomeIcon className="h-4 w-4 mr-2" />
                        Go Home
                    </Button>
                </div>
            </div>
        </div>
    );
}
