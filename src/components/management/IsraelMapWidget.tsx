'use client'

import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'

// Simple map visualization using dot positions (mocked relative positions for key cities)
const CITY_COORDS: Record<string, { x: number, y: number }> = {
    'Tel Aviv': { x: 45, y: 45 },
    'Jerusalem': { x: 55, y: 55 },
    'Haifa': { x: 48, y: 25 },
    'Eilat': { x: 50, y: 95 },
    'Beer Sheva': { x: 40, y: 70 },
    'Netanya': { x: 46, y: 40 },
    'Ashdod': { x: 42, y: 52 },
}

export function IsraelMapWidget({ locations }: { locations: any[] }) {
    // Calculate max for sizing bubbles
    const maxCount = Math.max(...locations.map(l => l._count.id), 1)

    return (
        <Card className="p-6 h-[400px] shadow-sm relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50/50">
            <h3 className="text-lg font-bold mb-4 z-10 relative">מפת הרשמות פעילות</h3>

            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                {/* Placeholder for actual map bg if we had one, purely CSS shapes for now */}
                <div className="w-32 h-64 bg-gray-400 rounded-full blur-3xl transform rotate-12"></div>
            </div>

            <div className="relative w-full h-full p-4 flex items-center justify-center">
                {/* SVG Map of Israel (Simplified Path) */}
                <svg viewBox="0 0 100 200" className="h-[90%] drop-shadow-xl overflow-visible">
                    <path
                        d="M 60,10 L 65,15 L 60,25 L 50,25 L 45,30 L 40,40 L 45,50 L 40,60 L 35,70 L 35,90 L 40,110 L 50,150 L 50,190 L 55,190 L 60,150 L 65,110 L 70,80 L 65,60 L 65,50 L 75,50 L 75,40 L 70,30 L 65,20 Z"
                        fill="#FFFFFF"
                        stroke="#CBD5E1"
                        strokeWidth="1"
                    />

                    {/* Data Points */}
                    {locations.map((loc, i) => {
                        const coords = CITY_COORDS[loc.city] || { x: 50, y: 100 } // Default fallback
                        if (!CITY_COORDS[loc.city]) return null // Skip unknown for now to avoid mess

                        const size = 3 + (loc._count.id / maxCount) * 5 // Scale dot size

                        return (
                            <motion.g
                                key={loc.city}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <circle
                                    cx={coords.x}
                                    cy={coords.y}
                                    r={size}
                                    fill="#3B82F6"
                                    fillOpacity="0.6"
                                    stroke="#2563EB"
                                    strokeWidth="0.5"
                                />
                                <text
                                    x={coords.x + size + 2}
                                    y={coords.y + 1}
                                    fontSize="3"
                                    fill="#1E293B"
                                    fontWeight="bold"
                                >
                                    {loc.city} ({loc._count.id})
                                </text>
                            </motion.g>
                        )
                    })}
                </svg>

                {/* Legend if no data */}
                {locations.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                        אין נתוני מיקום זמינים
                    </div>
                )}
            </div>
        </Card>
    )
}
