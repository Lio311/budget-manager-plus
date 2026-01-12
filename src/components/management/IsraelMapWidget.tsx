'use client'

import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'

// Real-world coordinates only, we will project them dynamically
const CITY_LOCATIONS: Record<string, { lat: number, lng: number }> = {
    // Center / Gush Dan
    'Tel Aviv': { lat: 32.0853, lng: 34.7818 },
    'Tel Aviv-Yafo': { lat: 32.0853, lng: 34.7818 },
    'Ramat Gan': { lat: 32.0684, lng: 34.8264 },
    'Givatayim': { lat: 32.0722, lng: 34.8089 },
    'Bnei Brak': { lat: 32.0849, lng: 34.8352 },
    'Petah Tikva': { lat: 32.0840, lng: 34.8878 },
    'Holon': { lat: 32.0158, lng: 34.7874 },
    'Bat Yam': { lat: 32.0132, lng: 34.7480 },
    'Rishon LeZion': { lat: 31.9730, lng: 34.7925 },
    'Rishon LeTsiyyon': { lat: 31.9730, lng: 34.7925 }, // Variations
    'Rishon LetSiyyon': { lat: 31.9730, lng: 34.7925 },
    'Rehovot': { lat: 31.8903, lng: 34.8113 },
    'Ness Ziona': { lat: 31.9318, lng: 34.7997 },
    'Yavne': { lat: 31.8780, lng: 34.7383 },
    'Herzliya': { lat: 32.1624, lng: 34.8447 },
    'Ramat HaSharon': { lat: 32.1492, lng: 34.8407 },
    'Hod HaSharon': { lat: 32.1522, lng: 34.8932 },
    'Kfar Saba': { lat: 32.1750, lng: 34.9069 },
    'Ra\'anana': { lat: 32.1848, lng: 34.8713 },
    'Or Yehuda': { lat: 32.0315, lng: 34.8560 }, // Added Or Yehuda

    // Sharon / North Coast
    'Netanya': { lat: 32.3215, lng: 34.8532 },
    'Hadera': { lat: 32.4340, lng: 34.9197 },
    'Zikhron Ya\'akov': { lat: 32.5707, lng: 34.9566 },
    'Caesarea': { lat: 32.5000, lng: 34.9000 },

    // North
    'Haifa': { lat: 32.7940, lng: 34.9896 },
    'Kiryat Ata': { lat: 32.8105, lng: 35.1098 },
    'Kiryat Bialik': { lat: 32.8368, lng: 35.0743 },
    'Kiryat Motzkin': { lat: 32.8465, lng: 35.0805 },
    'Kiryat Yam': { lat: 32.8290, lng: 35.0684 },
    'Acre': { lat: 32.9312, lng: 35.0818 },
    'Akko': { lat: 32.9312, lng: 35.0818 },
    'Nahariya': { lat: 33.0034, lng: 35.0970 },
    'Karmiel': { lat: 32.9190, lng: 35.2901 },
    'Tiberias': { lat: 32.7959, lng: 35.5312 },
    'Nazareth': { lat: 32.6996, lng: 35.3035 },
    'Afula': { lat: 32.6065, lng: 35.2901 },
    'Safed': { lat: 32.9646, lng: 35.4960 },
    'Kiryat Shmona': { lat: 33.2075, lng: 35.5697 },

    // Jerusalem Area
    'Jerusalem': { lat: 31.7683, lng: 35.2137 },
    'Beit Shemesh': { lat: 31.7470, lng: 34.9881 },
    'Modi\'in': { lat: 31.8906, lng: 35.0104 },
    'Modi\'in-Maccabim-Re\'ut': { lat: 31.8906, lng: 35.0104 },

    // South
    'Ashdod': { lat: 31.8014, lng: 34.6435 },
    'Ashkelon': { lat: 31.6688, lng: 34.5743 },
    'Sderot': { lat: 31.5247, lng: 34.5953 },
    'Netivot': { lat: 31.4172, lng: 34.5828 },
    'Ofakim': { lat: 31.3134, lng: 34.6208 },
    'Beer Sheva': { lat: 31.2518, lng: 34.7913 },
    'Dimona': { lat: 31.0664, lng: 35.0315 },
    'Arad': { lat: 31.2600, lng: 35.2100 },
    'Mitzpe Ramon': { lat: 30.6120, lng: 34.8010 },
    'Eilat': { lat: 29.5581, lng: 34.9482 },
}

// Projection Calibration (Manually tuned for this specific SVG viewBox)
const MAP_BOUNDS = {
    minLat: 29.50, // Eilat
    maxLat: 33.30, // Metula
    minLng: 34.20, // Coast
    maxLng: 35.90  // Eastern border
}

