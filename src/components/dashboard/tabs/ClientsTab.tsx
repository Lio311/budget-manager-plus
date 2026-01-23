'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, Phone, Mail, Building2, ChevronDown, MapPin, Settings, ArrowUpDown, LayoutGrid, List, RefreshCw, Check, Upload, FileSpreadsheet, FileText, Receipt, CreditCard, Info } from 'lucide-react'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { read, utils } from 'xlsx'
import { importClients } from '@/lib/actions/import-clients'
import { ISRAELI_CITIES, ISRAELI_BANKS } from '@/lib/constants/israel-data'
import { ClientDetailsDialog } from './ClientDetailsDialog'
import { Button } from '@/components/ui/button'
import { getClients, createClient, updateClient, deleteClient, syncClientIncomes, type ClientFormData } from '@/lib/actions/clients'
import { getClientPackages } from '@/lib/actions/packages'
import { PackagesManager } from '@/components/dashboard/settings/PackagesManager'
import { useOptimisticDelete, useOptimisticMutation } from '@/hooks/useOptimisticMutation'
import useSWR from 'swr'
import { toast } from 'sonner'
import { useBudget } from '@/contexts/BudgetContext'
import { z } from 'zod'
import { useConfirm } from '@/hooks/useConfirm'
import { useDemo } from '@/contexts/DemoContext'
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput'
import { DatePicker } from '@/components/ui/date-picker'
import { formatCurrency } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { format, differenceInDays, startOfDay } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { PhoneInputWithCountry } from '@/components/ui/PhoneInputWithCountry'
import { Input } from '@/components/ui/input'
import { ClientSubscriptionHistoryDialog } from '@/components/dashboard/dialogs/ClientSubscriptionHistoryDialog'
import { Switch } from '@/components/ui/switch'
import { cn, formatIsraeliPhoneNumber } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RenewSubscriptionDialog } from '@/components/dashboard/dialogs/RenewSubscriptionDialog'
import { ComboboxInput } from '@/components/ui/combobox-input'
import { FloatingActionButton } from '@/components/ui/floating-action-button'
import { ClientsTutorial } from '@/components/dashboard/tutorial/ClientsTutorial'

const ClientSchema = z.object({
    name: z.string().min(2, 'שם הלקוח חייב להכיל לפחות 2 תווים').max(100, 'שם הלקוח ארוך מדי'),
    email: z.string().email('כתובת אימייל לא תקינה').max(100).optional().or(z.literal('')),
    phone: z.string().max(30).optional().or(z.literal('')),
    taxId: z.string().regex(/^\d*$/, 'ח.פ/ע.מ חייב להכיל ספרות בלבד').max(20).optional().or(z.literal('')),
    address: z.string().max(200, 'הכתובת ארוכה מדי').optional().or(z.literal('')),
    notes: z.string().max(500, 'הערות ארוכות מדי').optional().or(z.literal('')),
    city: z.string().max(100).optional().or(z.literal('')),
    bankName: z.string().max(100).optional().or(z.literal('')),
    bankBranch: z.string().max(20).optional().or(z.literal('')),
    bankAccount: z.string().max(50).optional().or(z.literal('')),
})




