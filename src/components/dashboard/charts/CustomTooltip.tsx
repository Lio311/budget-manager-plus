import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
    currency?: string;
}

export const CustomTooltip = ({ active, payload, label, currency = '₪' }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-panel p-3 border border-white/50 shadow-xl rounded-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                <p className="font-bold text-[#323338] mb-1 text-sm">{label}</p>
                <div className="space-y-1">
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                            <div
                                className="w-2 h-2 rounded-full shadow-sm"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="font-medium text-gray-600">{entry.name}:</span>
                            <span className="font-mono font-bold text-[#323338]">
                                {currency}{Number(entry.value).toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return null;
};
