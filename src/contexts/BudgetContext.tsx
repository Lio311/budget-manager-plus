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

export function BudgetProvider({ children }: { children: React.ReactNode }) {
    const [month, setMonth] = useState(1) // Default to January
    const [year, setYear] = useState(2025) // Default to 2025
    const [currency, setCurrency] = useState('₪')
    const [budgetType, setBudgetType] = useState<BudgetType>('PERSONAL')

    useEffect(() => {
        const now = new Date()
        setMonth(now.getMonth() + 1)
        setYear(now.getFullYear())
    }, [])

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
