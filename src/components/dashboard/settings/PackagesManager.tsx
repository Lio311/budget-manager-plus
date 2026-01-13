'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Plus, Trash2, Edit2, Save, X } from 'lucide-react'
import { getClientPackages, createClientPackage, updateClientPackage, deleteClientPackage } from '@/lib/actions/packages'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { PRESET_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface Package {
    id: string
    name: string
    color: string
    defaultPrice?: number | null
    defaultType?: string | null
}

interface PackagesManagerProps {
    onOpenChange?: (open: boolean) => void
}

export function PackagesManager({ onOpenChange }: PackagesManagerProps) {
    const [packages, setPackages] = useState<Package[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isCreating, setIsCreating] = useState(false)

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        color: '#3B82F6',
        defaultPrice: '' as string | number,
        defaultType: ''
    })

    const fetchPackages = async () => {
        setLoading(true)
        const res = await getClientPackages()
        if (res.success && res.data) {
            setPackages(res.data)
        } else {
            toast.error('Failed to load packages')
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchPackages()
    }, [])

    const resetForm = () => {
        setFormData({ name: '', color: '#3B82F6', defaultPrice: '', defaultType: '' })
        setEditingId(null)
        setIsCreating(false)
    }

    const handleSave = async () => {
        if (!formData.name) {
            toast.error('Name is required')
            return
        }

        const payload = {
            name: formData.name,
            color: formData.color,
            defaultPrice: formData.defaultPrice ? Number(formData.defaultPrice) : undefined,
            defaultType: formData.defaultType || undefined
        }

        if (isCreating) {
            const res = await createClientPackage(payload)
            if (res.success) {
                toast.success('Package created')
                fetchPackages()
                resetForm()
            } else {
                toast.error(res.error || 'Failed to create')
            }
        } else if (editingId) {
            const res = await updateClientPackage(editingId, payload)
            if (res.success) {
                toast.success('Package updated')
                fetchPackages()
                resetForm()
            } else {
                toast.error(res.error || 'Failed to update')
            }
        }
    }

    const startEdit = (pkg: Package) => {
        setEditingId(pkg.id)
        setIsCreating(false)
        setFormData({
            name: pkg.name,
            color: pkg.color,
            defaultPrice: pkg.defaultPrice || '',
            defaultType: pkg.defaultType || ''
        })
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure? Clients using this package will be unlinked.')) {
            const res = await deleteClientPackage(id)
            if (res.success) {
                toast.success('Package deleted')
                fetchPackages()
            } else {
                toast.error(res.error || 'Failed to delete')
            }
        }
    }

    return (
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>ניהול חבילות וקטגוריות</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-4">
                {/* List */}
                <div className="space-y-2">
                    {packages.map(pkg => (
                        <div key={pkg.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                            {editingId === pkg.id ? (
                                <div className="flex-1 grid gap-4 p-2 bg-white dark:bg-slate-900 rounded-md border border-blue-200">
                                    <div className="flex gap-4 items-start">
                                        <div>
                                            <Label>צבע</Label>
                                            <div className="flex flex-wrap gap-1.5 mt-2 w-[160px]">
                                                <div className="relative">
                                                    <input
                                                        type="color"
                                                        value={formData.color}
                                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                                        className="h-9 w-9 p-0 border-0 rounded-full overflow-hidden cursor-pointer"
                                                        title="בחר צבע מותאם אישית"
                                                    />
                                                </div>
                                                {PRESET_COLORS.map(color => (
                                                    <button
                                                        key={color.name}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, color: color.hex })}
                                                        className={cn(
                                                            "w-9 h-9 rounded-full transition-all border-2",
                                                            formData.color === color.hex
                                                                ? "border-gray-900 scale-110 shadow-sm"
                                                                : "border-transparent hover:scale-110"
                                                        )}
                                                        style={{ backgroundColor: color.hex }}
                                                        title={color.name}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <Label>שם החבילה</Label>
                                            <Input
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="שם החבילה"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="ghost" onClick={resetForm}>ביטול</Button>
                                        <Button size="sm" onClick={handleSave}>שמור שינויים</Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: pkg.color }}
                                        />
                                        <span className="font-medium">{pkg.name}</span>
                                        {pkg.defaultPrice && <Badge variant="outline">{pkg.defaultPrice}₪</Badge>}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button size="icon" variant="ghost" onClick={() => startEdit(pkg)}>
                                            <Edit2 className="h-4 w-4 text-blue-500" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleDelete(pkg.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}

                    {packages.length === 0 && !loading && (
                        <div className="text-center py-8 text-gray-500">
                            לא נמצאו חבילות. צור את החבילה הראשונה שלך.
                        </div>
                    )}
                </div>

                {/* Create New */}
                {isCreating ? (
                    <div className="border border-green-200 bg-green-50/50 dark:bg-green-900/20 p-4 rounded-lg space-y-4 animate-in fade-in">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium text-green-900 dark:text-green-100">יצירת חבילה חדשה</h4>
                            <Button size="icon" variant="ghost" onClick={resetForm}><X className="h-4 w-4" /></Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>שם החבילה</Label>
                                <Input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="לדוגמה: מנוי זהב"
                                />
                            </div>
                            <div>
                                <Label>צבע תגית</Label>
                                <div className="mt-2 text-sm text-gray-500 mb-2">בחר צבע או הזן קוד צבע מותאם אישית</div>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {PRESET_COLORS.map(color => (
                                        <button
                                            key={color.name}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color: color.hex })}
                                            className={cn(
                                                "h-8 w-8 rounded-full border-2 transition-all shadow-sm",
                                                formData.color === color.hex ? "border-gray-900 scale-110 ring-2 ring-gray-200" : "border-transparent hover:scale-110"
                                            )}
                                            style={{ backgroundColor: color.hex }}
                                            title={color.name}
                                        />
                                    ))}
                                    {/* Custom Color Picker wrapper */}
                                    <div className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-gray-200 hover:scale-110 transition-transform cursor-pointer group">
                                        <div className="absolute inset-0 flex items-center justify-center bg-white">
                                            <div
                                                className="w-full h-full"
                                                style={{ backgroundColor: formData.color }}
                                            />
                                        </div>
                                        <input
                                            type="color"
                                            value={formData.color}
                                            onChange={e => setFormData({ ...formData, color: e.target.value })}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            title="צבע מותאם אישית"
                                        />
                                        {/* Show checkmark if custom color is selected (not in presets) */}
                                        {!PRESET_COLORS.some(c => c.hex === formData.color) && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="w-2 h-2 bg-white rounded-full shadow-sm" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={resetForm}>ביטול</Button>
                            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
                                <Plus className="h-4 w-4 mr-2" />
                                צור חבילה
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button
                        className="w-full border-dashed border-2"
                        variant="outline"
                        onClick={() => {
                            resetForm()
                            setIsCreating(true)
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        הוסף חבילה חדשה
                    </Button>
                )}

            </div>
        </DialogContent >
    )
}
