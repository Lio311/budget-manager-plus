import { useState, useRef, useEffect } from 'react'
import { Plus, Check, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PaymentMethodSelectorProps {
    value: string
    onChange: (value: string) => void
    className?: string
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

export function PaymentMethodSelector({ value, onChange, className }: PaymentMethodSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isCustom, setIsCustom] = useState(false)
    const [customValue, setCustomValue] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)

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

    const handleCustomSubmit = () => {
        if (customValue.trim()) {
            onChange(customValue.trim())
            setIsOpen(false)
            setIsCustom(false)
            setCustomValue('')
        }
    }

    const getLabel = (val: string) => {
        const found = DEFAULT_METHODS.find(m => m.id === val || m.label === val)
        return found ? found.label : val
    }

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                אמצעי תשלום
            </label>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white cursor-pointer flex justify-between items-center hover:border-purple-500 transition-colors"
                role="button"
                tabIndex={0}
            >
                <span className={cn("text-sm", !value && "text-gray-500")}>
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
                        className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto"
                    >
                        {!isCustom ? (
                            <div className="p-1">
                                {DEFAULT_METHODS.map((method) => (
                                    <div
                                        key={method.id}
                                        onClick={() => handleSelect(method.label)} // Saving Label as value for simplicity in "String" field
                                        className={cn(
                                            "px-3 py-2 text-sm rounded-md cursor-pointer flex items-center justify-between",
                                            value === method.label ? "bg-purple-50 text-purple-700" : "hover:bg-gray-50 text-gray-700"
                                        )}
                                    >
                                        {method.label}
                                        {value === method.label && <Check className="h-4 w-4" />}
                                    </div>
                                ))}
                                <div className="border-t my-1"></div>
                                <div
                                    onClick={() => setIsCustom(true)}
                                    className="px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-gray-50 text-purple-600 flex items-center gap-2 font-medium"
                                >
                                    <Plus className="h-4 w-4" />
                                    הוסף חדש...
                                </div>
                            </div>
                        ) : (
                            <div className="p-2">
                                <div className="mb-2">
                                    <label className="text-xs text-gray-500 block mb-1">שם אמצעי התשלום:</label>
                                    <input
                                        type="text"
                                        value={customValue}
                                        onChange={(e) => setCustomValue(e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
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
                                        disabled={!customValue.trim()}
                                        className="flex-1 bg-purple-600 text-white text-xs py-1.5 rounded hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        הוסף
                                    </button>
                                    <button
                                        onClick={() => setIsCustom(false)}
                                        className="flex-1 bg-gray-100 text-gray-700 text-xs py-1.5 rounded hover:bg-gray-200"
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
