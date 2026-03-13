'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Edit2, Check, X, Loader2, Camera, Paperclip } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { addManualVatRefund, updateManualVatRefund, deleteManualVatRefund, getManualVatRefundAttachment } from '@/lib/actions/vat-refund'
import { formatCurrency, cn } from '@/lib/utils'
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput'
import { useConfirm } from '@/hooks/useConfirm'
import { useRef } from 'react'
import { DatePicker } from '@/components/ui/date-picker'
import { format } from 'date-fns'
import { compressImage } from '@/lib/image-utils'

interface ManualVatRefund {
    id: string
    amount: number
    description: string
    date: Date
    attachmentUrl?: string | null
}

interface VatRefundManagerProps {
    isOpen: boolean
    onClose: () => void
    month: number
    year: number
    refunds: any[]
    onUpdate: () => void
}

export function VatRefundManager({ isOpen, onClose, month, year, refunds, onUpdate }: VatRefundManagerProps) {
    const [isAdding, setIsAdding] = useState(false)
    const [loading, setLoading] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const confirm = useConfirm()
    
    const cameraInputRef = useRef<HTMLInputElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Form state
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null)

    const resetForm = () => {
        setAmount('')
        setDescription('')
        setDate(new Date().toISOString().split('T')[0])
        setAttachmentUrl(null)
        setIsAdding(false)
        setEditingId(null)
    }

    const handleAdd = async () => {
        if (!amount || !description) {
            toast.error('נא למלא את כל השדות')
            return
        }

        setLoading(true)
        const result = await addManualVatRefund(month, year, {
            amount: parseFloat(amount),
            description,
            date,
            attachmentUrl
        })

        if (result.success) {
            toast.success('החזר התווסף בהצלחה')
            resetForm()
            onUpdate()
        } else {
            toast.error(result.error || 'שגיאה בהוספת החזר')
        }
        setLoading(false)
    }

    const handleUpdate = async (id: string) => {
        setLoading(true)
        const result = await updateManualVatRefund(id, {
            amount: parseFloat(amount),
            description,
            date,
            attachmentUrl
        })

        if (result.success) {
            toast.success('החזר עודכן בהצלחה')
            resetForm()
            onUpdate()
        } else {
            toast.error(result.error || 'שגיאה בעדכון החזר')
        }
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        const confirmed = await confirm('האם אתה בטוח שברצונך למחוק החזר זה?', 'מחיקת החזר מע"מ')
        if (!confirmed) return

        setLoading(true)
        const result = await deleteManualVatRefund(id)

        if (result.success) {
            toast.success('החזר נמחק בהצלחה')
            onUpdate()
        } else {
            toast.error(result.error || 'שגיאה במחיקת החזר')
        }
        setLoading(false)
    }

    // Sync attachmentUrl if it's fetched asynchronously
    useEffect(() => {
        if (isAdding && editingId) {
            // Only sync if we are in edit mode
            const currentRefund = refunds.find(r => r.id === editingId)
            if (currentRefund?.attachmentUrl && currentRefund.attachmentUrl !== attachmentUrl) {
                setAttachmentUrl(currentRefund.attachmentUrl)
            }
        }
    }, [refunds, editingId, isAdding])

    const startEdit = async (refund: any) => {
        setEditingId(refund.id)
        setAmount(refund.amount.toString())
        setDescription(refund.description)
        setDate(new Date(refund.date).toISOString().split('T')[0])
        
        // Fetch attachment if not present
        if (!refund.attachmentUrl && refund.id) {
            const res = await getManualVatRefundAttachment(refund.id)
            if (res.success && res.data) {
                setAttachmentUrl(res.data)
            } else {
                setAttachmentUrl(null)
            }
        } else {
            setAttachmentUrl(refund.attachmentUrl || null)
        }
        
        setIsAdding(true)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle>ניהול החזרי מע"מ ידניים</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 my-4">
                    {isAdding ? (
                        <Card className="bg-gray-50 dark:bg-slate-900 border-dashed border-2">
                            <CardContent className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <Label>תיאור</Label>
                                    <Input 
                                        value={description} 
                                        onChange={(e) => setDescription(e.target.value)} 
                                        placeholder="למשל: החזר בגין עודף מס משנה שעברה"
                                        className="text-right"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>סכום (₪)</Label>
                                        <FormattedNumberInput 
                                            value={amount} 
                                            onChange={() => {}}
                                            onValueChange={(val) => setAmount(val.toString())}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-gray-500">תאריך</Label>
                                        <DatePicker 
                                            date={date ? new Date(date) : undefined}
                                            setDate={(d) => setDate(d ? format(d, 'yyyy-MM-dd') : '')}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-500">חבר חשבונית (צילום או קובץ)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            className="hidden"
                                            ref={cameraInputRef}
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0]
                                                if (file) {
                                                    try {
                                                        const compressed = await compressImage(file)
                                                        setAttachmentUrl(compressed)
                                                    } catch (err) {
                                                        console.error('Compression error:', err)
                                                        toast.error('שגיאה בעיבוד התמונה')
                                                    }
                                                }
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1 h-10 gap-2 border-dashed border-2 hover:border-emerald-500 hover:text-emerald-500 transition-all text-xs"
                                            onClick={() => cameraInputRef.current?.click()}
                                        >
                                            <Camera className="h-4 w-4 text-emerald-500" />
                                            צילום חשבונית
                                        </Button>

                                        <Input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0]
                                                if (file) {
                                                    try {
                                                        if (file.type === 'application/pdf') {
                                                            const reader = new FileReader()
                                                            reader.onloadend = () => setAttachmentUrl(reader.result as string)
                                                            reader.readAsDataURL(file)
                                                            return
                                                        }
                                                        const compressed = await compressImage(file)
                                                        setAttachmentUrl(compressed)
                                                    } catch (err) {
                                                        console.error('Processing error:', err)
                                                        toast.error('שגיאה בעיבוד הקובץ')
                                                    }
                                                }
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1 h-10 gap-2 border-dashed border-2 hover:border-emerald-500 hover:text-emerald-500 transition-all text-xs"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Paperclip className="h-4 w-4 text-emerald-500" />
                                            בחירת קובץ
                                        </Button>
                                    </div>

                                    {attachmentUrl && (
                                        <div className="relative mt-2 rounded-lg overflow-hidden border border-gray-200 aspect-video bg-gray-50 group">
                                            {attachmentUrl.startsWith('data:image/') ? (
                                                <img src={attachmentUrl} alt="Preview" className="w-full h-full object-contain" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                    <Paperclip className="h-8 w-8 mb-2" />
                                                    <span>קובץ צורף</span>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setAttachmentUrl(null)}
                                                className="absolute top-1 left-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button variant="ghost" size="sm" onClick={resetForm}>ביטול</Button>
                                    <Button size="sm" onClick={() => editingId ? handleUpdate(editingId) : handleAdd()} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId ? 'עדכן' : 'שמור')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Button 
                            variant="outline" 
                            className="w-full border-dashed border-2 h-12 gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" 
                            onClick={() => setIsAdding(true)}
                        >
                            <Plus className="h-4 w-4" />
                            הוסף החזר מע"מ ידני
                        </Button>
                    )}

                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {refunds.length === 0 && !isAdding && (
                            <p className="text-center text-sm text-gray-500 py-8">אין החזרים ידניים לחודש זה</p>
                        )}
                        {refunds.map((refund) => (
                            <div key={refund.id} className="flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-slate-800 shadow-sm transition-all hover:shadow-md">
                                <div className="flex-1 min-w-0 ml-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-emerald-600">{formatCurrency(refund.amount)}</span>
                                        <span className="text-[11px] text-gray-400 font-medium" dir="ltr">
                                            {new Date(refund.date).toLocaleDateString('he-IL', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            })}
                                        </span>
                                        {refund.attachmentUrl && (
                                            <Paperclip className="h-3 w-3 text-emerald-500" />
                                        )}
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{refund.description}</p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-gray-400 hover:text-blue-500"
                                        onClick={() => startEdit(refund)}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-gray-400 hover:text-red-500"
                                        onClick={() => handleDelete(refund.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} className="w-full">סגור</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
