'use client'

import { useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface MobileDescriptionEditorProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    initialValue: string
    onSave: (value: string) => void
}

export function MobileDescriptionEditor({
    isOpen,
    onClose,
    title = 'ערוך תיאור',
    initialValue,
    onSave,
}: MobileDescriptionEditorProps) {
    const [value, setValue] = useState(initialValue)

    // Sync state when dialog opens with new value
    useEffect(() => {
        if (isOpen) {
            setValue(initialValue)
        }
    }, [isOpen, initialValue])

    const handleSave = () => {
        onSave(value)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md w-[95vw] rounded-xl" dir="rtl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="py-2">
                    <Textarea
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="min-h-[200px] text-base resize-none"
                        placeholder="הזן פירוט מלא..."
                        autoFocus
                    />
                </div>
                <DialogFooter className="flex-row gap-2 sm:justify-start">
                    <Button onClick={handleSave} className="flex-1">
                        אישור
                    </Button>
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        ביטול
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
