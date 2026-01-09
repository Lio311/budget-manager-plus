'use client'

import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'

// Simple map visualization using dot positions (mocked relative positions for key cities)
const CITY_COORDS: Record<string, { x: number, y: number }> = {
    // Center / Gush Dan
    'Tel Aviv': { x: 45, y: 45 },
    'Tel Aviv-Yafo': { x: 45, y: 45 },
    'Ramat Gan': { x: 46, y: 45 },
    'Givatayim': { x: 46, y: 45 },
    'Bnei Brak': { x: 46, y: 44 },
    'Petah Tikva': { x: 47, y: 44 },
    'Holon': { x: 44, y: 47 },
    'Bat Yam': { x: 43, y: 46 },
    'Rishon LeZion': { x: 44, y: 48 },
    'Rehovot': { x: 44, y: 50 },
    'Ness Ziona': { x: 44, y: 49 },
    'Yavne': { x: 43, y: 51 },
    'Herzliya': { x: 45, y: 42 },
    'Ramat HaSharon': { x: 46, y: 42 },
    'Hod HaSharon': { x: 47, y: 41 },
    'Kfar Saba': { x: 48, y: 41 },
    'Ra\'anana': { x: 46, y: 41 },

    // Sharon / North Coast
    'Netanya': { x: 45, y: 38 },
    'Hadera': { x: 46, y: 34 },
    'Zikhron Ya\'akov': { x: 46, y: 30 },
    'Caesarea': { x: 45, y: 32 },

    // North
    'Haifa': { x: 48, y: 25 },
    'Kiryat Ata': { x: 50, y: 24 },
    'Kiryat Bialik': { x: 50, y: 23 },
    'Kiryat Motzkin': { x: 49, y: 23 },
    'Kiryat Yam': { x: 48, y: 23 },
    'Acre': { x: 49, y: 20 },
    'Akko': { x: 49, y: 20 },
    'Nahariya': { x: 49, y: 15 },
    'Karmiel': { x: 53, y: 20 },
    'Tiberias': { x: 60, y: 25 },
    'Nazareth': { x: 53, y: 28 },
    'Afula': { x: 53, y: 32 },
    'Safed': { x: 58, y: 18 },
    'Kiryat Shmona': { x: 58, y: 10 },

    // Jerusalem Area
    'Jerusalem': { x: 55, y: 55 },
    'Beit Shemesh': { x: 50, y: 56 },
    'Modi\'in': { x: 50, y: 50 },
    'Modi\'in-Maccabim-Re\'ut': { x: 50, y: 50 },

    // South
    'Ashdod': { x: 42, y: 53 },
    'Ashkelon': { x: 40, y: 58 },
    'Sderot': { x: 38, y: 64 },
    'Netivot': { x: 38, y: 68 },
    'Ofakim': { x: 36, y: 70 },
    'Beer Sheva': { x: 45, y: 72 },
    'Dimona': { x: 50, y: 75 },
    'Arad': { x: 55, y: 72 },
    'Mitzpe Ramon': { x: 45, y: 85 },
    'Eilat': { x: 50, y: 95 },
}

