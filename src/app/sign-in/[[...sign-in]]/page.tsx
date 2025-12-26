import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <SignIn appearance={{
                elements: {
                    rootBox: "mx-auto",
                    card: "shadow-xl border border-gray-100"
                }
            }} />
        </div>
    );
}
