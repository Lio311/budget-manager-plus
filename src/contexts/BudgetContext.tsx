'use client'

import { createContext, useContext, useState, useEffect } from 'react'

export type BudgetType = 'PERSONAL' | 'BUSINESS'

interface BudgetContextType {
    month: number
    year: number
    currency: string
    budgetType: BudgetType
    setMonth: (month: number) => void
    setYear: (year: number) => void
    setCurrency: (currency: string) => void
    setBudgetType: (type: BudgetType) => void
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined)

export function BudgetProvider({ children, initialPlan }: { children: React.ReactNode, initialPlan?: BudgetType }) {
    const [month, setMonth] = useState(1) // Default to January
    const [year, setYear] = useState(2025) // Default to 2025
    const [currency, setCurrency] = useState('ILS')
    const [budgetType, setBudgetTypeInternal] = useState<BudgetType>(initialPlan || 'PERSONAL')
    const [isInitialized, setIsInitialized] = useState(false)

    // Initialize from localStorage
    useEffect(() => {
        const now = new Date()
        setMonth(now.getMonth() + 1)
        setYear(now.getFullYear())

        // Load saved budget type from localStorage first (user's last choice)
        const savedType = localStorage.getItem('budgetType')

        if (savedType === 'PERSONAL' || savedType === 'BUSINESS') {
            // User has a saved preference, use it
            setBudgetTypeInternal(savedType)
        } else if (initialPlan) {
            // No saved preference, use server default but don't save it yet
            setBudgetTypeInternal(initialPlan)
        }

        setIsInitialized(true)
    }, [initialPlan])

    const setBudgetType = (type: BudgetType) => {
        setBudgetTypeInternal(type)
        localStorage.setItem('budgetType', type)

        // Only show loading overlay if we're in the browser (client-side)
        if (typeof window !== 'undefined') {
            // Show loading overlay
            const overlay = document.createElement('div')
            overlay.id = 'budget-loading-overlay'
            overlay.innerHTML = `
                <style>
                    #budget-loading-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        z-index: 9999;
                        animation: fadeIn 0.3s ease-in;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.1); opacity: 0.8; }
                    }
                    .spinner {
                        width: 60px;
                        height: 60px;
                        border: 4px solid rgba(255,255,255,0.3);
                        border-top-color: white;
                        border-radius: 50%;
                        animation: spin 0.8s linear infinite;
                    }
                    .loading-text {
                        color: white;
                        font-size: 18px;
                        font-weight: 600;
                        margin-top: 20px;
                        animation: pulse 1.5s ease-in-out infinite;
                    }
                </style>
                <div class="spinner"></div>
                <div class="loading-text">טוען ממשק ${type === 'BUSINESS' ? 'עסקי' : 'אישי'}...</div>
            `
            document.body.appendChild(overlay)

            // Force reload after a brief delay
            setTimeout(() => {
                const url = new URL(window.location.href)
                url.searchParams.set('tab', 'overview')
                window.location.href = url.toString()
            }, 400)
        }
    }

    if (!isInitialized) {
        return null // or a loading spinner
    }

    return (
        <BudgetContext.Provider value={{ month, year, currency, budgetType, setMonth, setYear, setCurrency, setBudgetType }}>
            {children}
        </BudgetContext.Provider>
    )
}

export function useBudget() {
    const context = useContext(BudgetContext)
    if (!context) {
        throw new Error('useBudget must be used within BudgetProvider')
    }
    return context
}