const CITY_TRANSLATIONS: Record<string, string> = {
    'Tel Aviv': 'תל אביב',
    'Tel Aviv-Yafo': 'תל אביב',
    'Jerusalem': 'ירושלים',
    'Haifa': 'חיפה',
    'Rishon LeZion': 'ראשון לציון',
    'Petah Tikva': 'פתח תקווה',
    'Ashdod': 'אשדוד',
    'Netanya': 'נתניה',
    'Beer Sheva': 'באר שבע',
    'Holon': 'חולון',
    'Bnei Brak': 'בני ברק',
    'Ramat Gan': 'רמת גן',
    'Rehovot': 'רחובות',
    'Bat Yam': 'בת ים',
    'Herzliya': 'הרצליה',
    'Kfar Saba': 'כפר סבא',
    'Modi\'in': 'מודיעין',
    'Modi\'in-Maccabim-Re\'ut': 'מודיעין',
    'Hadera': 'חדרה',
    'Ashkelon': 'אשקלון',
    'Ra\'anana': 'רעננה',
    'Hod HaSharon': 'הוד השרון',
    'Ramat HaSharon': 'רמת השרון',
    'Nahariya': 'נהריה',
    'Kiryat Ata': 'קרית אתא',
    'Givatayim': 'גבעתיים',
    'Acre': 'עכו',
    'Akko': 'עכו',
    'Eilat': 'אילת',
    'Nazareth': 'נצרת',
    'Afula': 'עפולה',
    'Karmiel': 'כרמיאל',
    'Tiberias': 'טבריה',
    'Safed': 'צפת',
    'Kiryat Shmona': 'קרית שמונה',
    'Beit Shemesh': 'בית שמש',
    'Sderot': 'שדרות',
    'Dimona': 'דימונה',
    'Yavne': 'יבנה',
    'Ness Ziona': 'נס ציונה',
    'Kiryat Gat': 'קרית גת',
    // ... add more as needed
}

const COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899']

export function IsraelMapWidget({ locations }: { locations: any[] }) {
    // Calculate max for sizing bubbles
    const maxCount = Math.max(...locations.map(l => l._count.id), 1)

    return (
        <Card className="p-6 h-[700px] shadow-sm relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50/50">
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                {/* Placeholder for actual map bg if we had one, purely CSS shapes for now */}
                <div className="w-48 h-96 bg-gray-400 rounded-full blur-3xl transform rotate-12"></div>
            </div>

            <div className="relative w-full h-full p-4 flex items-center justify-center">
                {/* SVG Map of Israel (Simplified Path) */}
                <svg viewBox="0 0 100 200" className="h-[95%] drop-shadow-xl overflow-visible">
                    <path
                        d="M 60,10 L 65,15 L 60,25 L 50,25 L 45,30 L 40,40 L 45,50 L 40,60 L 35,70 L 35,90 L 40,110 L 50,150 L 50,190 L 55,190 L 60,150 L 65,110 L 70,80 L 65,60 L 65,50 L 75,50 L 75,40 L 70,30 L 65,20 Z"
                        fill="#FFFFFF"
                        stroke="#CBD5E1"
                        strokeWidth="1"
                    />

                    {/* Data Points */}
                    {locations.map((loc, i) => {
                        // Fuzzy match or default to center if unknown (better than hiding)
                        let coords = CITY_COORDS[loc.city]

                        // Try to find a partial match if exact failed
                        if (!coords) {
                            const match = Object.keys(CITY_COORDS).find(k => loc.city.includes(k) || k.includes(loc.city))
                            if (match) coords = CITY_COORDS[match]
                        }

                        // If still no coords, fallback to "Unknown" pile near the sea/side (e.g., 20, 50) so they are visible but distinct
                        const finalCoords = coords || { x: 20, y: 50 + (i * 2) }

                        const size = 3 + (loc._count.id / maxCount) * 5 // Scale dot size
                        const color = COLORS[i % COLORS.length]

                        return (
                            <motion.g
                                key={loc.city}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <circle
                                    cx={finalCoords.x}
                                    cy={finalCoords.y}
                                    r={size}
                                    fill={color}
                                    fillOpacity="0.8"
                                    stroke="white"
                                    strokeWidth="0.5"
                                />
                                <text
                                    x={finalCoords.x + size + 2}
                                    y={finalCoords.y + 1}
                                    fontSize="3"
                                    fill="#1E293B"
                                    fontWeight="bold"
                                >
                                    {CITY_TRANSLATIONS[loc.city] || loc.city} ({loc._count.id})
                                </text>
                            </motion.g>
                        )
                    })}
                </svg>

                {/* Legend if no data */}
                {locations.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                        אין נתוני מיקום זמינים לשבוע זה
                    </div>
                )}
            </div>
        </Card>
    )
}
