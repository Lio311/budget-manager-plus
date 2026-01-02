'use client'

import { create } from 'zustand'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmState {
    isOpen: boolean
    title: string
    message: string
    onConfirm: (() => void) | null
    onCancel: (() => void) | null
}

const useConfirmStore = create<ConfirmState & {
    openConfirm: (message: string, title?: string) => Promise<boolean>
    closeConfirm: () => void
}>((set, get) => ({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    openConfirm: (message: string, title: string = 'אישור פעולה') => {
        return new Promise<boolean>((resolve) => {
            set({
                isOpen: true,
                title,
                message,
                onConfirm: () => {
                    resolve(true)
                    get().closeConfirm()
                },
                onCancel: () => {
                    resolve(false)
                    get().closeConfirm()
                }
            })
        })
    },
    closeConfirm: () => {
        set({
            isOpen: false,
            title: '',
            message: '',
            onConfirm: null,
            onCancel: null
        })
    }
}))

export function ConfirmDialogProvider() {
    const { isOpen, title, message, onConfirm, onCancel } = useConfirmStore()

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => {
            if (!open && onCancel) {
                onCancel()
            }
        }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-right">{title}</AlertDialogTitle>
                    <AlertDialogDescription className="text-right">
                        {message}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row-reverse justify-start gap-2">
                    <AlertDialogCancel onClick={onCancel || undefined}>ביטול</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm || undefined} className="bg-red-600 hover:bg-red-700">
                        אישור
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export function useConfirm() {
    const openConfirm = useConfirmStore(state => state.openConfirm)
    return openConfirm
}
