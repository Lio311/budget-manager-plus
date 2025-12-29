
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface FloatingActionProps {
    onClick: () => void
    colorClass?: string // Allow passing arbitrary classes like "bg-red-600"
    label?: string
}

export function FloatingActionButton({ onClick, colorClass = "bg-primary", label = "הוסף" }: FloatingActionProps) {
    return (
        <Button
            onClick={onClick}
            className={cn(
                "fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 lg:hidden flex items-center justify-center p-0",
                colorClass
            )}
            aria-label={label}
        >
            <Plus className="h-8 w-8 text-white" />
        </Button>
    )
}
