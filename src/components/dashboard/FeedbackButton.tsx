'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare } from 'lucide-react'
import { submitFeedback } from '@/lib/actions/feedback'
import { toast } from 'sonner'

export function FeedbackButton() {
    const [open, setOpen] = useState(false)
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!content.trim()) return

        setLoading(true)
        try {
            await submitFeedback(content)
            toast.success('תודה על המשוב! אנחנו מעריכים את זה.')
            setOpen(false)
            setContent('')
        } catch (error) {
            toast.error('שגיאה בשליחת המשוב. נסה שוב מאוחר יותר.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    הצעה לשיפור
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-right">הצעה לשיפור</DialogTitle>
                    <DialogDescription className="text-right">
                        יש לך רעיון איך לשפר את המערכת? נשמח לשמוע!
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea
                        placeholder="כתוב כאן את ההצעה שלך..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[100px] text-right"
                        dir="rtl"
                    />
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={loading || !content.trim()}>
                        {loading ? 'שולח...' : 'שלח הצעה'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
