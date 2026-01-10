'use client'

import { useAuthModal } from '@/contexts/AuthModalContext'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useSignIn, useSignUp } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function GlobalLoginModal() {
    const { isOpen, closeModal } = useAuthModal()
    const { signIn, isLoaded: isSignInLoaded } = useSignIn()
    const { signUp, isLoaded: isSignUpLoaded } = useSignUp()
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleGoogleLogin = async () => {
        if (!isSignInLoaded || !isSignUpLoaded) return
        setIsLoading(true)
        try {
            await signIn.authenticateWithRedirect({
                strategy: 'oauth_google',
                redirectUrl: '/sso-callback',
                redirectUrlComplete: '/dashboard'
            })
        } catch (err) {
            console.error('Login error:', err)
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={closeModal}>
            <DialogContent className="sm:max-w-[400px] p-0 border-none bg-transparent shadow-none">
                <DialogTitle className="sr-only">התחברות למערכת</DialogTitle>
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden p-8 flex flex-col items-center">
                    <div className="mb-6">
                        <Image
                            src="/images/branding/K-LOGO.png"
                            alt="Kesefly"
                            width={150}
                            height={45}
                            className="h-16 w-auto"
                        />
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-2">ברוכים הבאים</h2>
                    <p className="text-gray-500 text-center mb-8 text-sm">
                        התחברו כדי לנהל את הכספים שלכם בחכמה
                    </p>

                    <Button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 py-6 text-base shadow-sm font-medium transition-all"
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                        ) : (
                            <>
                                <Image
                                    src="/images/icons/google.svg"
                                    alt="Google"
                                    width={20}
                                    height={20}
                                />
                                המשך עם Google
                            </>
                        )}
                    </Button>

                    <div className="mt-8 pt-6 border-t border-gray-100 w-full text-center">
                        <Link
                            href="/demo"
                            onClick={closeModal}
                            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors pointer-events-auto"
                        >
                            התנסות במערכת כאורח
                        </Link>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
