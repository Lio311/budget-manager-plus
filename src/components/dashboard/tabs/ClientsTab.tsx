'use client'

import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, Phone, Mail, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getClients, createClient, updateClient, deleteClient, type ClientFormData } from '@/lib/actions/clients'
import { useOptimisticDelete, useOptimisticMutation } from '@/hooks/useOptimisticMutation'
import useSWR from 'swr'
import { toast } from 'sonner'
import { useBudget } from '@/contexts/BudgetContext'
import { z } from 'zod'

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
    const [searchTerm, setSearchTerm] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingClient, setEditingClient] = useState<any>(null)
    const [formData, setFormData] = useState<ClientFormData>({
        name: '',
        email: '',
        phone: '',
        taxId: '',
        address: '',
        notes: ''
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

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

    const { data: clients = [], isLoading, mutate } = useSWR(['clients', budgetType], fetcher)

    const filteredClients = clients.filter((client: any) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm)
    )

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
                    _count: { incomes: 0 }
                },
                ...current
            ],
            successMessage: 'לקוח נוסף בהצלחה',
            errorMessage: 'שגיאה בהוספת הלקוח'
        }
    )

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

        if (!validateForm()) {
            toast.error('אנא דאג לתקן את השגיאות בטופס')
            return
        }

        try {
            if (editingClient) {
                const result = await updateClient(editingClient.id, formData)
                if (result.success) {
                    toast.success('לקוח עודכן בהצלחה')
                    setShowForm(false)
                    setEditingClient(null)
                    setFormData({ name: '', email: '', phone: '', taxId: '', address: '', notes: '' })
                    mutate()
                } else {
                    toast.error(result.error || 'שגיאה')
                }
            } else {
                await optimisticCreateClient(formData)
                setShowForm(false)
                setFormData({ name: '', email: '', phone: '', taxId: '', address: '', notes: '' })
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
            notes: client.notes || ''
        })
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק לקוח זה?')) return

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
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
                            <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-3" />
                            <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mb-2" />
                            <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse mb-2" />
                            <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                        </div>
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
                <Button
                    onClick={() => {
                        setShowForm(true)
                        setEditingClient(null)
                        setErrors({})
                        setFormData({ name: '', email: '', phone: '', taxId: '', address: '', notes: '' })
                    }}
                    className="bg-green-600 hover:bg-green-700"
                >
                    <Plus className="h-4 w-4 ml-2" />
                    לקוח חדש
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                    type="text"
                    placeholder="חיפוש לקוח..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">
                        {editingClient ? 'עריכת לקוח' : 'לקוח חדש'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    שם לקוח *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ח.פ / ע.מ
                                </label>
                                <input
                                    type="text"
                                    value={formData.taxId}
                                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 ${errors.taxId ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.taxId && <p className="text-red-500 text-xs mt-1">{errors.taxId}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    אימייל
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    טלפון
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                                    dir="rtl"
                                />
                                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                כתובת
                            </label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                הערות
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={3}
                                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 ${errors.notes ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes}</p>}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClients.map((client: any) => (
                    <div
                        key={client.id}
                        className="bg-white p-5 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-green-600" />
                                <h3 className="font-semibold text-lg text-gray-900">{client.name}</h3>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleEdit(client)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Edit2 className="h-4 w-4 text-gray-600" />
                                </button>
                                <button
                                    onClick={() => handleDelete(client.id)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                </button>
                            </div>
                        </div>

                        {client.taxId && (
                            <p className="text-sm text-gray-600 mb-2">ח.פ: {client.taxId}</p>
                        )}

                        {client.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                <Mail className="h-4 w-4" />
                                <span>{client.email}</span>
                            </div>
                        )}

                        {client.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                <Phone className="h-4 w-4" />
                                <span>{client.phone}</span>
                            </div>
                        )}

                        <div className="border-t pt-3 mt-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">סה"כ הכנסות:</span>
                                <span className="font-semibold text-green-600">
                                    ₪{client.totalRevenue?.toLocaleString() || 0}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                                <span className="text-gray-600">עסקאות:</span>
                                <span className="font-semibold">{client._count?.incomes || 0}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredClients.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    {searchTerm ? 'לא נמצאו לקוחות' : 'אין לקוחות עדיין. הוסף לקוח חדש כדי להתחיל.'}
                </div>
            )}
        </div>
    )
}