// SVG Coordinate Mapping
const SVG_RANGES = {
    minY: 215, // South
    maxY: 10,  // North
    minX: 30,  // West
    maxX: 80   // East
}

function project(lat: number, lng: number) {
    const latPercent = (lat - MAP_BOUNDS.minLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)
    const lngPercent = (lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)
    const y = SVG_RANGES.minY - (latPercent * (SVG_RANGES.minY - SVG_RANGES.maxY))
    const x = SVG_RANGES.minX + (lngPercent * (SVG_RANGES.maxX - SVG_RANGES.minX))
    return { x, y }
}

const CITY_TRANSLATIONS: Record<string, string> = {
    'Tel Aviv': 'תל אביב',
    'Tel Aviv-Yafo': 'תל אביב',
    'Jerusalem': 'ירושלים',
    'Haifa': 'חיפה',
    'Rishon LeZion': 'ראשון לציון',
    'Rishon LeTsiyyon': 'ראשון לציון',
    'Rishon LetSiyyon': 'ראשון לציון',
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
    'Netivot': 'נתיבות',
    'Ofakim': 'אופקים',
    'Mitzpe Ramon': 'מצפה רמון',
    'Kiryat Bialik': 'קרית ביאליק',
    'Kiryat Motzkin': 'קרית מוצקין',
    'Kiryat Yam': 'קרית ים',
    'Zikhron Ya\'akov': 'זכרון יעקב',
    'Caesarea': 'קיסריה',
    'Arad': 'ערד',
    'Or Yehuda': 'אור יהודה'
}

const COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899']

