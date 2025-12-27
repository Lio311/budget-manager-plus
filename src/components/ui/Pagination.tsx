import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronLeft } from 'lucide-react'

interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
            <div className="flex items-center gap-1">
                {(() => {
                    const pages = [];
                    // Always show first page
                    pages.push(1);

                    if (currentPage > 3) {
                        pages.push('...');
                    }

                    // Show neighbors
                    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                        pages.push(i);
                    }

                    if (currentPage < totalPages - 2) {
                        pages.push('...');
                    }

                    // Always show last page if > 1
                    if (totalPages > 1) {
                        pages.push(totalPages);
                    }

                    // If total pages is small (e.g. 5), just show all to avoid "1 ... 3 4 5" weirdness
                    // Simple override for small counts:
                    let items: (number | string)[] = pages;
                    if (totalPages <= 7) {
                        items = Array.from({ length: totalPages }, (_, i) => i + 1);
                    }

                    return items.map((page, idx) => (
                        page === '...' ? (
                            <span key={`ellipsis-${idx}`} className="text-gray-400 px-2">...</span>
                        ) : (
                            <button
                                key={page}
                                onClick={() => onPageChange(page as number)}
                                className={`
                                    h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 border
                                    ${currentPage === page
                                        ? 'bg-[#323338] text-white border-[#323338] shadow-md scale-105'
                                        : 'bg-white text-[#323338] border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }
                                `}
                            >
                                {page}
                            </button>
                        )
                    ));
                })()}
            </div>

            <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-9 w-9 rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all disabled:opacity-50"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div >
    )
}
