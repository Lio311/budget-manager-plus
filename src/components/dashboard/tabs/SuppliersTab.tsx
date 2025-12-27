'use client'

import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, Phone, Mail, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, type SupplierFormData } from '@/lib/actions/suppliers'
import useSWR from 'swr'
import { toast } from 'sonner'
import { useBudget } from '@/contexts/BudgetContext'

export function SuppliersTab() {
    const { budgetType } = useBudget()
    const [searchTerm, setSearchTerm] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState<any>(null)
    const [formData, setFormData] = useState<SupplierFormData>({
        name: '',
        email: '',
        phone: '',
        taxId: '',
        address: '',
        notes: ''
    })

    const fetcher = async () => {
        const result = await getSuppliers(budgetType)
        return result.data || []
    }

    const { data: suppliers = [], isLoading, mutate } = useSWR(['suppliers', budgetType], fetcher)

    const filteredSuppliers = suppliers.filter((supplier: any) =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.phone?.includes(searchTerm)
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            let result
            if (editingSupplier) {
                result = await updateSupplier(editingSupplier.id, formData)
            } else {
                result = await createSupplier(formData, budgetType)
            }

            if (result.success) {
                toast.success(editingSupplier ? 'ספק עודכן בהצלחה' : 'ספק נוסף בהצלחה')
                setShowForm(false)
                setEditingSupplier(null)
                setFormData({ name: '', email: '', phone: '', taxId: '', address: '', notes: '' })
                mutate()
            } else {
                toast.error(result.error || 'שגיאה')
            }
        } catch (error) {
            toast.error('שגיאה בשמירת הספק')
        }
    }

    const handleEdit = (supplier: any) => {
        setEditingSupplier(supplier)
        setFormData({
            name: supplier.name,
            email: supplier.email || '',
            phone: supplier.phone || '',
            taxId: supplier.taxId || '',
            address: supplier.address || '',
            notes: supplier.notes || ''
        })
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק ספק זה?')) return

        const result = await deleteSupplier(id)
        if (result.success) {
            toast.success('ספק נמחק בהצלחה')
            mutate()
        } else {
            toast.error(result.error || 'שגיאה במחיקת הספק')
        }
    }

    if (isLoading) {
        return <div className="flex items-center justify-center h-64">טוען...</div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">ספקים</h2>
                    <p className="text-sm text-gray-500 mt-1">ניהול ספקים ותשלומים</p>
                </div>
                <Button
                    onClick={() => {
                        setShowForm(true)
                        setEditingSupplier(null)
                        setFormData({ name: '', email: '', phone: '', taxId: '', address: '', notes: '' })
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
                    className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">
                        {editingSupplier ? 'עריכת ספק' : 'ספק חדש'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    שם ספק *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ח.פ / ע.מ
                                </label>
                                <input
                                    type="text"
                                    value={formData.taxId}
                                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    אימייל
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    טלפון
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                />
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                הערות
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
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
                        className="bg-white p-5 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-blue-600" />
                                <h3 className="font-semibold text-lg text-gray-900">{supplier.name}</h3>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleEdit(supplier)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Edit2 className="h-4 w-4 text-gray-600" />
                                </button>
                                <button
                                    onClick={() => handleDelete(supplier.id)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                </button>
                            </div>
                        </div>

                        {supplier.taxId && (
                            <p className="text-sm text-gray-600 mb-2">ח.פ: {supplier.taxId}</p>
                        )}

                        {supplier.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                <Mail className="h-4 w-4" />
                                <span>{supplier.email}</span>
                            </div>
                        )}

                        {supplier.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                <Phone className="h-4 w-4" />
                                <span>{supplier.phone}</span>
                            </div>
                        )}

                        <div className="border-t pt-3 mt-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">סה"כ עלויות:</span>
                                <span className="font-semibold text-blue-600">
                                    ₪{supplier.totalExpenses?.toLocaleString() || 0}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                                <span className="text-gray-600">עסקאות:</span>
                                <span className="font-semibold">{supplier._count?.expenses || 0}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredSuppliers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    {searchTerm ? 'לא נמצאו ספקים' : 'אין ספקים עדיין. הוסף ספק חדש כדי להתחיל.'}
                </div>
            )}
        </div>
    )
}
