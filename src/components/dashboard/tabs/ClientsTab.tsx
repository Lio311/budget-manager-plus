'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, Phone, Mail, Building2, ChevronDown, MapPin, Settings, ArrowUpDown, LayoutGrid, List, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getClients, createClient, updateClient, deleteClient, syncClientIncomes, type ClientFormData } from '@/lib/actions/clients'
import { useOptimisticDelete, useOptimisticMutation } from '@/hooks/useOptimisticMutation'
import useSWR from 'swr'
import { toast } from 'sonner'
import { useBudget } from '@/contexts/BudgetContext'
import { z } from 'zod'
import { useConfirm } from '@/hooks/useConfirm'
import { useDemo } from '@/contexts/DemoContext'
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { format, differenceInDays, startOfDay } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { PhoneInputWithCountry } from '@/components/ui/PhoneInputWithCountry'
import { Input } from '@/components/ui/input'
import { ClientSubscriptionHistoryDialog } from '@/components/dashboard/dialogs/ClientSubscriptionHistoryDialog'
import { Switch } from '@/components/ui/switch'

const ClientSchema = z.object({
    name: z.string().min(2, 'שם הלקוח חייב להכיל לפחות 2 תווים').max(100, 'שם הלקוח ארוך מדי'),
    email: z.string().email('כתובת אימייל לא תקינה').max(100).optional().or(z.literal('')),
    phone: z.string().regex(/^[\d-]*$/, 'מספר טלפון לא תקין').max(20).optional().or(z.literal('')),
    taxId: z.string().regex(/^\d*$/, 'ח.פ/ע.מ חייב להכיל ספרות בלבד').max(20).optional().or(z.literal('')),
    address: z.string().max(200, 'הכתובת ארוכה מדי').optional().or(z.literal('')),
    notes: z.string().max(500, 'הערות ארוכות מדי').optional().or(z.literal('')),
})

