import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <SignUp appearance={{
                layout: {
                    socialButtonsPlacement: 'bottom',
                    socialButtonsVariant: 'blockButton'
                },
                elements: {
                    rootBox: "mx-auto w-full",
                    card: "shadow-xl border border-gray-100 w-full",
                    alert: "flex-row-reverse",
                    alertText: "text-right mr-2",
                    formFieldLabel: "text-right",
                    formFieldInput: "text-right",
                    formFieldErrorText: "text-right direction-rtl will-change-transform", // Fix for validation errors
                    footer: "flex-row-reverse",
                    headerTitle: "text-right",
                    headerSubtitle: "text-right",
                    socialButtonsBlockButton: "flex-row-reverse gap-2",
                    socialButtonsBlockButtonText: "mr-2",
                    dividerLine: "bg-gray-200",
                    dividerText: "px-2"
                }
            }} />
        </div>
    );
}
