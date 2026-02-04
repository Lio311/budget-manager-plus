'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Save, Pen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { uploadBusinessLogo, deleteBusinessLogo, getBusinessProfile, updateBusinessProfile } from '@/lib/actions/business-settings'
import { toast } from 'sonner'
import useSWR from 'swr'
import { SignaturePad } from './SignaturePad'
import { useConfirm } from '@/hooks/useConfirm'

export function BusinessSettings({ onSuccess }: { onSuccess?: () => void }) {
    const [uploading, setUploading] = useState(false)
    const [saving, setSaving] = useState(false)
    const confirm = useConfirm()

    const [preview, setPreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [formData, setFormData] = useState({
        companyName: '',
        companyId: '',
        vatStatus: 'AUTHORIZED', // Default to authorized
        address: '',
        phone: '',
        email: '',
        signature: ''
    })

    const fetcher = async () => {
        const result = await getBusinessProfile()
        return result.data
    }

    const { data: profile, mutate } = useSWR('business-profile', fetcher, {
        revalidateOnFocus: false,
        onSuccess: (data) => {
            if (data) {
                setFormData({
                    companyName: data.companyName || '',
                    companyId: data.companyId || '',
                    vatStatus: data.vatStatus === 'EXEMPT' ? 'EXEMPT' : 'AUTHORIZED',
                    address: data.address || '',
                    phone: data.phone || '',
                    email: data.email || '',
                    signature: data.signatureUrl || ''
                })
            }
        }
    })

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('יש להעלות קובץ תמונה בלבד')
            return
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('גודל הקובץ חייב להיות עד 5MB')
            return
        }

        // Convert to base64
        const reader = new FileReader()
        reader.onloadend = async () => {
            const base64 = reader.result as string
            setPreview(base64)

            setUploading(true)
            try {
                const result = await uploadBusinessLogo(base64)
                if (result.success) {
                    toast.success('הלוגו הועלה בהצלחה')
                    mutate()
                } else {
                    toast.error(result.error || 'שגיאה בהעלאת הלוגו')
                    setPreview(null)
                }
            } catch (error) {
                toast.error('שגיאה בהעלאת הלוגו')
                setPreview(null)
            } finally {
                setUploading(false)
            }
        }
        reader.readAsDataURL(file)
    }

    const handleDelete = async () => {
        const confirmed = await confirm('האם אתה בטוח שברצונך למחוק את הלוגו?', 'מחיקת לוגו')
        if (!confirmed) return

        try {
            const result = await deleteBusinessLogo()
            if (result.success) {
                toast.success('הלוגו נמחק בהצלחה')
                setPreview(null)
                mutate()
            } else {
                toast.error('שגיאה במחיקת הלוגו')
            }
        } catch (error) {
            toast.error('שגיאה במחיקת הלוגו')
        }
    }

    const handleSave = async () => {
        // Validate all required fields
        if (!formData.companyName.trim()) {
            toast.error('נא להזין שם עסק')
            return
        }
        if (!formData.companyId.trim()) {
            toast.error('נא להזין מספר עוסק מורשה')
            return
        }
        if (!formData.address.trim()) {
            toast.error('נא להזין כתובת')
            return
        }
        if (!formData.phone.trim()) {
            toast.error('נא להזין מספר טלפון')
            return
        }
        if (!formData.email.trim()) {
            toast.error('נא להזין כתובת אימייל')
            return
        }

        // Validate Company ID (Numbers only)
        if (!/^\d+$/.test(formData.companyId)) {
            toast.error('מספר עוסק מורשה חייב להכיל ספרות בלבד')
            return
        }

        // Validate Phone (Digits and dashes only, basic check)
        if (!/^[\d-]+$/.test(formData.phone)) {
            toast.error('מספר טלפון לא תקין')
            return
        }

        // Validate Email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            toast.error('כתובת אימייל לא תקינה')
            return
        }

        setSaving(true)
        try {
            const result = await updateBusinessProfile({
                companyName: formData.companyName,
                companyId: formData.companyId,
                vatStatus: formData.vatStatus,
                address: formData.address,
                phone: formData.phone,
                email: formData.email,
                signature: formData.signature
            })

            if (result.success) {
                toast.success('הפרטים נשמרו בהצלחה')
                mutate()
                onSuccess?.()
            } else {
                toast.error(result.error || 'שגיאה בשמירת הפרטים')
            }
        } catch (error) {
            toast.error('שגיאה בשמירת הפרטים')
        } finally {
            setSaving(false)
        }
    }

    const currentLogo = preview || profile?.logoUrl

    return (
        <div className="space-y-4 text-right">
            {/* Logo Section */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    לוגו העסק
                </label>
                <p className="text-xs text-gray-500 mb-3 text-right">
                    הלוגו ישמש בחשבוניות ובמסמכים שהמערכת תפיק
                </p>

                {currentLogo ? (
                    <div className="flex justify-end">
                        <div className="relative inline-block">
                            <div className="w-48 h-48 border-2 border-gray-300 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                                <img
                                    src={currentLogo}
                                    alt="לוגו העסק"
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                            <button
                                onClick={handleDelete}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg"
                                disabled={uploading}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 items-end">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 bg-gray-50 inline-flex"
                        >
                            <ImageIcon className="h-12 w-12 text-gray-400" />
                            <p className="text-sm text-gray-500">לחץ להעלאת לוגו</p>
                            <p className="text-xs text-gray-400">PNG, JPG עד 5MB</p>
                        </div>

                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 w-48 justify-center"
                        >
                            <Upload className="h-4 w-4" />
                            {uploading ? 'מעלה...' : 'העלה לוגו'}
                        </Button>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            {/* Business Details */}
            <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4 text-right">פרטי העסק</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-2 mb-2">
                        <label className="text-sm font-medium text-gray-700 text-right block">סוג העסק</label>
                        <div className="flex flex-row-reverse gap-4 justify-start">
                            <div className="flex items-center space-x-2 space-x-reverse cursor-pointer border rounded-lg p-3 hover:bg-gray-50 flex-1 justify-end transition-colors relative"
                                onClick={() => setFormData({ ...formData, vatStatus: 'AUTHORIZED' })}
                            >
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-2 ${formData.vatStatus === 'AUTHORIZED' ? 'border-blue-600' : 'border-gray-400'}`}>
                                    {formData.vatStatus === 'AUTHORIZED' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                </div>
                                <span className={formData.vatStatus === 'AUTHORIZED' ? 'font-medium text-blue-700' : 'text-gray-600'}>עוסק מורשה (Murshe)</span>
                            </div>

                            <div className="flex items-center space-x-2 space-x-reverse cursor-pointer border rounded-lg p-3 hover:bg-gray-50 flex-1 justify-end transition-colors"
                                onClick={() => setFormData({ ...formData, vatStatus: 'EXEMPT' })}
                            >
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-2 ${formData.vatStatus === 'EXEMPT' ? 'border-blue-600' : 'border-gray-400'}`}>
                                    {formData.vatStatus === 'EXEMPT' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                </div>
                                <span className={formData.vatStatus === 'EXEMPT' ? 'font-medium text-blue-700' : 'text-gray-600'}>עוסק פטור (Exempt)</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 text-right">
                            * הגדרה זו תשפיע על חישובי המע"מ וסוגי המסמכים שתוכל להפיק
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="companyName" className="text-right block mb-2">שם העסק *</Label>
                        <Input
                            id="companyName"
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            placeholder="שם החברה"
                            className="text-right"
                        />
                    </div>
                    <div>
                        <Label htmlFor="companyId" className="text-right block mb-2">
                            {formData.vatStatus === 'EXEMPT' ? 'מספר עוסק פטור (ח.פ/ת.ז) *' : 'מספר עוסק מורשה (ע.מ) *'}
                        </Label>
                        <Input
                            id="companyId"
                            value={formData.companyId}
                            onChange={(e) => {
                                const val = e.target.value
                                // Allow only numbers
                                if (val === '' || /^\d+$/.test(val)) {
                                    setFormData({ ...formData, companyId: val })
                                }
                            }}
                            placeholder="123456789"
                            className="text-right"
                            inputMode="numeric"
                        />
                    </div>
                    <div>
                        <Label htmlFor="phone" className="text-right block mb-2">טלפון נייד *</Label>
                        <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => {
                                const val = e.target.value
                                // Allow only numbers and dashes
                                if (val === '' || /^[\d-]+$/.test(val)) {
                                    setFormData({ ...formData, phone: val })
                                }
                            }}
                            placeholder="050-1234567"
                            className="text-right"
                            dir="ltr"
                        />
                    </div>
                    <div>
                        <Label htmlFor="email" className="text-right block mb-2">אימייל *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="info@company.com"
                            className="text-right"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="address" className="text-right block mb-2">כתובת *</Label>
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="רחוב 123, עיר"
                            className="text-right"
                        />
                    </div>
                </div>
            </div>

            {/* Signature Section */}
            <div className="border-t pt-4">
                <div className="flex flex-row-reverse items-center justify-start gap-2 mb-3">
                    <h3 className="text-sm font-medium text-gray-700">חתימה דיגיטלית</h3>
                    <Pen className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-xs text-gray-500 mb-3 text-right">
                    החתימה תופיע בחשבוניות ובמסמכים רשמיים
                </p>
                <div className="flex justify-center w-full">
                    <div className="w-full max-w-md relative">
                        <SignaturePad
                            value={formData.signature}
                            onChange={(sig) => setFormData({ ...formData, signature: sig })}
                            onClear={() => setFormData({ ...formData, signature: '' })}
                        />
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="border-t pt-4">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 w-full"
                    dir="rtl"
                >
                    {saving ? 'שומר שינויים...' : 'שמור פרטים'}
                </Button>
            </div>
        </div>
    )
}
