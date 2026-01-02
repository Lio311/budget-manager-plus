'use client'

import { usePathname } from 'next/navigation'
import { ReactivationPopup } from './ReactivationPopup'

export function ConditionalReactivationPopup({ shouldShow }: { shouldShow: boolean }) {
    const pathname = usePathname()

    // Only show on the homepage, not on /personal, /business, or dashboard
    if (pathname !== '/') return null

    return <ReactivationPopup shouldShow={shouldShow} />
}