export function ClientsTab() {
    const { budgetType } = useBudget()
    const confirm = useConfirm()
    const [searchTerm, setSearchTerm] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingClient, setEditingClient] = useState<any>(null)
    const [selectedClientDetails, setSelectedClientDetails] = useState<any>(null)
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
        subscriptionColor: '#3B82F6',
        packageId: '',
        isActive: true,
        city: '',
        bankName: '',
        bankBranch: '',
        bankAccount: ''
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isAddingPackage, setIsAddingPackage] = useState(false)
    const [showPackagesManager, setShowPackagesManager] = useState(false)
    const [packages, setPackages] = useState<any[]>([])

    // Fetch packages
    useEffect(() => {
        const loadPackages = async () => {
            const res = await getClientPackages()
            if (res.success && res.data) {
                setPackages(res.data)
            }
        }
        if (showForm || showPackagesManager) {
            loadPackages()
        }
    }, [showForm, showPackagesManager])

    const [warningDays, setWarningDays] = useState(14)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [subscriptionDialogClient, setSubscriptionDialogClient] = useState<any>(null)
    const [renewSubscriptionClient, setRenewSubscriptionClient] = useState<any>(null)
    const [showTutorial, setShowTutorial] = useState(false)

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
    const [sortMethod, setSortMethod] = useState<'CREATED_AT' | 'REVENUE' | 'EXPIRY' | 'VALUE' | 'NAME' | 'STATUS' | 'ACTIVITY' | 'PACKAGE'>('NAME') // Default to NAME for better UX
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
            // Always prioritize Active over Inactive
            const activeA = a.isActive ?? true
            const activeB = b.isActive ?? true
            if (activeA !== activeB) {
                return activeA ? -1 : 1
            }

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
                case 'ACTIVITY':
                    // Already handled by top-level active check
                    break
                case 'STATUS':
                    // Then by payment status
                    const statusPriority: Record<string, number> = { 'UNPAID': 3, 'PARTIAL': 2, 'INSTALLMENTS': 1, 'PAID': 0 }
                    const cleanStatusA = a.subscriptionStatus || 'PAID'
                    const cleanStatusB = b.subscriptionStatus || 'PAID'
                    diff = (statusPriority[cleanStatusA] || 0) - (statusPriority[cleanStatusB] || 0)
                    break
                case 'NAME':
                    // We only apply direction to the name sort itself here
                    const nameA = a.name || ''
                    const nameB = b.name || ''
                    if (sortDirection === 'asc') {
                        return nameA.localeCompare(nameB)
                    } else {
                        return nameB.localeCompare(nameA)
                    }
                case 'PACKAGE':
                    const pkgA = a.package?.name || a.packageName || ''
                    const pkgB = b.package?.name || b.packageName || ''
                    if (sortDirection === 'asc') {
                        return pkgA.localeCompare(pkgB)
                    } else {
                        return pkgB.localeCompare(pkgA)
                    }
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
                    setFormData({ name: '', email: '', phone: '', taxId: '', address: '', notes: '', packageName: '', subscriptionType: '', subscriptionPrice: '', subscriptionStart: undefined, subscriptionEnd: undefined, subscriptionStatus: '', eventLocation: '', isActive: true, city: '', bankName: '', bankBranch: '', bankAccount: '' })
                    mutate()
                } else {
                    toast.error(result.error || 'שגיאה')
                }
            } else {
                await optimisticCreateClient(formData)
                setShowForm(false)
                setShowForm(false)
                setFormData({ name: '', email: '', phone: '', taxId: '', address: '', notes: '', packageName: '', subscriptionType: '', subscriptionPrice: '', subscriptionStart: undefined, subscriptionEnd: undefined, subscriptionStatus: '', eventLocation: '', subscriptionColor: '#3B82F6', city: '', bankName: '', bankBranch: '', bankAccount: '' })
            }
        } catch (error) {
            // Error handled by hook or update logic
        }
    }

    const handleEdit = (client: any) => {
        // Stop propagation if event is passed (though usually called from button click wrapper)
        // Ensure phone is formatted to international if it's local, so PhoneInput detects country (IL)
        const formattedPhone = client.phone ? formatIsraeliPhoneNumber(client.phone) : ''

        setEditingClient(client)
        setErrors({})
        setFormData({
            name: client.name,
            email: client.email || '',
            phone: formattedPhone || '',
            taxId: client.taxId || '',
            address: client.address || '',
            city: client.city || '',
            bankName: client.bankName || '',
            bankBranch: client.bankBranch || '',
            bankAccount: client.bankAccount || '',

            notes: client.notes || '',
            packageName: client.packageName || '',
            subscriptionType: client.subscriptionType || '',
            subscriptionPrice: client.subscriptionPrice || '',
            subscriptionStart: client.subscriptionStart,
            subscriptionEnd: client.subscriptionEnd,
            subscriptionStatus: client.subscriptionStatus || '',
            eventLocation: client.eventLocation || '',
            subscriptionColor: client.subscriptionColor || '#3B82F6',
            packageId: client.packageId || '',
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            const data = await file.arrayBuffer()
            const workbook = read(data)
            const worksheet = workbook.Sheets[workbook.SheetNames[0]]
            const jsonData = utils.sheet_to_json(worksheet)

            const result = await importClients(jsonData, budgetType)

            if (result.success) {
                toast.success(`יובאו בהצלחה ${result.count} לקוחות (${result.skipped} דלגו)`)
                mutate()
            } else {
                toast.error(result.error || 'שגיאה ביבוא')
            }
        } catch (error) {
            console.error('Import Error:', error)
            toast.error('שגיאה בקריאת הקובץ')
        } finally {
            // Reset input
            e.target.value = ''
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

                {/* Mobile FAB */}
                <div className="lg:hidden">
                    <FloatingActionButton
                        id="clients-add-fab"
                        onClick={() => {
                            setShowForm(true)
                            setEditingClient(null)
                            setErrors({})
                            setEditingClient(null)
                            setErrors({})
                            setIsAddingPackage(false)
                            setFormData({ name: '', email: '', phone: '', taxId: '', address: '', notes: '', packageName: '', subscriptionType: '', subscriptionPrice: '', subscriptionStart: undefined, subscriptionEnd: undefined, subscriptionStatus: '', eventLocation: '', subscriptionColor: '#3B82F6', packageId: '', isActive: true, city: '', bankName: '', bankBranch: '', bankAccount: '' })
                        }}
                        label="לקוח חדש"
                        colorClass="bg-green-600"
                    />
                </div>

                <div className="flex gap-2">
                    <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                id="clients-settings-btn"
                            >
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
                                            onWheel={(e) => e.currentTarget.blur()}
                                            onChange={(e) => handleSaveSettings(parseInt(e.target.value))}
                                            className="col-span-2 h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                    <Button onClick={() => setIsSettingsOpen(false)} className="w-full mt-2">
                                        שמור וסגור
                                    </Button>

                                    <div className="relative my-2">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-background px-2 text-muted-foreground">או</span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => {
                                            setIsSettingsOpen(false)
                                            setShowPackagesManager(true)
                                        }}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        ניהול חבילות וקטגוריות
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <div className="relative">
                        <input
                            type="file"
                            id="import-clients"
                            accept=".csv, .xlsx, .xls"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                        <Button
                            id="clients-import-btn"
                            variant="outline"
                            className="gap-2 border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 px-3 sm:px-4"
                            onClick={() => document.getElementById('import-clients')?.click()}
                        >
                            <span className="hidden sm:inline">ייבוא לקוחות</span>
                            <Upload className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button
                        onClick={() => {
                            setShowForm(true)
                            setEditingClient(null)
                            setErrors({})
                            setEditingClient(null)
                            setErrors({})
                            setIsAddingPackage(false)
                            setFormData({ name: '', email: '', phone: '', taxId: '', address: '', notes: '', packageName: '', subscriptionType: '', subscriptionPrice: '', subscriptionStart: undefined, subscriptionEnd: undefined, subscriptionStatus: '', eventLocation: '', subscriptionColor: '#3B82F6', packageId: '', isActive: true, city: '', bankName: '', bankBranch: '', bankAccount: '' })
                        }}
                        className="bg-green-600 hover:bg-green-700 hidden lg:flex"
                        id="clients-add-btn"
                    >
                        <Plus className="h-4 w-4 ml-2" />
                        לקוח חדש
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white"
                        onClick={() => setShowTutorial(true)}
                        title="הדרכה"
                    >
                        <Info className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <Dialog open={showPackagesManager} onOpenChange={setShowPackagesManager}>
                <PackagesManager />
            </Dialog>
            {/* Search and Sort Section */}
            <div className="space-y-4">
                <div className="relative" id="clients-search-bar">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="חיפוש לקוח..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100 dark:placeholder:text-gray-400 text-base md:text-sm"
                    />
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    {/* Sort Dropdown & Toggle */}
                    <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4">
                        <div className="flex items-center gap-2" id="clients-sort-controls">
                            <span className="text-sm text-gray-500 font-medium hidden xs:inline">מיון:</span>
                            <Select value={sortMethod} onValueChange={(val: any) => setSortMethod(val)}>
                                <SelectTrigger className="w-[110px] sm:w-[140px] h-9 gap-1 sm:gap-2 text-xs sm:text-sm">
                                    <SelectValue placeholder="מיון לפי" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NAME">שם לקוח</SelectItem>
                                    <SelectItem value="CREATED_AT">תאריך הצטרפות</SelectItem>
                                    <SelectItem value="REVENUE">הכנסות</SelectItem>
                                    <SelectItem value="ACTIVITY">סטטוס לקוח</SelectItem>
                                    <SelectItem value="STATUS">סטטוס תשלום</SelectItem>
                                    <SelectItem value="PACKAGE">סוג חבילה</SelectItem>
                                    {/* Only show these if at least one client has subscription data */}
                                    {clients.some((c: any) => c.subscriptionEnd || c.subscriptionPrice) && (
                                        <>
                                            <SelectItem value="EXPIRY">תוקף מנוי</SelectItem>
                                            <SelectItem value="VALUE">רווחיות</SelectItem>
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
                        <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-lg p-1 border border-gray-200 dark:border-slate-700" id="clients-view-toggle">
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

            <ClientDetailsDialog
                client={selectedClientDetails}
                isOpen={!!selectedClientDetails}
                onClose={() => setSelectedClientDetails(null)}
            />

            {/* Form Dialog */}
            <Dialog open={showForm} onOpenChange={(open) => {
                if (!open) {
                    setShowForm(false)
                    setEditingClient(null)
                    setErrors({})
                }
            }}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingClient ? 'עריכת לקוח' : 'לקוח חדש'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            {/* Row 1: Name and Active Status */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
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
                                </div>
                                <div className="mt-7 flex items-center justify-between gap-4 border p-2 rounded-md bg-gray-50 dark:bg-slate-800/50 h-[42px]">
                                    <Label htmlFor="active-mode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {formData.isActive ? 'לקוח פעיל' : 'לקוח לא פעיל'}
                                    </Label>
                                    <Switch
                                        id="active-mode"
                                        checked={formData.isActive ?? true}
                                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Email and Phone */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    עיר
                                </label>
                                <ComboboxInput
                                    value={formData.city}
                                    onChange={(val) => setFormData({ ...formData, city: val })}
                                    options={ISRAELI_CITIES}
                                    placeholder="בחר עיר..."
                                />
                            </div>
                        </div>

                        {/* Bank Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50/50 dark:bg-slate-800/50">
                            <div className="md:col-span-3 mb-[-5px]">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    פרטי חשבון בנק (אופציונלי)
                                </h4>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    בנק
                                </label>
                                <ComboboxInput
                                    value={formData.bankName}
                                    onChange={(val) => setFormData({ ...formData, bankName: val })}
                                    options={ISRAELI_BANKS.map(b => `${b.name} - ${b.code}`)}
                                    placeholder="בחר בנק..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    מספר סניף
                                </label>
                                <input
                                    type="text"
                                    value={formData.bankBranch}
                                    onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100"
                                    placeholder="מספר סניף"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    מספר חשבון
                                </label>
                                <input
                                    type="text"
                                    value={formData.bankAccount || ''}
                                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100 ${errors.bankAccount ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="מספר חשבון"
                                />
                            </div>
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

                                        <div className="grid grid-cols-[1fr,auto] gap-2 items-end">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    שם חבילה / שירות
                                                </label>
                                                <Select
                                                    value={formData.packageId || 'NONE'}
                                                    onValueChange={(value) => {
                                                        if (value === 'NEW_PACKAGE') {
                                                            setShowPackagesManager(true)
                                                            return
                                                        }

                                                        if (value === 'NONE') {
                                                            setFormData({ ...formData, packageId: '', packageName: '', subscriptionColor: '#3B82F6' })
                                                        } else {
                                                            const pkg = packages.find(p => p.id === value)
                                                            if (pkg) {
                                                                setFormData({
                                                                    ...formData,
                                                                    packageId: pkg.id,
                                                                    packageName: pkg.name,
                                                                    subscriptionColor: pkg.color
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
                                                    setDate={(date) => {
                                                        if (!date) {
                                                            setFormData({ ...formData, subscriptionStart: undefined })
                                                            return
                                                        }
                                                        const now = new Date()
                                                        const dateWithTime = new Date(date)
                                                        dateWithTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds())
                                                        setFormData({ ...formData, subscriptionStart: dateWithTime })
                                                    }}
                                                    placeholder="בחר תאריך התחלה"
                                                />
                                            </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                תאריך סיום (אופציונלי)
                                            </label>
                                            <div className="w-full">
                                                <DatePicker
                                                    date={formData.subscriptionEnd ? new Date(formData.subscriptionEnd) : undefined}
                                                    setDate={(date) => {
                                                        if (!date) {
                                                            setFormData({ ...formData, subscriptionEnd: undefined })
                                                            return
                                                        }
                                                        const now = new Date()
                                                        const dateWithTime = new Date(date)
                                                        dateWithTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds())
                                                        setFormData({ ...formData, subscriptionEnd: dateWithTime })
                                                    }}
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
                </DialogContent>
            </Dialog>

            {/* Clients List */}
            {
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="clients-list-container">
                        {filteredClients.map((client: any) => (
                            <div
                                key={client.id}
                                onClick={() => setSelectedClientDetails(client)}
                                className="bg-white p-4 sm:p-5 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow dark:bg-slate-800 dark:border-slate-700 cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2 flex-1 min-w-0 ml-2">
                                        <Building2 className="h-5 w-5 text-green-600 shrink-0" />
                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 break-words line-clamp-2 md:line-clamp-1">{client.name}</h3>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setSubscriptionDialogClient(client)
                                            }}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                                            title="היסטוריית תשלומים"
                                        >
                                            <List className="h-4 w-4 text-purple-600" />
                                        </button>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setRenewSubscriptionClient(client)
                                            }}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                                            title="חדש מנוי"
                                        >
                                            <RefreshCw className="h-4 w-4 text-blue-600" />
                                        </button>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleEdit(client)
                                            }}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                                            title="ערוך"
                                        >
                                            <Edit2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDelete(client.id)
                                            }}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                                            title="מחק"
                                        >
                                            <Trash2 className="h-4 w-4 text-red-600" />
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
                                    {(client.package?.name || client.packageName) && (
                                        <Badge
                                            variant="secondary"
                                            style={{
                                                backgroundColor: (client.package?.color || client.subscriptionColor || '#3B82F6'),
                                                color: '#ffffff'
                                            }}
                                            className="hover:opacity-90 transition-opacity border-transparent"
                                        >
                                            {client.package?.name || client.packageName}
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
                                        <span dir="ltr" className="text-left">{formatIsraeliPhoneNumber(client.phone)}</span>
                                    </div>
                                )}

                                {/* Financial Stats */}
                                <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">הכנסות:</span>
                                        <span className="font-semibold text-green-600">{formatCurrency(client.totalRevenue || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">הוצאות:</span>
                                        <span className="font-semibold text-red-600">{formatCurrency(client.totalExpenses || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-bold bg-gray-50 dark:bg-slate-700/50 p-1 rounded mt-1">
                                        <span className="text-gray-700 dark:text-gray-300">רווח נקי:</span>
                                        <span className={`${(client.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(client.netProfit || 0)}
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t pt-3 mt-3 dark:border-slate-700">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">סה"כ הכנסות:</span>
                                        <span className="font-semibold text-green-600">
                                            {formatCurrency(client.totalRevenue || 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-1">
                                        <span className="text-gray-600 dark:text-gray-400">עסקאות:</span>
                                        <span className="font-semibold dark:text-gray-200">{client._count?.incomes || 0}</span>
                                    </div>
                                </div>

                                {/* Document Counts */}
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                                    <div className="flex items-center gap-1" title="הצעת מחיר">
                                        <FileText className="h-3.5 w-3.5 text-yellow-600" />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">{client.quotesCount || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1" title="חשבונית">
                                        <Receipt className="h-3.5 w-3.5 text-purple-600" />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">{client.invoicesCount || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1" title="זיכוי">
                                        <CreditCard className="h-3.5 w-3.5 text-orange-600" />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">{client.creditNotesCount || 0}</span>
                                    </div>

                                </div>
                            </div>

                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-slate-800 dark:border-slate-700 overflow-hidden" id="clients-list-container">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm whitespace-nowrap">
                                <thead className="bg-gray-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">שם לקוח</th>
                                        <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">פרטי התקשרות</th>
                                        <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">חבילה / סטטוס</th>
                                        <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">הכנסות</th>
                                        <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">הוצאות</th>
                                        <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">רווח נקי</th>
                                        <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-center">פעולות</th>
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
                                                    {formatCurrency(client.totalRevenue || 0)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1">
                                                    {client.phone && (
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                                                            <Phone className="h-3 w-3 shrink-0" />
                                                            <span dir="ltr" className="text-left">{formatIsraeliPhoneNumber(client.phone)}</span>
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
                                                    {(client.package?.name || client.packageName) && (
                                                        <Badge
                                                            variant="secondary"
                                                            style={{
                                                                backgroundColor: (client.package?.color || client.subscriptionColor || '#3B82F6'),
                                                                color: '#ffffff'
                                                            }}
                                                            className="text-[10px] px-1.5 py-0 h-5 whitespace-nowrap hover:opacity-90 transition-opacity border-transparent"
                                                        >
                                                            {client.package?.name || client.packageName}
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
                                                <div className="font-medium text-green-600">{formatCurrency(client.totalRevenue || 0)}</div>
                                                <div className="text-xs text-gray-500">{client._count?.incomes || 0} עסקאות</div>
                                            </td>
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                <div className="font-medium text-red-600">{formatCurrency(client.totalExpenses || 0)}</div>
                                                <div className="text-xs text-gray-500">{client._count?.expenses || 0} הוצאות</div>
                                            </td>
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                <div className={cn("font-medium", (client.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600')}>
                                                    {formatCurrency(client.netProfit || 0)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1 justify-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 hover:text-purple-600 hover:bg-purple-50"
                                                        onClick={() => setSubscriptionDialogClient(client)}
                                                        title="היסטוריית תשלומים"
                                                    >
                                                        <List className="h-4 w-4" />
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 hover:text-blue-600 hover:bg-blue-50"
                                                        onClick={() => setRenewSubscriptionClient(client)}
                                                        title="חדש מנוי"
                                                    >
                                                        <RefreshCw className="h-4 w-4" />
                                                    </Button>

                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900" onClick={() => handleEdit(client)}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(client.id)}>
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
                )
            }

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
                onUpdate={() => mutate()}
            />

            <RenewSubscriptionDialog
                isOpen={!!renewSubscriptionClient}
                onClose={() => setRenewSubscriptionClient(null)}
                client={renewSubscriptionClient}
                onSuccess={() => mutate()}
            />

            <ClientsTutorial
                isOpen={showTutorial}
                onClose={() => setShowTutorial(false)}
            />
        </div >
    )
}
