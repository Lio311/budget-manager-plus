'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { useAuth } from '@clerk/nextjs'

interface AuthModalTriggerProps {
    children: React.ReactNode
    redirectUrl?: string
    onClick?: () => void
    className?: string
}

export function AuthModalTrigger({ children, redirectUrl, onClick, className }: AuthModalTriggerProps) {
    const { openModal } = useAuthModal()
    const { isSignedIn } = useAuth()
    const router = useRouter()

    const handleClick = (e: React.MouseEvent) => {
        // Stop propagation to prevent landing page scroll interference if needed
        // e.stopPropagation();

        if (onClick) onClick();

        if (isSignedIn) {
            router.push(redirectUrl || '/dashboard')
        } else {
            openModal(redirectUrl)
        }
    }

    return (
        <span
            onClick={handleClick}
            className={`cursor-pointer inline-block pointer-events-auto relative z-[60] ${className || ''}`}
        >
            {children}
        </span>
    )
}
