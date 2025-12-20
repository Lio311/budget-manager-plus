'use client'

import { createContext, useContext, useState, useEffect } from 'react'

interface BudgetContextType {
    month: number
    year: number
    currency: string
    setMonth: (month: number) => void
    setYear: (year: number) => void
    setCurrency: (currency: string) => void
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined)

export function BudgetProvider({ children }: { children: React.ReactNode }) {
    const now = new Date()
    const [month, setMonth] = useState(now.getMonth() + 1)
    const [year, setYear] = useState(now.getFullYear())
    const [currency, setCurrency] = useState('₪')

    return (
        <BudgetContext.Provider value={{ month, year, currency, setMonth, setYear, setCurrency }}>
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
