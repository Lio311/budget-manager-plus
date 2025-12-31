import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
    currency?: string;
}

export const CustomTooltip = ({ active, payload, label, currency = '₪' }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-panel px-4 py-3 border border-white/50 dark:border-slate-700/50 shadow-xl rounded-xl backdrop-blur-xl text-right min-w-[180px]">
                <p className="font-bold text-[#323338] dark:text-gray-100 text-sm mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-end gap-2 text-xs md:text-sm">
                        <span className="font-mono font-bold text-[#323338] dark:text-white dir-ltr">
                            {currency}{Number(entry.value).toLocaleString()}
                        </span>
                        <span className="text-gray-600 dark:text-gray-300">
                            : {entry.name || 'שווי'}
                        </span>
                        <div
                            className="w-2.5 h-2.5 rounded-full shadow-sm"
                            style={{ backgroundColor: entry.color || entry.fill || '#22C55E' }}
                        />
                    </div>
                ))}
            </div>
        )
    }

    return null;
};
