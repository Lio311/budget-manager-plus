'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

export function ForceLightMode() {
    const { setTheme } = useTheme()

    useEffect(() => {
        // 1. Force next-themes state
        setTheme('light')

        // 2. Force DOM class removal (aggressive)
        document.documentElement.classList.remove('dark')
        document.documentElement.style.colorScheme = 'light'
        document.body.classList.remove('dark')

        // 3. Force scrollbar style via style tag injection (most robust)
        const styleId = 'force-light-scrollbar'
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style')
            style.id = styleId
            style.innerHTML = `
                :root { color-scheme: light !important; }
                html, body { scrollbar-color: #cbd5e1 #f1f5f9; }
                ::-webkit-scrollbar { width: 10px; }
                ::-webkit-scrollbar-track { background: #f1f5f9; }
                ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 5px; }
            `
            document.head.appendChild(style)
        }

        // Cleanup
        return () => {
            const style = document.getElementById(styleId)
            if (style) style.remove()
        }
    }, [setTheme])

    return null
}
