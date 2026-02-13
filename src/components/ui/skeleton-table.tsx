// ============================================
// Skeleton Table Component
// Reusable skeleton for table loading states
// ============================================

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SkeletonTableProps {
    rows?: number;
    columns?: number;
    showHeader?: boolean;
    className?: string;
}

export function SkeletonTable({
    rows = 5,
    columns = 5,
    showHeader = true,
    className,
}: SkeletonTableProps) {
    return (
        <div className={cn('w-full space-y-3', className)}>
            {/* Header */}
            {showHeader && (
                <div className="flex items-center gap-4 border-b pb-3">
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton key={`header-${i}`} className="h-4 flex-1" />
                    ))}
                </div>
            )}

            {/* Rows */}
            <div className="space-y-3">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={`row-${rowIndex}`} className="flex items-center gap-4">
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <Skeleton
                                key={`cell-${rowIndex}-${colIndex}`}
                                className="h-10 flex-1"
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
