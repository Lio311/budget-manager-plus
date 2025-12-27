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

export function BusinessSettings() {
    const [uploading, setUploading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [formData, setFormData] = useState({
        companyName: '',
        companyId: '',
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
        onSuccess: (data) => {
            if (data) {
                setFormData({
                    companyName: data.companyName || '',
                    companyId: data.companyId || '',
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
        if (!confirm('האם אתה בטוח שברצונך למחוק את הלוגו?')) return

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
        if (!formData.companyName.trim()) {
            toast.error('יש למלא שם עסק')
            return
        }

        setSaving(true)
        try {
            const result = await updateBusinessProfile({
                companyName: formData.companyName,
                companyId: formData.companyId,
                vatStatus: 'EXEMPT', // Default value
                address: formData.address,
                phone: formData.phone,
                email: formData.email,
                signature: formData.signature
            })

            if (result.success) {
                toast.success('הפרטים נשמרו בהצלחה')
                mutate()
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
        <div className="space-y-6">
            {/* Logo Section */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    לוגו העסק
                </label>
                <p className="text-xs text-gray-500 mb-3">
                    הלוגו ישמש בחשבוניות ובמסמכים שהמערכת תפיק
                </p>

                {currentLogo ? (
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
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 bg-gray-50"
                    >
                        <ImageIcon className="h-12 w-12 text-gray-400" />
                        <p className="text-sm text-gray-500">לחץ להעלאת לוגו</p>
                        <p className="text-xs text-gray-400">PNG, JPG עד 5MB</p>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {!currentLogo && (
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="bg-blue-600 hover:bg-blue-700 mt-3"
                    >
                        {uploading ? 'מעלה...' : 'העלה לוגו'}
                        <Upload className="h-4 w-4 mr-2" />
                    </Button>
                )}
            </div>

            {/* Business Details */}
            <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">פרטי העסק</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="companyName">שם העסק *</Label>
                        <Input
                            id="companyName"
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            placeholder="שם החברה"
                        />
                    </div>
                    <div>
                        <Label htmlFor="companyId">מספר עוסק מורשה (ע.מ)</Label>
                        <Input
                            id="companyId"
                            value={formData.companyId}
                            onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                            placeholder="123456789"
                        />
                    </div>
                    <div>
                        <Label htmlFor="phone">טלפון נייד</Label>
                        <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="050-1234567"
                        />
                    </div>
                    <div>
                        <Label htmlFor="email">אימייל</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="info@company.com"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="address">כתובת</Label>
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="רחוב 123, עיר"
                        />
                    </div>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 mt-4"
                >
                    {saving ? 'שומר...' : 'שמור פרטים'}
                    <Save className="h-4 w-4 mr-2" />
                </Button>
            </div>

            {/* Signature Section */}
            <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                    <Pen className="h-5 w-5 text-green-600" />
                    <h3 className="text-sm font-medium text-gray-700">חתימה דיגיטלית</h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                    החתימה תופיע בחשבוניות ובמסמכים רשמיים
                </p>
                <SignaturePad
                    value={formData.signature}
                    onChange={(sig) => setFormData({ ...formData, signature: sig })}
                    onClear={() => setFormData({ ...formData, signature: '' })}
                />
            </div>
        </div>
    )
}
