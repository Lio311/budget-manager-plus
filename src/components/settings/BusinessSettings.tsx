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
        // Validate all required fields
        if (!formData.companyName.trim() || !formData.companyId.trim() || !formData.address.trim() || !formData.phone.trim() || !formData.email.trim()) {
            toast.error('כל השדות הם שדות חובה')
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
        <div className="space-y-4 text-right">
            {/* ... (previous code) ... */}

            {/* Save Button */}
            <div className="border-t pt-4">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 w-full"
                >
                    {saving ? 'שומר נתונים...' : 'שמור פרטים'}
                </Button>
            </div>
        </div>
    )


}
