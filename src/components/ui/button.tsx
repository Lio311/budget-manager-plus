import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 hover:-translate-y-0.5",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:bg-primary/90 hover:shadow-primary/25",
                destructive:
                    "bg-destructive text-destructive-foreground shadow-sm hover:shadow-md hover:bg-destructive/90",
                outline:
                    "border border-input bg-background/50 backdrop-blur-sm shadow-sm hover:bg-accent hover:text-accent-foreground",
                secondary:
                    "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
                glass: "bg-white/20 hover:bg-white/30 text-white border border-white/30 shadow-sm hover:shadow-md backdrop-blur-md",
                "gradient-primary": "bg-gradient-to-r from-[hsl(var(--primary-gradient-start))] to-[hsl(var(--primary-gradient-end))] text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 border-0",
                "gradient-business": "bg-gradient-to-r from-[hsl(var(--business-gradient-start))] to-[hsl(var(--business-gradient-end))] text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 border-0",
            },
            size: {
                default: "h-11 px-6 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-12 rounded-xl px-8 text-base",
                icon: "h-11 w-11",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
