import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50" dir="rtl">
            <SignUp appearance={{
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
