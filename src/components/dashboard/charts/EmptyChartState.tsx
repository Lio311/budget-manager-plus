import { Presentation } from 'lucide-react'

export function EmptyChartState({ title = "טרם נאספו נתונים", subtitle = "הגרף יתחיל להציג נתונים החל מהחודש הבא" }: { title?: string, subtitle?: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-[300px] w-full text-center p-6 animate-in fade-in-50 duration-700">
            <div className="bg-gray-100/50 p-4 rounded-full mb-4">
                <Presentation className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-[#323338] mb-1">{title}</h3>
            <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
    )
}
