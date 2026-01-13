'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, Phone, Mail, Building2, ChevronDown } from 'lucide-react'
import { format, differenceInDays, startOfDay } from 'date-fns'
import { Button } from '@/components/ui/button'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, type SupplierFormData } from '@/lib/actions/suppliers'
import { getSupplierPackages } from '@/lib/actions/supplier-packages'
import { useOptimisticDelete, useOptimisticMutation } from '@/hooks/useOptimisticMutation'
import useSWR from 'swr'
import { toast } from 'sonner'
import { useBudget } from '@/contexts/BudgetContext'
import { z } from 'zod'
import { useConfirm } from '@/hooks/useConfirm'
import { useDemo } from '@/contexts/DemoContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Badge } from '@/components/ui/badge'
import { SupplierPackagesManager } from '../settings/SupplierPackagesManager'
import { Dialog } from '@/components/ui/dialog'

const SupplierSchema = z.object({
    name: z.string().min(2, 'שם הספק חייב להכיל לפחות 2 תווים').max(100, 'שם הספק ארוך מדי'),
    email: z.string().email('כתובת אימייל לא תקינה').max(100).optional().or(z.literal('')),
    phone: z.string().regex(/^[\d-]*$/, 'מספר טלפון לא תקין').max(20).optional().or(z.literal('')),
    taxId: z.string().regex(/^\d*$/, 'ח.פ/ע.מ חייב להכיל ספרות בלבד').max(20).optional().or(z.literal('')),
    address: z.string().max(200, 'הכתובת ארוכה מדי').optional().or(z.literal('')),
    notes: z.string().max(500, 'הערות ארוכות מדי').optional().or(z.literal('')),
})

