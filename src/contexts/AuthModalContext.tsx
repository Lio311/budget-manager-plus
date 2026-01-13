'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface AuthModalContextType {
    isOpen: boolean
    redirectUrl: string
    openModal: (url?: string) => void
    closeModal: () => void
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

export function AuthModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [redirectUrl, setRedirectUrl] = useState('/dashboard')

    const openModal = (url?: string) => {
        if (url) setRedirectUrl(url)
        else setRedirectUrl('/dashboard') // Reset to default if not provided
        setIsOpen(true)
    }
    const closeModal = () => setIsOpen(false)

    return (
        <AuthModalContext.Provider value={{ isOpen, redirectUrl, openModal, closeModal }}>
            {children}
        </AuthModalContext.Provider>
    )
}

export function useAuthModal() {
    const context = useContext(AuthModalContext)
    if (!context) {
        throw new Error('useAuthModal must be used within an AuthModalProvider')
    }
    return context
}
