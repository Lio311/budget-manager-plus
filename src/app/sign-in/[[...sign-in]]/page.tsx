'use client'

import { SignIn, useSignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function SignInPage() {
    const { signIn, isLoaded } = useSignIn();
    const searchParams = useSearchParams();
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        if (!isLoaded) return;

        const forceGoogle = searchParams.get('force_google');
        if (forceGoogle === 'true') {
            setIsRedirecting(true);
            signIn.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: "/sso-callback",
                redirectUrlComplete: "/"
            }).catch((err) => {
                console.error("Auto Google Sign-in failed:", err);
                setIsRedirecting(false);
            });
        }
    }, [isLoaded, searchParams, signIn]);

    if (isRedirecting) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[100dvh] w-full bg-gray-50 gap-4 px-4 text-center" dir="rtl">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                <p className="text-gray-500 font-medium">מעביר לגוגל...</p>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50" dir="rtl">
            <SignIn appearance={{
                layout: {
                    socialButtonsPlacement: 'bottom',
                    socialButtonsVariant: 'blockButton'
                },
                elements: {
                    rootBox: "mx-auto",
                    card: "shadow-xl border border-gray-100",
                    alert: "flex-row-reverse",
                    alertText: "text-right mr-2",
                    formFieldLabel: "text-right",
                    formFieldInput: "text-right",
                    formFieldErrorText: "text-right",
                    footer: "flex-row-reverse",
                    headerTitle: "text-center",
                    headerSubtitle: "text-center",
                    socialButtonsBlockButton: "flex-row-reverse gap-2",
                    socialButtonsBlockButtonText: "mr-2",
                    dividerText: "px-2"
                }
            }} />
        </div>
    );
}