export function SuppliersTab() {
    const { budgetType } = useBudget()
    const confirm = useConfirm()
    const [searchTerm, setSearchTerm] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState<any>(null)

    // Packages & Advanced Settings
    const [packages, setPackages] = useState<any[]>([])
    const [showPackagesManager, setShowPackagesManager] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)

    const [formData, setFormData] = useState<SupplierFormData>({
        name: '',
        email: '',
        phone: '',
        taxId: '',
        address: '',
        notes: '',
        // Defaults
        packageId: '',
        subscriptionType: '',
        subscriptionPrice: '',
        subscriptionStart: null,
        subscriptionEnd: null,
        subscriptionStatus: 'ACTIVE',
        subscriptionColor: '#3B82F6'
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    const validateForm = () => {
        const result = SupplierSchema.safeParse(formData)
        if (!result.success) {
            const newErrors: Record<string, string> = {}
            result.error.errors.forEach(err => {
                if (err.path[0]) {
                    newErrors[err.path[0].toString()] = err.message
                }
            })
            setErrors(newErrors)
            return false
        }
        setErrors({})
        return true
    }

    const fetcher = async () => {
        const result = await getSuppliers(budgetType)
        return result.data || []
    }

    const { isDemo, data: demoData, interceptAction } = useDemo()
    const { data: suppliersData = [], isLoading, mutate } = useSWR(isDemo ? null : ['suppliers', budgetType], fetcher)

    const fetchPackages = async () => {
        const res = await getSupplierPackages()
        if (res.success && res.data) {
            setPackages(res.data)
        }
    }

    useEffect(() => {
        fetchPackages()
    }, [])

    // Refresh packages when manager closes
    useEffect(() => {
        if (!showPackagesManager) {
            fetchPackages()
        }
    }, [showPackagesManager])

    const suppliers = isDemo ? demoData.suppliers.map((s: any) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        taxId: '512345678', // Fake tax ID
        notes: s.category,
        totalExpenses: 2500, // Fake amount
        _count: { expenses: 3 } // Fake count
    })) : suppliersData

    const filteredSuppliers = suppliers.filter((supplier: any) =>
        (supplier.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (supplier.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (supplier.phone || '').includes(searchTerm)
    )

    // Optimistic create for instant UI feedback
    const { execute: optimisticCreateSupplier } = useOptimisticMutation<any[], SupplierFormData>(
        ['suppliers', budgetType],
        (input) => createSupplier(input, budgetType),
        {
            getOptimisticData: (current, input) => [
                {
                    id: 'temp-' + Date.now(),
                    ...input,
                    totalExpenses: 0,
                    _count: { expenses: 0 }
                },
                ...current
            ],
            successMessage: 'ספק נוסף בהצלחה',
            errorMessage: 'שגיאה בהוספת הספק'
        }
    )

    // Optimistic delete for instant UI feedback
    const { deleteItem: optimisticDeleteSupplier } = useOptimisticDelete<any[]>(
        ['suppliers', budgetType],
        deleteSupplier,
        {
            getOptimisticData: (current, id) => current.filter(supplier => supplier.id !== id),
            successMessage: 'ספק נמחק בהצלחה',
            errorMessage: 'שגיאה במחיקת הספק'
        }
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isDemo) { interceptAction(); return; }

        if (!validateForm()) {
            toast.error('נא למלא את שדות החובה המסומנים')
            return
        }

        const payload: SupplierFormData = {
            ...formData,
            // Clean up empty strings
            email: formData.email || undefined,
            phone: formData.phone || undefined,
            taxId: formData.taxId || undefined,
            address: formData.address || undefined,
            notes: formData.notes || undefined,
            packageId: formData.packageId === 'NONE' ? undefined : formData.packageId,
            subscriptionType: formData.subscriptionType || undefined,
            subscriptionStatus: formData.subscriptionStatus || undefined,
            subscriptionColor: formData.subscriptionColor || undefined
        }

        try {
            if (editingSupplier) {
                const result = await updateSupplier(editingSupplier.id, payload)
                if (result.success) {
                    toast.success('ספק עודכן בהצלחה')
                    setShowForm(false)
                    setEditingSupplier(null)
                    setFormData({
                        name: '', email: '', phone: '', taxId: '', address: '', notes: '',
                        packageId: '', subscriptionType: '', subscriptionPrice: '', subscriptionStart: null, subscriptionEnd: null, subscriptionStatus: 'ACTIVE', subscriptionColor: '#3B82F6'
                    })
                    mutate()
                } else {
                    toast.error(result.error || 'שגיאה')
                }
            } else {
                // For optimistic UI, we pass the payload (which is clean) but need to ensure it matches the hook's expectation
                await optimisticCreateSupplier(payload)
                setShowForm(false)
                setFormData({
                    name: '', email: '', phone: '', taxId: '', address: '', notes: '',
                    packageId: '', subscriptionType: '', subscriptionPrice: '', subscriptionStart: null, subscriptionEnd: null, subscriptionStatus: 'ACTIVE', subscriptionColor: '#3B82F6'
                })
            }
        } catch (error) {
            // Error handled by hook or update logic
        }
    }

    const handleEdit = (supplier: any) => {
        setEditingSupplier(supplier)
        setErrors({})
        setFormData({
            name: supplier.name,
            email: supplier.email || '',
            phone: supplier.phone || '',
            taxId: supplier.taxId || '',
            address: supplier.address || '',
            notes: supplier.notes || '',
            isActive: supplier.isActive,
            // Advanced / Package Info
            packageId: supplier.packageId || 'NONE',
            subscriptionType: supplier.subscriptionType || '',
            subscriptionPrice: supplier.subscriptionPrice || '',
            subscriptionStart: supplier.subscriptionStart ? new Date(supplier.subscriptionStart) : null,
            subscriptionEnd: supplier.subscriptionEnd ? new Date(supplier.subscriptionEnd) : null,
            subscriptionStatus: supplier.subscriptionStatus || 'ACTIVE',
            subscriptionColor: supplier.subscriptionColor || '#3B82F6'
        })
        setShowForm(true)
        // Open accordion if has package data
        if (supplier.packageId || supplier.subscriptionPrice) {
            setShowAdvanced(true)
        } else {
            setShowAdvanced(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (isDemo) { interceptAction(); return; }
        const confirmed = await confirm('האם אתה בטוח שברצונך למחוק ספק זה?', 'מחיקת ספק')
        if (!confirmed) return

        try {
            await optimisticDeleteSupplier(id)
        } catch (error) {
            // Error handled by hook
        }
    }

    return (
        <div className="space-y-6">
            {/* Packages Manager Dialog */}
            <Dialog open={showPackagesManager} onOpenChange={setShowPackagesManager}>
                <SupplierPackagesManager onOpenChange={setShowPackagesManager} />
            </Dialog>

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">ספקים</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ניהול ספקים ותשלומים</p>
                </div>
                <Button
                    onClick={() => {
                        setShowForm(true)
                        setEditingSupplier(null)
                        setErrors({})
                        setFormData({
                            name: '', email: '', phone: '', taxId: '', address: '', notes: '',
                            packageId: '', subscriptionType: '', subscriptionPrice: '', subscriptionStart: null, subscriptionEnd: null, subscriptionStatus: 'ACTIVE', subscriptionColor: '#3B82F6'
                        })
                        setShowAdvanced(false)
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4 ml-2" />
                    ספק חדש
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                    type="text"
                    placeholder="חיפוש ספק..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100 dark:placeholder:text-gray-400"
                />
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 dark:bg-slate-800 dark:border-slate-700">
                    <h3 className="text-lg font-semibold mb-4">
                        {editingSupplier ? 'עריכת ספק' : 'ספק חדש'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    שם ספק *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData({ ...formData, name: e.target.value })
                                        if (e.target.value) setErrors(prev => {
                                            const newErrors = { ...prev }
                                            delete newErrors.name
                                            return newErrors
                                        })
                                    }}
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    ח.פ / ע.מ
                                </label>
                                <input
                                    type="text"
                                    value={formData.taxId}
                                    onChange={(e) => {
                                        const value = e.target.value
                                        if (/^\d*$/.test(value)) {
                                            setFormData({ ...formData, taxId: value })
                                        }
                                    }}
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100 ${errors.taxId ? 'border-red-500' : 'border-gray-300'}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    אימייל
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    טלפון
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        const value = e.target.value
                                        if (/^[\d-]*$/.test(value)) {
                                            setFormData({ ...formData, phone: value })
                                        }
                                    }}
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                                    dir="rtl"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                כתובת
                            </label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100 ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                הערות
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={3}
                                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100 ${errors.notes ? 'border-red-500' : 'border-gray-300'}`}
                            />
                        </div>

                        {/* Advanced Settings Accordion */}
                        <div className="border rounded-lg overflow-hidden border-gray-200 dark:border-slate-700">
                            <button
                                type="button"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-semibold text-gray-700 dark:text-gray-300"
                            >
                                <span className="flex items-center gap-2">
                                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
                                    הגדרות מתקדמות (ניהול עלויות קבועות / הסכם)
                                </span>
                            </button>

                            {showAdvanced && (
                                <div className="p-4 bg-gray-50/50 dark:bg-slate-800/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        <div className="grid grid-cols-[1fr,auto] gap-2 items-end">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    קטגוריה / חבילה
                                                </label>
                                                <Select
                                                    value={formData.packageId || 'NONE'}
                                                    onValueChange={(value) => {
                                                        if (value === 'NEW_PACKAGE') {
                                                            setShowPackagesManager(true)
                                                            return
                                                        }

                                                        if (value === 'NONE') {
                                                            setFormData({ ...formData, packageId: '', subscriptionColor: '#3B82F6' })
                                                        } else {
                                                            const pkg = packages.find(p => p.id === value)
                                                            if (pkg) {
                                                                setFormData({
                                                                    ...formData,
                                                                    packageId: pkg.id,
                                                                    subscriptionColor: pkg.color,
                                                                    subscriptionPrice: pkg.defaultPrice || formData.subscriptionPrice,
                                                                    subscriptionType: pkg.defaultType || formData.subscriptionType
                                                                })
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700">
                                                        <SelectValue placeholder="בחר חבילה" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="NONE">ללא חבילה</SelectItem>
                                                        {packages.map((pkg: any) => (
                                                            <SelectItem key={pkg.id} value={pkg.id}>
                                                                <div className="flex items-center gap-2">
                                                                    <div
                                                                        className="w-3 h-3 rounded-full"
                                                                        style={{ backgroundColor: pkg.color }}
                                                                    />
                                                                    <span>{pkg.name}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                        <div className="h-px bg-gray-100 my-1 mx-1" />
                                                        <SelectItem value="NEW_PACKAGE" className="text-green-600 bg-green-50/50 hover:bg-green-50 focus:bg-green-50 cursor-pointer font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <Plus className="w-4 h-4" />
                                                                הוסף חדש
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                סוג תשלום
                                            </label>
                                            <Select
                                                value={formData.subscriptionType || ''}
                                                onValueChange={(value) => setFormData({ ...formData, subscriptionType: value })}
                                            >
                                                <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700">
                                                    <SelectValue placeholder="בחר סוג תשלום" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="WEEKLY">שבועי</SelectItem>
                                                    <SelectItem value="MONTHLY">חודשי</SelectItem>
                                                    <SelectItem value="YEARLY">שנתי</SelectItem>
                                                    <SelectItem value="PROJECT">פרויקט / חד פעמי</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                תאריך התחלה
                                            </label>
                                            <div className="w-full">
                                                <DatePicker
                                                    date={formData.subscriptionStart ? new Date(formData.subscriptionStart) : undefined}
                                                    setDate={(date) => setFormData({ ...formData, subscriptionStart: date })}
                                                    placeholder="בחר תאריך התחלה"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                תאריך סיום (אופציונלי)
                                            </label>
                                            <div className="w-full">
                                                <DatePicker
                                                    date={formData.subscriptionEnd ? new Date(formData.subscriptionEnd) : undefined}
                                                    setDate={(date) => setFormData({ ...formData, subscriptionEnd: date })}
                                                    placeholder="בחר תאריך סיום"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                עלות (₪)
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.subscriptionPrice}
                                                onChange={(e) => setFormData({ ...formData, subscriptionPrice: e.target.value })}
                                                placeholder="0.00"
                                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100 border-gray-300"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                סטטוס הסכם
                                            </label>
                                            <Select
                                                value={formData.subscriptionStatus || 'ACTIVE'}
                                                onValueChange={(value) => setFormData({ ...formData, subscriptionStatus: value })}
                                            >
                                                <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700">
                                                    <SelectValue placeholder="בחר סטטוס" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ACTIVE">פעיל</SelectItem>
                                                    <SelectItem value="INACTIVE">לא פעיל</SelectItem>
                                                    <SelectItem value="PENDING">בהמתנה</SelectItem>
                                                    <SelectItem value="COMPLETED">הסתיים</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                {editingSupplier ? 'עדכן' : 'הוסף'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowForm(false)
                                    setEditingSupplier(null)
                                    setErrors({})
                                }}
                            >
                                ביטול
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Suppliers List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSuppliers.map((supplier: any) => (
                    <div
                        key={supplier.id}
                        className="bg-white p-5 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow dark:bg-slate-800 dark:border-slate-700"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-blue-600" />
                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{supplier.name}</h3>
                                </div>
                                {/* Smart Status Badges */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {supplier.isActive === false && (
                                        <Badge variant="secondary" className="bg-gray-200 text-gray-600 border-gray-300">
                                            לא פעיל
                                        </Badge>
                                    )}
                                    {(supplier.package || supplier.packageName) && (
                                        <Badge
                                            variant="secondary"
                                            className="w-fit text-xs font-normal"
                                            style={{
                                                backgroundColor: (supplier.package?.color || supplier.subscriptionColor || '#3B82F6') + '20',
                                                color: (supplier.package?.color || supplier.subscriptionColor || '#3B82F6'),
                                                borderColor: (supplier.package?.color || supplier.subscriptionColor || '#3B82F6') + '40',
                                                borderWidth: '1px'
                                            }}
                                        >
                                            {supplier.package?.name || supplier.packageName}
                                        </Badge>
                                    )}

                                    {supplier.subscriptionStatus === 'PAID' && (
                                        <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">שולם</Badge>
                                    )}
                                    {supplier.subscriptionStatus === 'UNPAID' && (
                                        <Badge variant="destructive">לא שולם</Badge>
                                    )}
                                    {supplier.subscriptionStatus === 'PARTIAL' && (
                                        <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50">שולם חלקית</Badge>
                                    )}
                                    {supplier.subscriptionStatus === 'INSTALLMENTS' && (
                                        <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50">בתשלומים</Badge>
                                    )}

                                    {/* Expiration Warning */}
                                    {supplier.subscriptionEnd && (() => {
                                        const end = startOfDay(new Date(supplier.subscriptionEnd))
                                        const today = startOfDay(new Date())
                                        const daysLeft = differenceInDays(end, today)

                                        if (daysLeft < 0) return <Badge variant="destructive">מנוי הסתיים</Badge>
                                        if (daysLeft <= 14) return <Badge variant="outline" className="border-red-500 text-red-600 bg-red-50">מסתיים בקרוב ({daysLeft} ימים)</Badge>
                                        if (daysLeft <= 30) return <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50">מסתיים בעוד חודש</Badge>
                                        return null
                                    })()}
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleEdit(supplier)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                                >
                                    <Edit2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </button>
                                <button
                                    onClick={() => handleDelete(supplier.id)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                                >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                </button>
                            </div>
                        </div>

                        {supplier.taxId && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">ח.פ: {supplier.taxId}</p>
                        )}

                        {supplier.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                                <Mail className="h-4 w-4" />
                                <span>{supplier.email}</span>
                            </div>
                        )}

                        {supplier.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                <Phone className="h-4 w-4" />
                                <span>{supplier.phone}</span>
                            </div>
                        )}

                        <div className="border-t pt-3 mt-3 dark:border-slate-700">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">סה"כ עלויות:</span>
                                <span className="font-semibold text-blue-600">
                                    ₪{supplier.totalExpenses?.toLocaleString() || 0}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                                <span className="text-gray-600 dark:text-gray-400">עסקאות:</span>
                                <span className="font-semibold dark:text-gray-200">{supplier._count?.expenses || 0}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {
                filteredSuppliers.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        {searchTerm ? 'לא נמצאו ספקים' : 'אין ספקים עדיין. הוסף ספק חדש כדי להתחיל.'}
                    </div>
                )
            }
        </div >
    )
}
