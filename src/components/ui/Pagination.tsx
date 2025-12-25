import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronLeft } from 'lucide-react'

interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

    return (
        <div className="flex items-center justify-center gap-2 mt-6" dir="ltr">
            <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-9 w-9 rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all disabled:opacity-50"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
                {pages.map(page => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
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
                ))}
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
        </div>
    )
}
