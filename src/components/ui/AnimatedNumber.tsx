import { useEffect, useState } from 'react';

interface AnimatedNumberProps {
    value: number;
    currency?: string;
    duration?: number;
    className?: string; // For text styling
}

export function AnimatedNumber({ value, currency = '', duration = 1500, className = '' }: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        const startValue = 0;
        const endValue = value;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // Ease out quart
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);

            const current = startValue + (endValue - startValue) * easeOutQuart;
            setDisplayValue(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    // Format the number
    const formatted = new Intl.NumberFormat('he-IL', {
        minimumFractionDigits: 0, // Animate integers mostly for cleaner look during roll?
        maximumFractionDigits: 2,
    }).format(displayValue);

    // If it's done or close to done, ensure we show the clean final value with correct decimals if needed
    // But rendering directly is fine. I'll stick to 0 decimals during animation if it's too fast? 
    // No, standard formatting is fine.

    return (
        <span className={`inline-flex items-center gap-1 ${className}`} style={{ direction: 'rtl' }}>
            <span dir="ltr">{formatted}</span>
            {currency && <span>{currency === 'ILS' ? '₪' : currency}</span>}
        </span>
    );
}
