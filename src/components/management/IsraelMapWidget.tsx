'use client'

import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'

import { ISRAEL_CITIES } from '@/lib/israel-cities'

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

const COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899']

import { useState } from 'react'
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function IsraelMapWidget({ locations }: { locations: any[] }) {
    const [sortMethod, setSortMethod] = useState<'ALPHA' | 'COUNT'>('ALPHA')
    const [currentPage, setCurrentPage] = useState(0)
    const [hoveredCity, setHoveredCity] = useState<string | null>(null)
    const ITEMS_PER_PAGE = 6

    // Sort locations
    const sortedLocations = [...locations].sort((a, b) => {
        if (sortMethod === 'COUNT') {
            return b._count.id - a._count.id
        }
        // Alpha (Hebrew if possible, then English)
        // Try to find the city in our big list
        const cityDataA = ISRAEL_CITIES[a.city] || Object.values(ISRAEL_CITIES).find(c => c.hebrewName === a.city)
        const cityDataB = ISRAEL_CITIES[b.city] || Object.values(ISRAEL_CITIES).find(c => c.hebrewName === b.city)

        const nameA = cityDataA?.hebrewName || a.city
        const nameB = cityDataB?.hebrewName || b.city

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

                        {sortedLocations.map((loc, originalIndex) => {
                            let coords = { x: 50, y: 100 } // fallback
                            let cityName = loc.city

                            // 1. Try exact match in our big list
                            let cityData = ISRAEL_CITIES[loc.city]

                            // 2. If not found, try to find by hebrew name reverse lookup or case insensitive
                            if (!cityData) {
                                // Fuzzy / Reverse lookup
                                const key = Object.keys(ISRAEL_CITIES).find(k =>
                                    k.toLowerCase() === loc.city.toLowerCase() ||
                                    ISRAEL_CITIES[k].hebrewName === loc.city
                                )
                                if (key) {
                                    cityData = ISRAEL_CITIES[key]
                                }
                            }

                            if (cityData) {
                                coords = project(cityData.lat, cityData.lng)
                                cityName = cityData.hebrewName // Always show Hebrew name if available
                            } else {
                                // "Unknown" Pile - side of map
                                coords = { x: 15, y: 150 + (originalIndex * 5) }
                            }

                            // Use same color index as in legend
                            const color = COLORS[originalIndex % COLORS.length]
                            const isHovered = hoveredCity === loc.city

                            return (
                                <motion.g
                                    key={loc.city}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: originalIndex * 0.1 }}
                                >
                                    {/* Small Pin / Dot */}
                                    <circle
                                        cx={coords.x}
                                        cy={coords.y}
                                        r={isHovered ? 4 : 2}
                                        fill={color}
                                        stroke={isHovered ? "white" : "white"}
                                        strokeWidth={isHovered ? "1.5" : "0.5"}
                                        className={`drop-shadow-md transition-all duration-200 ${isHovered ? 'opacity-100' : 'opacity-80'}`}
                                    />
                                    {/* Pulse effect - only when NOT hovered */}
                                    {!isHovered && (
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
                                    )}
                                    {/* Label on hover */}
                                    {isHovered && (
                                        <>
                                            <rect
                                                x={coords.x + 6}
                                                y={coords.y - 8}
                                                width={cityName.length * 5.5 + 4}
                                                height="14"
                                                fill="white"
                                                rx="2"
                                                className="drop-shadow-lg"
                                            />
                                            <text
                                                x={coords.x + 6 + (cityName.length * 5.5 + 4) / 2}
                                                y={coords.y - 1}
                                                fontSize="9"
                                                fontWeight="bold"
                                                fill="#1f2937"
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                className="select-none"
                                            >
                                                {cityName}
                                            </text>
                                        </>
                                    )}
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

                            // Lookup name
                            const cityData = ISRAEL_CITIES[loc.city] || Object.values(ISRAEL_CITIES).find(c => c.hebrewName === loc.city)
                            const cityName = cityData?.hebrewName || loc.city

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
