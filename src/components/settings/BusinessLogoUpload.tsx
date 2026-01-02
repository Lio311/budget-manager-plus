'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadBusinessLogo, deleteBusinessLogo, getBusinessProfile } from '@/lib/actions/business-settings'
import { toast } from 'sonner'
import useSWR from 'swr'
import { useConfirm } from '@/hooks/useConfirm'

export function BusinessLogoUpload() {
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const confirm = useConfirm()

    const fetcher = async () => {
        const result = await getBusinessProfile()
        return result.data
    }

    const { data: profile, mutate } = useSWR('business-profile', fetcher)

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

    const currentLogo = preview || profile?.logoUrl

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    לוגו העסק
                </label>
                <p className="text-xs text-gray-500 mb-3">
                    הלוגו ישמש בחשבוניות ובמסמכים שהמערכת תפיק
                </p>
            </div>

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
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    {uploading ? 'מעלה...' : 'העלה לוגו'}
                    <Upload className="h-4 w-4 mr-2" />
                </Button>
            )}
        </div>
    )
}
