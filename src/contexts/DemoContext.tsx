'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { DEMO_DATA } from '@/components/dashboard/DemoData'
import { useAuthModal } from './AuthModalContext'

interface DemoContextType {
    isDemo: boolean
    data: typeof DEMO_DATA
    interceptAction: () => void
}

const DemoContext = createContext<DemoContextType | undefined>(undefined)

export function DemoProvider({ children, isDemo = false }: { children: ReactNode, isDemo?: boolean }) {
    const router = useRouter()

    const { openModal } = useAuthModal()

    const interceptAction = () => {
        if (isDemo) {
            openModal()
        }
    }

    return (
        <DemoContext.Provider value={{ isDemo, data: DEMO_DATA, interceptAction }}>
            {children}
        </DemoContext.Provider>
    )
}

export function useDemo() {
    const context = useContext(DemoContext)
    if (!context) {
        return { isDemo: false, data: DEMO_DATA, interceptAction: () => { } }
    }
    return context
}
