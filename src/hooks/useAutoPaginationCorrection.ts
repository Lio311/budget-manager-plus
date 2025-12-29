
import { useEffect } from 'react'

/**
 * Automatically navigates to the previous page if the current page becomes empty
 * (e.g. after deleting the last item on the page).
 */
export function useAutoPaginationCorrection(
    currentPage: number,
    totalItems: number,
    itemsPerPage: number,
    setPage: (page: number) => void
) {
    useEffect(() => {
        if (totalItems === 0 && currentPage > 1) {
            setPage(1)
            return
        }

        const totalPages = Math.ceil(totalItems / itemsPerPage)

        // If current page is beyond total pages (and total pages > 0), go to last valid page
        if (totalPages > 0 && currentPage > totalPages) {
            setPage(totalPages)
        }
    }, [totalItems, currentPage, itemsPerPage, setPage])
}
