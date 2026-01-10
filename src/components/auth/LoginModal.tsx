'use client'

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import { useState } from 'react'

interface LoginModalProps {
    children: React.ReactNode
}

export function LoginModal({ children }: LoginModalProps) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="p-0 bg-transparent border-none max-w-fit shadow-none flex flex-col items-center">
                <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
                    <SignIn
                        appearance={{
                            elements: {
                                rootBox: "shadow-none",
                                card: "shadow-none border-none",
                                footer: "hidden"
                            }
                        }}
                    />
                </div>
                <div className="mt-4">
                    <Link
                        href="/demo"
                        onClick={() => setOpen(false)}
                        className="text-white font-medium hover:text-emerald-200 transition-colors underline decoration-dotted underline-offset-4"
                    >
                        התנסות במערכת כאורח
                    </Link>
                </div>
            </DialogContent>
        </Dialog>
    )
}