export function ClientsTab() {
    const { budgetType } = useBudget()
    const confirm = useConfirm()
    const [searchTerm, setSearchTerm] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingClient, setEditingClient] = useState<any>(null)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [formData, setFormData] = useState<ClientFormData>({
        name: '',
        email: '',
        phone: '',
        taxId: '',
        address: '',
        notes: '',
        packageName: '',
        subscriptionType: '',
        subscriptionPrice: '',
        subscriptionStart: undefined,
        subscriptionEnd: undefined,
        subscriptionStatus: '',
        eventLocation: '',
        isActive: true
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isAddingPackage, setIsAddingPackage] = useState(false)

    const [warningDays, setWarningDays] = useState(14)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [subscriptionDialogClient, setSubscriptionDialogClient] = useState<any>(null)

    // Load settings from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('clientWarningDays')
            if (saved) setWarningDays(parseInt(saved))
        }
    }, [])

    const handleSaveSettings = (days: number) => {
        setWarningDays(days)
        localStorage.setItem('clientWarningDays', days.toString())
    }

    const validateForm = () => {
        const result = ClientSchema.safeParse(formData)
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
        const result = await getClients(budgetType)
        return result.data || []
    }

    const { isDemo, data: demoData, interceptAction } = useDemo()
    const { data: clientsData = [], isLoading, mutate } = useSWR(isDemo ? null : ['clients', budgetType], fetcher)

    const clients = isDemo ? demoData.clients.map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        taxId: '519876543', // Fake tax ID
        notes: 'לקוח דמו',
        totalRevenue: c.totalRevenue,
        _count: { incomes: 5 } // Fake count
    })) : clientsData

    // Sorting State
    const [sortMethod, setSortMethod] = useState<'CREATED_AT' | 'REVENUE' | 'EXPIRY' | 'VALUE' | 'NAME' | 'STATUS'>('NAME') // Default to NAME for better UX
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc') // Default asc for names

    // Optimistic create for instant UI feedback
    const { execute: optimisticCreateClient } = useOptimisticMutation<any[], ClientFormData>(
        ['clients', budgetType],
        (input) => createClient(input, budgetType),
        {
            getOptimisticData: (current, input) => [
                {
                    id: 'temp-' + Date.now(),
                    ...input,
                    totalRevenue: 0,
                    _count: { incomes: 0 },
                    createdAt: new Date().toISOString()
                },
                ...current
            ],
            successMessage: 'לקוח נוסף בהצלחה',
            errorMessage: 'שגיאה בהוספת הלקוח'
        }
    )

    // Helper: Calculate Normalized Monthly Value (for "Most Worthwhile")
    const getMonthlyValue = (client: any) => {
        if (!client.subscriptionPrice) return 0
        const price = client.subscriptionPrice
        switch (client.subscriptionType) {
            case 'WEEKLY': return price * 4
            case 'MONTHLY': return price
            case 'YEARLY': return price / 12
            case 'PROJECT': return price // Treat project as one-time lump sum (ranking might be skewed but acceptable)
            default: return 0
        }
    }

    const sortClients = (clients: any[]) => {
        return [...clients].sort((a, b) => {
            let diff = 0
            switch (sortMethod) {
                case 'REVENUE':
                    diff = (a.totalRevenue || 0) - (b.totalRevenue || 0)
                    break
                case 'EXPIRY':
                    // Closest expiry first (ignoring past/null?)
                    const dateA = a.subscriptionEnd ? new Date(a.subscriptionEnd).getTime() : Infinity
                    const dateB = b.subscriptionEnd ? new Date(b.subscriptionEnd).getTime() : Infinity
                    diff = dateA - dateB
                    break
                case 'VALUE':
                    diff = getMonthlyValue(a) - getMonthlyValue(b)
                    break
                case 'STATUS':
                    // Active clients first
                    if ((a.isActive ?? true) !== (b.isActive ?? true)) {
                        return (a.isActive ?? true) ? -1 : 1
                    }
                    // Then by payment status
                    const statusPriority: Record<string, number> = { 'UNPAID': 3, 'PARTIAL': 2, 'INSTALLMENTS': 1, 'PAID': 0 }
                    const cleanStatusA = a.subscriptionStatus || 'PAID'
                    const cleanStatusB = b.subscriptionStatus || 'PAID'
                    diff = (statusPriority[cleanStatusA] || 0) - (statusPriority[cleanStatusB] || 0)
                    break
                case 'NAME':
                    return sortDirection === 'asc'
                        ? (a.name || '').localeCompare(b.name || '')
                        : (b.name || '').localeCompare(a.name || '')
                case 'CREATED_AT':
                default:
                    const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0
                    const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0
                    diff = createdA - createdB
                    break
            }
            return sortDirection === 'asc' ? diff : -diff
        })
    }

    const filteredClients = sortClients(clients.filter((client: any) =>
        (client.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm)
    ))

    // Optimistic delete for instant UI feedback
    const { deleteItem: optimisticDeleteClient } = useOptimisticDelete<any[]>(
        ['clients', budgetType],
        deleteClient,
        {
            getOptimisticData: (current, id) => current.filter(client => client.id !== id),
            successMessage: 'לקוח נמחק בהצלחה',
            errorMessage: 'שגיאה במחיקת הלקוח'
        }
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isDemo) { interceptAction(); return; }

        if (!validateForm()) {
            toast.error('נא למלא את שדות החובה המסומנים')
            return
        }

        try {
            if (editingClient) {
                const result = await updateClient(editingClient.id, formData)
                if (result.success) {
                    toast.success('לקוח עודכן בהצלחה')
                    setShowForm(false)
                    setEditingClient(null)
                    setShowForm(false)
                    setEditingClient(null)
                    setFormData({ name: '', email: '', phone: '', taxId: '', address: '', notes: '', packageName: '', subscriptionType: '', subscriptionPrice: '', subscriptionStart: undefined, subscriptionEnd: undefined, subscriptionStatus: '', eventLocation: '', isActive: true })
                    mutate()
                } else {
                    toast.error(result.error || 'שגיאה')
                }
            } else {
                await optimisticCreateClient(formData)
                setShowForm(false)
                setShowForm(false)
                setFormData({ name: '', email: '', phone: '', taxId: '', address: '', notes: '', packageName: '', subscriptionType: '', subscriptionPrice: '', subscriptionStart: undefined, subscriptionEnd: undefined, subscriptionStatus: '', eventLocation: '' })
            }
        } catch (error) {
            // Error handled by hook or update logic
        }
    }

    const handleEdit = (client: any) => {
        setEditingClient(client)
        setErrors({})
        setFormData({
            name: client.name,
            email: client.email || '',
            phone: client.phone || '',
            taxId: client.taxId || '',
            address: client.address || '',

            notes: client.notes || '',
            packageName: client.packageName || '',
            subscriptionType: client.subscriptionType || '',
            subscriptionPrice: client.subscriptionPrice || '',
            subscriptionStart: client.subscriptionStart,
            subscriptionEnd: client.subscriptionEnd,
            subscriptionStatus: client.subscriptionStatus || '',
            eventLocation: client.eventLocation || '',
            isActive: client.isActive ?? true
        })
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (isDemo) { interceptAction(); return; }
        const confirmed = await confirm('האם אתה בטוח שברצונך למחוק לקוח זה?', 'מחיקת לקוח')
        if (!confirmed) return

        try {
            await optimisticDeleteClient(id)
        } catch (error) {
            // Error handled by hook
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="h-8 w-32 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="flex gap-2">
                        <div className="h-10 w-10 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                        <div className="h-10 w-32 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-48 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">לקוחות</h2>
                    <p className="text-sm text-gray-500 mt-1">ניהול תיקי לקוחות</p>
                </div>
                <div className="flex gap-2">
                    <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">הגדרות תצוגה</h4>
                                    <p className="text-sm text-muted-foreground">
                                        הגדר מתי להציג התראת סיום מנוי
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="width">ימים להתראה</Label>
                                        <input
                                            id="width"
                                            type="number"
                                            value={warningDays}
                                            onChange={(e) => handleSaveSettings(parseInt(e.target.value))}
                                            className="col-span-2 h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                    <Button onClick={() => setIsSettingsOpen(false)} className="w-full mt-2">
                                        שמור וסגור
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Button
                        onClick={() => {
                            setShowForm(true)
                            setEditingClient(null)
                            setErrors({})
                            setEditingClient(null)
                            setErrors({})
                            setIsAddingPackage(false)
                            setFormData({ name: '', email: '', phone: '', taxId: '', address: '', notes: '', packageName: '', subscriptionType: '', subscriptionPrice: '', subscriptionStart: undefined, subscriptionEnd: undefined, subscriptionStatus: '', eventLocation: '', isActive: true })
                        }}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Plus className="h-4 w-4 ml-2" />
                        לקוח חדש
                    </Button>
                </div>
            </div>
            {/* Search and Sort Section */}
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="חיפוש לקוח..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100 dark:placeholder:text-gray-400"
                    />
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    {/* Sort Dropdown & Toggle */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 font-medium">מיון לפי:</span>
                            <Select value={sortMethod} onValueChange={(val: any) => setSortMethod(val)}>
                                <SelectTrigger className="w-[140px] h-9 gap-2">
                                    <SelectValue placeholder="מיון לפי" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NAME">שם לקוח</SelectItem>
                                    <SelectItem value="CREATED_AT">תאריך הקמה</SelectItem>
                                    <SelectItem value="REVENUE">הכנסות</SelectItem>
                                    <SelectItem value="STATUS">סטטוס תשלום</SelectItem>
                                    {/* Only show these if at least one client has subscription data */}
                                    {clients.some((c: any) => c.subscriptionEnd || c.subscriptionPrice) && (
                                        <>
                                            <SelectItem value="EXPIRY">תוקף מנוי</SelectItem>
                                            <SelectItem value="VALUE">משתלם ביותר</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                                className="h-9 px-3 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                title={sortDirection === 'asc' ? 'סדר עולה' : 'סדר יורד'}
                            >
                                {/* Dynamic Icon based on Asc/Desc */}
                                <ArrowUpDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                            </Button>
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-lg p-1 border border-gray-200 dark:border-slate-700">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid'
                                    ? 'bg-white dark:bg-slate-700 shadow-sm text-green-600 dark:text-green-400'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                title="תצוגת כרטיסים"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list'
                                    ? 'bg-white dark:bg-slate-700 shadow-sm text-green-600 dark:text-green-400'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                title="תצוגת רשימה"
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <Badge variant="secondary" className="text-sm font-normal w-full sm:w-auto text-center justify-center">
                        סה"כ לקוחות: {clients.length}
                    </Badge>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 dark:bg-slate-800 dark:border-slate-700">
                    <h3 className="text-lg font-semibold mb-4">
                        {editingClient ? 'עריכת לקוח' : 'לקוח חדש'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    שם לקוח *
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
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                <div className="mt-4 flex items-center gap-2">
                                    <Switch
                                        id="active-mode"
                                        checked={formData.isActive ?? true}
                                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                    />
                                    <Label htmlFor="active-mode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {formData.isActive ? 'לקוח פעיל' : 'לקוח לא פעיל'}
                                    </Label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    אימייל
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    טלפון
                                </label>
                                <PhoneInputWithCountry
                                    value={formData.phone || ''}
                                    onChange={(value) => {
                                        setFormData({ ...formData, phone: value })
                                        if (errors.phone) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev }
                                                delete newErrors.phone
                                                return newErrors
                                            })
                                        }
                                    }}
                                    className={errors.phone ? 'border-red-500' : ''}
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
                                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100 ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
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
                                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100 ${errors.notes ? 'border-red-500' : 'border-gray-300'}`}
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
                                    הגדרות מתקדמות (ניהול מנוי / ריטיינר)
                                </span>
                            </button>

                            {showAdvanced && (
                                <div className="p-4 bg-gray-50/50 dark:bg-slate-800/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                שם חבילה / שירות
                                            </label>
                                            {isAddingPackage ? (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="הזן שם חבילה חדש"
                                                        value={formData.packageName || ''}
                                                        onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                                                        autoFocus
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setIsAddingPackage(false)
                                                            setFormData({ ...formData, packageName: '' })
                                                        }}
                                                        title="ביטול"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-gray-500" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Select
                                                    value={formData.packageName || ''}
                                                    onValueChange={(value) => {
                                                        if (value === 'NEW') {
                                                            setIsAddingPackage(true)
                                                            setFormData({ ...formData, packageName: '' })
                                                        } else {
                                                            setFormData({ ...formData, packageName: value })
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700">
                                                        <SelectValue placeholder="בחר חבילה או צור חדשה" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Array.from(new Set(clients.map((c: any) => c.packageName).filter(Boolean))).map((pkg: any) => (
                                                            <SelectItem key={pkg} value={pkg}>{pkg}</SelectItem>
                                                        ))}
                                                        <SelectItem value="NEW" className="text-green-600 font-medium">
                                                            + הוסף חדש
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                סוג מנוי
                                            </label>
                                            <Select
                                                value={formData.subscriptionType || ''}
                                                onValueChange={(value) => setFormData({ ...formData, subscriptionType: value })}
                                            >
                                                <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700">
                                                    <SelectValue placeholder="בחר סוג מנוי" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="WEEKLY">שבועי</SelectItem>
                                                    <SelectItem value="MONTHLY">חודשי</SelectItem>
                                                    <SelectItem value="YEARLY">שנתי</SelectItem>
                                                    <SelectItem value="PROJECT">פרויקט חד פעמי</SelectItem>
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
                                                מחיר מנוי / עסקה
                                            </label>
                                            <FormattedNumberInput
                                                value={formData.subscriptionPrice?.toString() || ''}
                                                onChange={(e) => setFormData({ ...formData, subscriptionPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                                                placeholder="0.00"
                                                className="w-full bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                סטטוס תשלום
                                            </label>
                                            <Select
                                                value={formData.subscriptionStatus || ''}
                                                onValueChange={(value) => setFormData({ ...formData, subscriptionStatus: value })}
                                            >
                                                <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700">
                                                    <SelectValue placeholder="בחר סטטוס" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="PAID">שולם</SelectItem>
                                                    <SelectItem value="UNPAID">לא שולם</SelectItem>
                                                    <SelectItem value="PARTIAL">שולם חלקית</SelectItem>
                                                    <SelectItem value="INSTALLMENTS">בתשלומים</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                    </div>


                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            ח.פ / ע.מ (ללקוחות עסקיים)
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
                                            placeholder="מספר חברה / עוסק"
                                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100 ${errors.taxId ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">שדה רשות - נדרש רק עבור הפקת חשבוניות מס ללקוח עסקי</p>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            מיקום האירוע / שירות (אופציונלי)
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <input
                                                type="text"
                                                value={formData.eventLocation || ''}
                                                onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
                                                placeholder="לדוגמה: אולם אירועים, משרדי החברה"
                                                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">מלא רק במידה והשירות ניתן פיזית במיקום מסויים</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" className="bg-green-600 hover:bg-green-700">
                                {editingClient ? 'עדכן' : 'הוסף'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowForm(false)
                                    setEditingClient(null)
                                    setErrors({})
                                }}
                            >
                                ביטול
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Clients List */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClients.map((client: any) => (
                        <div
                            key={client.id}
                            className="bg-white p-5 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow dark:bg-slate-800 dark:border-slate-700"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-green-600" />
                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{client.name}</h3>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleEdit(client)}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                                        title="ערוך"
                                    >
                                        <Edit2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const res = await syncClientIncomes(client.id)
                                            if (res.success) toast.success('הכנסות סונכרנו בהצלחה')
                                            else toast.error('שגיאה בסנכרון')
                                        }}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                                        title="סנכרן הכנסות ממנוי"
                                    >
                                        <RefreshCw className="h-4 w-4 text-blue-600" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(client.id)}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                                        title="מחק"
                                    >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </button>
                                    <button
                                        onClick={() => setSubscriptionDialogClient(client)}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                                        title="היסטוריית תשלומים"
                                    >
                                        <List className="h-4 w-4 text-purple-600" />
                                    </button>
                                </div>
                            </div>

                            {/* Smart Status Badges */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {client.isActive === false && (
                                    <Badge variant="secondary" className="bg-gray-200 text-gray-600 border-gray-300">
                                        לא פעיל
                                    </Badge>
                                )}
                                {client.packageName && (
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                                        {client.packageName}
                                    </Badge>
                                )}

                                {client.subscriptionStatus === 'PAID' && (
                                    <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">שולם</Badge>
                                )}
                                {client.subscriptionStatus === 'UNPAID' && (
                                    <Badge variant="destructive">לא שולם</Badge>
                                )}
                                {client.subscriptionStatus === 'PARTIAL' && (
                                    <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50">שולם חלקית</Badge>
                                )}
                                {client.subscriptionStatus === 'INSTALLMENTS' && (
                                    <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50">בתשלומים</Badge>
                                )}

                                {/* Expiration Warning */}
                                {client.subscriptionEnd && (() => {
                                    const end = startOfDay(new Date(client.subscriptionEnd))
                                    const today = startOfDay(new Date())
                                    const daysLeft = differenceInDays(end, today)

                                    if (daysLeft < 0) return <Badge variant="destructive">מנוי הסתיים</Badge>
                                    if (daysLeft <= warningDays) return <Badge variant="outline" className="border-red-500 text-red-600 bg-red-50">מסתיים בקרוב ({daysLeft} ימים)</Badge>
                                    if (daysLeft <= 30) return <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50">מסתיים בעוד חודש</Badge>
                                    return null
                                })()}
                            </div>

                            {client.taxId && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">ח.פ: {client.taxId}</p>
                            )}

                            {client.email && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    <Mail className="h-4 w-4" />
                                    <span>{client.email}</span>
                                </div>
                            )}

                            {client.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    <Phone className="h-4 w-4" />
                                    <span>{client.phone}</span>
                                </div>
                            )}

                            {/* Financial Stats */}
                            <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">הכנסות:</span>
                                    <span className="font-semibold text-green-600">₪{client.totalRevenue?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">הוצאות:</span>
                                    <span className="font-semibold text-red-600">₪{client.totalExpenses?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-bold bg-gray-50 dark:bg-slate-700/50 p-1 rounded mt-1">
                                    <span className="text-gray-700 dark:text-gray-300">רווח נקי:</span>
                                    <span className={`${(client.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ₪{client.netProfit?.toLocaleString() || 0}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t pt-3 mt-3 dark:border-slate-700">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">סה"כ הכנסות:</span>
                                    <span className="font-semibold text-green-600">
                                        ₪{client.totalRevenue?.toLocaleString() || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                    <span className="text-gray-600 dark:text-gray-400">עסקאות:</span>
                                    <span className="font-semibold dark:text-gray-200">{client._count?.incomes || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">שם לקוח</th>
                                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">פרטי התקשרות</th>
                                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">חבילה / סטטוס</th>
                                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">הכנסות</th>
                                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">פעולות</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {filteredClients.map((client: any) => (
                                    <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-green-600 shrink-0" />
                                                <span className="font-medium">{client.name}</span>
                                            </div>
                                            {client.taxId && <div className="text-xs text-gray-400 mr-6">{client.taxId}</div>}
                                            {/* Mobile only revenue */}
                                            <div className="sm:hidden mt-1 mr-6 text-xs text-green-600 font-medium">
                                                ₪{client.totalRevenue?.toLocaleString() || 0}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1">
                                                {client.phone && (
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                                                        <Phone className="h-3 w-3 shrink-0" />
                                                        <span dir="ltr" className="text-right">{client.phone}</span>
                                                    </div>
                                                )}
                                                {client.email && (
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                                                        <Mail className="h-3 w-3 shrink-0" />
                                                        <span className="truncate max-w-[120px]">{client.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1.5">
                                                {client.packageName && (
                                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] px-1.5 py-0 h-5 whitespace-nowrap">
                                                        {client.packageName}
                                                    </Badge>
                                                )}
                                                {client.subscriptionStatus && (
                                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 whitespace-nowrap ${client.subscriptionStatus === 'PAID' ? 'border-green-500 text-green-600 bg-green-50' :
                                                        client.subscriptionStatus === 'UNPAID' ? 'border-red-500 text-red-600 bg-red-50' :
                                                            'border-orange-500 text-orange-600 bg-orange-50'
                                                        }`}>
                                                        {client.subscriptionStatus === 'PAID' ? 'שולם' : client.subscriptionStatus === 'UNPAID' ? 'לא שולם' : 'אחר'}
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <div className="font-medium text-green-600">₪{client.totalRevenue?.toLocaleString() || 0}</div>
                                            <div className="text-xs text-gray-500">{client._count?.incomes || 0} עסקאות</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(client)}>
                                                    <Edit2 className="h-4 w-4 text-gray-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600" onClick={() => handleDelete(client.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {
                filteredClients.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        {searchTerm ? 'לא נמצאו לקוחות' : 'אין לקוחות עדיין. הוסף לקוח חדש כדי להתחיל.'}
                    </div>
                )
            }
            {/* Subscription History Dialog */}
            <ClientSubscriptionHistoryDialog
                isOpen={!!subscriptionDialogClient}
                onClose={() => setSubscriptionDialogClient(null)}
                client={subscriptionDialogClient}
            />
        </div>
    )
}
