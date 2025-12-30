import { useState, useRef, useEffect } from 'react'
import { Plus, Check, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import useSWR from 'swr'
import { getPaymentMethods, addPaymentMethod } from '@/lib/actions/payment-method'
import { toast } from 'sonner'

export type PaymentMethodColor = 'purple' | 'blue' | 'green' | 'red' | 'orange'

interface PaymentMethodSelectorProps {
    value: string
    onChange: (value: string) => void
    className?: string
    color?: PaymentMethodColor
}

const VARIANTS = {
    purple: {
        hoverBorder: 'hover:border-purple-500',
        itemSelected: 'bg-purple-50 text-purple-700',
        customItemText: 'text-purple-600',
        focusRing: 'focus:ring-purple-500',
        button: 'bg-purple-600 hover:bg-purple-700',
    },
    blue: {
        hoverBorder: 'hover:border-blue-500',
        itemSelected: 'bg-blue-50 text-blue-700',
        customItemText: 'text-blue-600',
        focusRing: 'focus:ring-blue-500',
        button: 'bg-blue-600 hover:bg-blue-700',
    },
    green: {
        hoverBorder: 'hover:border-[#00c875]',
        itemSelected: 'bg-[#00c875]/10 text-[#00c875]',
        customItemText: 'text-[#00c875]',
        focusRing: 'focus:ring-[#00c875]',
        button: 'bg-[#00c875] hover:bg-[#00b268]',
    },
    red: {
        hoverBorder: 'hover:border-[#e2445c]',
        itemSelected: 'bg-[#e2445c]/10 text-[#e2445c]',
        customItemText: 'text-[#e2445c]',
        focusRing: 'focus:ring-[#e2445c]',
        button: 'bg-[#e2445c] hover:bg-[#d43f55]',
    },
    orange: {
        hoverBorder: 'hover:border-orange-500',
        itemSelected: 'bg-orange-50 text-orange-700',
        customItemText: 'text-orange-600',
        focusRing: 'focus:ring-orange-500',
        button: 'bg-orange-600 hover:bg-orange-700',
    }
}

const DEFAULT_METHODS = [
    { id: 'CREDIT_CARD', label: 'כרטיס אשראי' },
    { id: 'BANK_TRANSFER', label: 'העברה בנקאית' },
    { id: 'CASH', label: 'מזומן' },
    { id: 'BIT', label: 'ביט' },
    { id: 'PAYBOX', label: 'פייבוקס' },
    { id: 'CHECK', label: 'צ\'ק' },
    { id: 'DIRECT_DEBIT', label: 'הוראת קבע' }
]

export function PaymentMethodSelector({ value, onChange, className, color = 'purple' }: PaymentMethodSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isCustom, setIsCustom] = useState(false)
    const [customValue, setCustomValue] = useState('')
    const [saving, setSaving] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const styles = VARIANTS[color]

    // Fetch Custom Methods
    const { data: customMethodsResult, mutate } = useSWR('payment-methods', getPaymentMethods)
    const customMethods = customMethodsResult?.success ? customMethodsResult.data : []

    // Combine Methods
    const allMethods = [
        ...DEFAULT_METHODS,
        ...(customMethods || []).map((m: any) => ({ id: m.name, label: m.name }))
    ]

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (methodValue: string) => {
        onChange(methodValue)
        setIsOpen(false)
        setIsCustom(false)
    }

    const handleCustomSubmit = async () => {
        if (!customValue.trim()) return

        setSaving(true)
        const name = customValue.trim()

        try {
            // Optimistic Update
            onChange(name)
            setIsOpen(false)
            setIsCustom(false)
            setCustomValue('')

            // Persist
            const result = await addPaymentMethod(name)
            if (result.success) {
                await mutate()
                toast.success('אמצעי תשלום נשמר')
            } else {
                toast.error('שגיאה בשמירת אמצעי תשלום')
            }
        } catch (error) {
            console.error(error)
            toast.error('שגיאה בשמירה')
        } finally {
            setSaving(false)
        }
    }

    const getLabel = (val: string) => {
        const found = Array.isArray(allMethods) ? allMethods.find(m => m.id === val || m.label === val) : null
        return found ? found.label : val
    }

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">
                אמצעי תשלום
            </label>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-slate-800 dark:border-slate-700 cursor-pointer flex justify-between items-center transition-colors",
                    styles.hoverBorder
                )}
                role="button"
                tabIndex={0}
            >
                <span className={cn("text-sm dark:text-gray-100", !value && "text-gray-500 dark:text-gray-400")}>
                    {value ? getLabel(value) : "בחר אמצעי תשלום"}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md shadow-lg max-h-48 overflow-y-auto"
                    >
                        {!isCustom ? (
                            <div className="p-1">
                                {allMethods.map((method) => (
                                    <div
                                        key={method.id}
                                        onClick={() => handleSelect(method.label)}
                                        className={cn(
                                            "px-3 py-2 text-sm rounded-md cursor-pointer flex items-center justify-between",
                                            value === method.label ? styles.itemSelected : "hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200"
                                        )}
                                    >
                                        {method.label}
                                        {value === method.label && <Check className="h-4 w-4" />}
                                    </div>
                                ))}
                                <div className="border-t my-1"></div>
                                <div
                                    onClick={() => setIsCustom(true)}
                                    className={cn(
                                        "px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 font-medium",
                                        styles.customItemText
                                    )}
                                >
                                    <Plus className="h-4 w-4" />
                                    הוסף חדש
                                </div>
                            </div>
                        ) : (
                            <div className="p-2">
                                <div className="mb-2">
                                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">שם אמצעי התשלום:</label>
                                    <input
                                        type="text"
                                        value={customValue}
                                        onChange={(e) => setCustomValue(e.target.value)}
                                        className={cn(
                                            "w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded focus:ring-1",
                                            styles.focusRing
                                        )}
                                        placeholder="לדוגמה: גיפטקארד"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleCustomSubmit()
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCustomSubmit}
                                        disabled={!customValue.trim() || saving}
                                        className={cn(
                                            "flex-1 text-white text-xs py-1.5 rounded disabled:opacity-50",
                                            styles.button
                                        )}
                                    >
                                        {saving ? 'שומר...' : 'הוסף'}
                                    </button>
                                    <button
                                        onClick={() => setIsCustom(false)}
                                        className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs py-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-600"
                                    >
                                        ביטול
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