import { useState } from 'react'
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function IsraelMapWidget({ locations }: { locations: any[] }) {
    const [sortMethod, setSortMethod] = useState<'ALPHA' | 'COUNT'>('ALPHA')
    const [currentPage, setCurrentPage] = useState(0)
    const ITEMS_PER_PAGE = 5

    // Sort locations
    const sortedLocations = [...locations].sort((a, b) => {
        if (sortMethod === 'COUNT') {
            return b._count.id - a._count.id
        }
        // Alpha (Hebrew if possible, then English)
        const nameA = CITY_TRANSLATIONS[a.city] || a.city
        const nameB = CITY_TRANSLATIONS[b.city] || b.city
        return nameA.localeCompare(nameB, 'he')
    })

    const totalPages = Math.ceil(sortedLocations.length / ITEMS_PER_PAGE)
    const paginatedLocations = sortedLocations.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE)

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < totalPages) {
            setCurrentPage(newPage)
        }
    }

    return (
        <Card className="p-6 h-[500px] shadow-sm relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50/50">
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <div className="w-48 h-96 bg-gray-400 rounded-full blur-3xl transform rotate-12"></div>
            </div>

            <div className="relative w-full h-full flex flex-row-reverse gap-4">
                {/* Visual Map Section (Right Side) */}
                <div className="flex-1 h-full relative flex items-center justify-center">
                    <svg viewBox="0 0 100 230" className="h-[98%] drop-shadow-xl overflow-visible">
                        {/* Land Mass */}
                        <path
                            d="M 64.5,5.5 L 61.3,9.7 L 60.1,16.2 L 54.4,19.3 L 50.8,17.9 L 48.0,19.6 L 46.1,23.4 L 47.9,32.2 L 44.9,34.9 L 45.4,43.2 L 42.1,48.5 L 39.5,60.1 L 37.3,66.8 L 33.8,70.9 L 32.1,84.0 L 32.2,95.5 L 34.0,105.1 L 28.5,108.6 L 24.1,114.2 L 24.9,122.3 L 31.9,121.7 L 34.1,128.4 L 33.7,137.9 L 35.8,145.7 L 39.6,155.0 L 41.7,169.2 L 44.1,185.3 L 45.9,208.5 L 48.2,217.4 L 51.5,217.4 L 51.8,211.2 L 53.6,193.3 L 55.4,183.1 L 58.7,175.7 L 61.1,165.7 L 63.4,151.7 L 63.2,143.6 L 68.7,136.2 L 69.3,124.7 L 65.6,115.6 L 71.9,105.2 L 80.6,105.1 L 85.3,101.9 L 85.1,96.5 L 75.8,92.1 L 70.8,90.3 L 68.7,85.2 L 70.2,74.9 L 69.3,66.7 L 70.0,61.0 L 71.4,56.8 L 74.0,46.8 L 73.0,38.1 L 69.4,32.4 L 69.3,27.1 L 73.1,23.1 L 71.7,18.0 L 75.6,10.6 Z"
                            fill="#FFFFFF"
                            stroke="#94A3B8"
                            strokeWidth="0.8"
                        />
                        {/* Kinneret */}
                        <path
                            d="M 69.4,32.4 C 70.8,33.5 71.5,35.5 70.3,37.2 C 69.1,38.8 68.0,37.5 67.5,35.9 C 68.0,34.5 68.5,33.0 69.4,32.4 Z"
                            fill="#38BDF8"
                            stroke="none"
                        />
                        {/* Dead Sea */}
                        <path
                            d="M 70.8,90.3 L 72.5,95.1 L 72.8,103.4 L 70.0,111.9 L 68.4,115.5 L 67.8,109.8 L 68.2,100.1 L 69.5,92.5 Z"
                            fill="#38BDF8"
                            stroke="none"
                        />

                        {locations.map((loc, i) => {
                            let coords = { x: 50, y: 100 } // fallback

                            // 1. Try exact lookup
                            const knownLoc = CITY_LOCATIONS[loc.city]
                            if (knownLoc) {
                                coords = project(knownLoc.lat, knownLoc.lng)
                            } else {
                                // 2. Fuzzy lookup
                                const match = Object.keys(CITY_LOCATIONS).find(k =>
                                    loc.city.toLowerCase().includes(k.toLowerCase()) ||
                                    k.toLowerCase().includes(loc.city.toLowerCase())
                                )
                                if (match) {
                                    coords = project(CITY_LOCATIONS[match].lat, CITY_LOCATIONS[match].lng)
                                } else {
                                    // 3. "Unknown" Pile - side of map
                                    coords = { x: 15, y: 150 + (i * 5) }
                                }
                            }

                            // Use specific color for this city index (consistent with list)
                            const color = COLORS[i % COLORS.length]

                            return (
                                <motion.g
                                    key={loc.city}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    {/* Small Pin / Dot */}
                                    <circle
                                        cx={coords.x}
                                        cy={coords.y}
                                        r="2" // Small fixed size "Pin"
                                        fill={color}
                                        stroke="white"
                                        strokeWidth="0.5"
                                        className="drop-shadow-md"
                                    />
                                    {/* Optional: Add a small pulse effect for visibility */}
                                    <circle
                                        cx={coords.x}
                                        cy={coords.y}
                                        r="3"
                                        fill={color}
                                        opacity="0.3"
                                    >
                                        <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
                                        <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                                    </circle>
                                </motion.g>
                            )
                        })}
                    </svg>

                    {locations.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                            אין נתוני מיקום זמינים לשבוע זה
                        </div>
                    )}
                </div>

                {/* Legend List Section (Left Side) */}
                <div className="w-1/3 min-w-[200px] flex flex-col gap-2 py-4 h-full">
                    <div className="flex flex-col gap-2 mb-2 sticky top-0 z-10 w-full">
                        {/* Sort Control */}
                        <div className="flex items-center gap-2 justify-start w-full">
                            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">מיון לפי:</span>
                            <Select value={sortMethod} onValueChange={(val: any) => setSortMethod(val)}>
                                <SelectTrigger className="h-7 text-xs w-[110px] bg-white/80">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALPHA">לפי א-ב</SelectItem>
                                    <SelectItem value="COUNT">לפי כמות</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col gap-2 pr-2 pb-0">
                        {paginatedLocations.map((loc, i) => {
                            const originalIndex = sortedLocations.indexOf(loc)
                            const color = COLORS[originalIndex % COLORS.length]
                            const cityName = CITY_TRANSLATIONS[loc.city] || loc.city

                            return (
                                <motion.div
                                    key={loc.city}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-white/60 hover:bg-white border border-transparent hover:border-blue-100 transition-all shadow-sm cursor-pointer"
                                    onMouseEnter={() => setHoveredCity(loc.city)}
                                    onMouseLeave={() => setHoveredCity(null)}
                                >
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                                        style={{ backgroundColor: color }}
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-800 line-clamp-1" title={cityName}>
                                            {cityName}
                                        </span>
                                        <span className="text-[10px] text-gray-500">
                                            {loc._count.id} מבקרים
                                        </span>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center bg-white/50 py-0.5 rounded-md mt-0.5 gap-1">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 0}
                                className="p-0.5 hover:bg-white rounded-full disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight size={12} />
                            </button>
                            <span className="text-[10px] text-gray-600 font-medium">
                                {currentPage + 1}/{totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages - 1}
                                className="p-0.5 hover:bg-white rounded-full disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft size={12} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    )
}
