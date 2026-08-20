'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createProjectStage, updateProjectStage } from '@/lib/actions/project-stages'
import { toast } from '@/hooks/use-toast'

export function ProjectStageDialog({ 
    isOpen, 
    onClose, 
    project,
    initialData,
    onSuccess 
}: { 
    isOpen: boolean
    onClose: () => void
    project: any
    initialData?: any
    onSuccess: () => void
}) {
    const [title, setTitle] = useState('')
    const [percentage, setPercentage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title)
                setPercentage(initialData.percentage.toString())
            } else {
                setTitle('')
                setPercentage('')
            }
        }
    }, [isOpen, initialData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !percentage) return
        
        setIsSubmitting(true)
        
        const data = {
            projectId: project.id,
            title: title.trim(),
            percentage: parseFloat(percentage)
        }

        const result = initialData 
            ? await updateProjectStage(initialData.id, data)
            : await createProjectStage(data)

        if (result.success) {
            toast({ title: initialData ? 'שלב עודכן בהצלחה' : 'שלב נוצר בהצלחה' })
            onSuccess()
        } else {
            toast({ title: 'שגיאה', description: result.error, variant: 'destructive' })
        }
        
        setIsSubmitting(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'עריכת שלב' : 'הוספת שלב חדש'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">כותרת השלב</label>
                        <Input 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="לדוגמה: תכנון ראשוני"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">אחוזים מהתקציב (%)</label>
                        <Input 
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="100"
                            value={percentage}
                            onChange={(e) => setPercentage(e.target.value)}
                            placeholder="25"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            ביטול
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {initialData ? 'שמור שינויים' : 'הוסף שלב'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
